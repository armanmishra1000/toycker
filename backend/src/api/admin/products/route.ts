import { createProductsWorkflow } from "@medusajs/core-flows"
import {
  MedusaRequest,
  MedusaResponse,
  refetchEntities,
  refetchEntity,
} from "@medusajs/framework/http"
import {
  FeatureFlag,
  Modules,
  isPresent,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"
import type { IProductModuleService, AdminCreateProduct } from "@medusajs/types"

import indexEngineFlag from "../../../feature-flags/index-engine"
import { remapKeysForProduct, remapProductResponse } from "./helpers"
import ProductMultiCollectionService from "../../../modules/product-multi-collection/service"
import { PRODUCT_MULTI_COLLECTION_MODULE } from "../../../modules/product-multi-collection"

const COLLECTION_FETCH_BATCH = 500

type FilterResult = {
  filters: Record<string, unknown>
  empty: boolean
}

const normalizeToArray = (value?: unknown): string[] => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
  }

  if (typeof value === "string" && value.length > 0) {
    return [value]
  }

  return []
}

const collectProductIdsForCollections = async (
  scope: MedusaRequest["scope"],
  collectionIds: string[]
): Promise<string[]> => {
  if (!collectionIds.length) {
    return []
  }

  const productService = scope.resolve<IProductModuleService>(Modules.PRODUCT)
  const assignmentService = scope.resolve<ProductMultiCollectionService>(PRODUCT_MULTI_COLLECTION_MODULE)

  const ids = new Set<string>()

  let skip = 0
  while (true) {
    const batch = await productService.listProducts(
      { collection_id: collectionIds },
      {
        select: ["id"],
        skip,
        take: COLLECTION_FETCH_BATCH,
      }
    )

    batch.forEach((product) => {
      if (product?.id) {
        ids.add(product.id)
      }
    })

    if (batch.length < COLLECTION_FETCH_BATCH) {
      break
    }

    skip += COLLECTION_FETCH_BATCH
  }

  const assignments = await assignmentService.listByCollections(collectionIds)
  assignments.forEach((assignment) => ids.add(assignment.product_id))

  return Array.from(ids)
}

const buildFilters = async (req: MedusaRequest): Promise<FilterResult> => {
  const filters: Record<string, unknown> = { ...req.filterableFields }
  const collectionFilter = normalizeToArray(filters.collection_id)

  if (!collectionFilter.length) {
    return { filters, empty: false }
  }

  delete filters.collection_id

  const productIds = await collectProductIdsForCollections(req.scope, collectionFilter)

  const existingIds = normalizeToArray(filters.id)

  let finalIds: string[]
  if (existingIds.length) {
    const existingSet = new Set(existingIds)
    finalIds = productIds.filter((id) => existingSet.has(id))
  } else {
    finalIds = productIds
  }

  if (!finalIds.length) {
    return { filters: { ...filters, id: ["__no_products__"] }, empty: true }
  }

  filters.id = finalIds

  return { filters, empty: false }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { filters, empty } = await buildFilters(req)

  if (empty) {
    const { skip = 0, take = 0 } = req.queryConfig.pagination ?? {}
    res.json({ products: [], count: 0, offset: skip, limit: take })
    return
  }

  if (FeatureFlag.isFeatureEnabled(indexEngineFlag.key)) {
    if (
      Object.keys(filters).length === 0 ||
      isPresent(filters.tags) ||
      isPresent(filters.categories)
    ) {
      return await getProducts(req, res, filters)
    }

    return await getProductsWithIndexEngine(req, res, filters)
  }

  return await getProducts(req, res, filters)
}

const getProducts = async (
  req: MedusaRequest,
  res: MedusaResponse,
  filters: Record<string, unknown>
) => {
  const selectFields = remapKeysForProduct(req.queryConfig.fields ?? [])
  const { data: products, metadata } = await refetchEntities({
    entity: "product",
    idOrFilter: filters,
    scope: req.scope,
    fields: selectFields,
    pagination: req.queryConfig.pagination,
    withDeleted: req.queryConfig.withDeleted,
  })

  res.json({
    products: products.map(remapProductResponse),
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}

const getProductsWithIndexEngine = async (
  req: MedusaRequest,
  res: MedusaResponse,
  filters: Record<string, unknown>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const nextFilters = { ...filters }

  if (isPresent(nextFilters.sales_channel_id)) {
    const salesChannelIds = normalizeToArray(nextFilters.sales_channel_id)
    if (salesChannelIds.length) {
      nextFilters["sales_channels"] ??= {}
      ;(nextFilters["sales_channels"] as Record<string, unknown>)["id"] = salesChannelIds
      delete nextFilters.sales_channel_id
    }
  }

  const { data: products, metadata } = await query.index({
    entity: "product",
    fields: req.queryConfig.fields ?? [],
    filters: nextFilters,
    pagination: req.queryConfig.pagination,
    withDeleted: req.queryConfig.withDeleted,
  })

  const safeMetadata = metadata ?? { estimate_count: 0, skip: 0, take: 0 }

  res.json({
    products: products.map(remapProductResponse),
    count: safeMetadata.estimate_count,
    estimate_count: safeMetadata.estimate_count,
    offset: safeMetadata.skip,
    limit: safeMetadata.take,
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const validatedBody = req.validatedBody as AdminCreateProduct & {
    additional_data?: Record<string, unknown>
  }

  const { additional_data, ...products } = validatedBody

  const { result } = await createProductsWorkflow(req.scope).run({
    input: { products: [products], additional_data },
  })

  const product = await refetchEntity({
    entity: "product",
    idOrFilter: result[0].id,
    scope: req.scope,
    fields: remapKeysForProduct(req.queryConfig.fields ?? []),
  })

  res.status(200).json({ product: remapProductResponse(product) })
}
