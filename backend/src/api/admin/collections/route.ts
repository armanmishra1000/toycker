import { createCollectionsWorkflow } from "@medusajs/core-flows"
import { ContainerRegistrationKeys, remoteQueryObjectFromString } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { CreateProductCollectionDTO, ProductCollectionDTO } from "@medusajs/types"

import ProductMultiCollectionService from "../../../modules/product-multi-collection/service"
import { PRODUCT_MULTI_COLLECTION_MODULE } from "../../../modules/product-multi-collection"

type CollectionWithProducts = Omit<ProductCollectionDTO, "products"> & {
  products?: Record<string, unknown>[] | null
}

const normalizeFieldName = (field?: string) => field?.replace(/^[+-]/, "") ?? ""

const extractProductFields = (fields: string[]) => {
  const normalized = fields
    .map(normalizeFieldName)
    .filter((field) => field === "products" || field.startsWith("products."))

  if (!normalized.length) {
    return { includeProducts: false, productFields: [] as string[] }
  }

  const productFields = normalized
    .map((field) => field.replace(/^products\.\??/, ""))
    .filter(Boolean)

  if (!productFields.length) {
    productFields.push("id")
  }

  return {
    includeProducts: true,
    productFields: Array.from(new Set(productFields)),
  }
}

const ensureProductAssignments = async (
  req: MedusaRequest,
  collections: CollectionWithProducts[],
  productFields: string[]
) => {
  if (!collections.length) {
    return
  }

  const collectionIdToProductMap = new Map<string, Map<string, Record<string, unknown>>>()

  for (const collection of collections) {
    const existingProducts = Array.isArray(collection.products)
      ? (collection.products as Record<string, unknown>[])
      : []

    const productMap = new Map<string, Record<string, unknown>>()
    for (const product of existingProducts) {
      const productId = product?.id
      if (typeof productId === "string" && productId.length) {
        productMap.set(productId, product)
      }
    }

    collectionIdToProductMap.set(collection.id, productMap)
  }

  const assignmentService = req.scope.resolve<ProductMultiCollectionService>(
    PRODUCT_MULTI_COLLECTION_MODULE
  )

  const assignments = await assignmentService.listByCollections(collections.map((collection) => collection.id))

  const missingProductIds = new Set<string>()

  for (const assignment of assignments) {
    const map = collectionIdToProductMap.get(assignment.collection_id)
    if (!map) {
      continue
    }

    if (!map.has(assignment.product_id)) {
      map.set(assignment.product_id, { id: assignment.product_id })
      missingProductIds.add(assignment.product_id)
    }
  }

  let additionalProducts = new Map<string, Record<string, unknown>>()

  if (missingProductIds.size) {
    const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

    const productQuery = remoteQueryObjectFromString({
      entryPoint: "product",
      variables: {
        filters: { id: Array.from(missingProductIds) },
      },
      fields: productFields.length ? productFields : ["id"],
    })

    const productResults = (await remoteQuery(productQuery)) as Record<string, unknown>[]

    additionalProducts = new Map(
      productResults
        .filter((product) => typeof product?.id === "string")
        .map((product) => [product.id as string, product])
    )
  }

  for (const collection of collections) {
    const map = collectionIdToProductMap.get(collection.id)
    if (!map) {
      continue
    }

    for (const [productId, product] of map.entries()) {
      if (product && product !== null) {
        continue
      }

      const hydrated = additionalProducts.get(productId)
      if (hydrated) {
        map.set(productId, hydrated)
      }
    }

    collection.products = Array.from(map.values()) as Record<string, unknown>[]
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const query = remoteQueryObjectFromString({
    entryPoint: "product_collection",
    variables: {
      filters: req.filterableFields,
      ...req.queryConfig.pagination,
    },
    fields: req.queryConfig.fields,
  })

  const { rows: collections, metadata } = await remoteQuery(query)

  const fields = Array.isArray(req.queryConfig.fields) ? req.queryConfig.fields : []
  const { includeProducts, productFields } = extractProductFields(fields)

  if (includeProducts) {
    await ensureProductAssignments(req, collections as CollectionWithProducts[], productFields)
  }

  res.json({
    collections,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const payload = req.validatedBody as CreateProductCollectionDTO & {
    additional_data?: Record<string, unknown>
  }

  const { additional_data, ...rest } = payload

  const { result } = await createCollectionsWorkflow(req.scope).run({
    input: { collections: [rest], additional_data },
  })

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const collectionQuery = remoteQueryObjectFromString({
    entryPoint: "product_collection",
    variables: {
      filters: { id: result[0].id },
    },
    fields: req.queryConfig.fields,
  })

  const [collection] = (await remoteQuery(collectionQuery)) as CollectionWithProducts[]

  res.status(200).json({ collection })
}
