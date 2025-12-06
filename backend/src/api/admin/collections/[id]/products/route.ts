import {
  Modules,
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
  MedusaError,
} from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService, ProductCollectionDTO } from "@medusajs/types"

import ProductMultiCollectionService from "../../../../../modules/product-multi-collection/service"
import { PRODUCT_MULTI_COLLECTION_MODULE } from "../../../../../modules/product-multi-collection"

const normalizeIds = (ids?: string[]): string[] => {
  if (!ids?.length) {
    return []
  }

  return Array.from(
    new Set(
      ids.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    )
  )
}

const refetchCollection = async (
  collectionId: string,
  scope: MedusaRequest["scope"],
  fields?: string[]
): Promise<ProductCollectionDTO | undefined> => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const query = remoteQueryObjectFromString({
    entryPoint: "product_collection",
    variables: {
      filters: { id: collectionId },
    },
    fields: fields ?? ["id"],
  })

  const collections = await remoteQuery(query)
  return collections[0]
}

const ensureCollectionExists = async (
  service: IProductModuleService,
  collectionId: string
): Promise<void> => {
  try {
    await service.retrieveProductCollection(collectionId)
  } catch (error) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Collection not found")
  }
}

const ensureProductsExist = async (
  service: IProductModuleService,
  productIds: string[]
): Promise<void> => {
  if (!productIds.length) {
    return
  }

  const products = await service.listProducts(
    { id: productIds },
    {
      select: ["id"],
      take: productIds.length,
    }
  )

  const foundIds = new Set(products.map((product) => product.id))
  const missing = productIds.filter((id) => !foundIds.has(id))

  if (missing.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Products not found: ${missing.join(", ")}`
    )
  }
}

const syncPrimaryCollections = async (
  productService: IProductModuleService,
  assignmentService: ProductMultiCollectionService,
  additions: string[],
  removals: string[],
  collectionId: string
) => {
  const updates: { id: string; collection_id: string | null }[] = []

  if (additions.length) {
    const products = await productService.listProducts(
      { id: additions },
      {
        select: ["id", "collection_id"],
        take: additions.length,
      }
    )

    for (const product of products) {
      if (!product.collection_id) {
        updates.push({ id: product.id, collection_id: collectionId })
      }
    }
  }

  if (removals.length) {
    const products = await productService.listProducts(
      { id: removals },
      {
        select: ["id", "collection_id"],
        take: removals.length,
      }
    )

    const assignmentGroups = new Map<string, string[]>()
    const assignments = await assignmentService.listProductMultiCollections({ product_id: removals })

    assignments.forEach((assignment) => {
      const list = assignmentGroups.get(assignment.product_id) ?? []
      list.push(assignment.collection_id)
      assignmentGroups.set(assignment.product_id, list)
    })

    for (const product of products) {
      if (product.collection_id !== collectionId) {
        continue
      }

      const remainingCollections = assignmentGroups.get(product.id) ?? []
      updates.push({ id: product.id, collection_id: remainingCollections[0] ?? null })
    }
  }

  if (updates.length) {
    await Promise.all(
      updates.map((update) =>
        productService.updateProducts(update.id, {
          collection_id: update.collection_id,
        })
      )
    )
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const collectionId = req.params?.id

  if (!collectionId) {
    res.status(400).json({ message: "Collection ID is required" })
    return
  }

  const { add = [], remove = [] } = req.validatedBody as { add?: string[]; remove?: string[] }

  const additions = normalizeIds(add)
  const removals = normalizeIds(remove)

  const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)
  const assignmentService = req.scope.resolve<ProductMultiCollectionService>(PRODUCT_MULTI_COLLECTION_MODULE)

  await ensureCollectionExists(productService, collectionId)
  await ensureProductsExist(productService, additions)

  if (additions.length) {
    await assignmentService.addProductsToCollection(collectionId, additions)
  }

  if (removals.length) {
    await assignmentService.removeProductsFromCollection(collectionId, removals)
  }

  await syncPrimaryCollections(productService, assignmentService, additions, removals, collectionId)

  const collection = await refetchCollection(collectionId, req.scope, req.queryConfig.fields)

  res.status(200).json({ collection })
}
