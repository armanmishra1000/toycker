import { Modules } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService, ProductCollectionDTO } from "@medusajs/types"
import { z } from "zod"

import ProductMultiCollectionService from "../../../../../modules/product-multi-collection/service"
import { PRODUCT_MULTI_COLLECTION_MODULE } from "../../../../../modules/product-multi-collection"

const bodySchema = z.object({
  collection_ids: z.array(z.string()).default([]),
})

const normalizeCollectionIds = (ids: string[]) => {
  return Array.from(new Set(ids.filter((entry) => typeof entry === "string" && entry.trim().length > 0)))
}

const fetchCollections = async (
  productService: IProductModuleService,
  collectionIds: string[]
): Promise<ProductCollectionDTO[]> => {
  if (!collectionIds.length) {
    return []
  }

  return await productService.listProductCollections({
    id: collectionIds,
  })
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params?.id

  if (!productId) {
    res.status(400).json({ message: "Product ID is required" })
    return
  }

  const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)
  const assignmentService = req.scope.resolve<ProductMultiCollectionService>(PRODUCT_MULTI_COLLECTION_MODULE)

  try {
    await productService.retrieveProduct(productId)
  } catch (error) {
    res.status(404).json({ message: "Product not found" })
    return
  }

  const assignments = await assignmentService.listByProduct(productId)
  const collectionIds = assignments.map((entry) => entry.collection_id)
  const collections = await fetchCollections(productService, collectionIds)

  res.json({ product_id: productId, collection_ids: collectionIds, collections })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params?.id

  if (!productId) {
    res.status(400).json({ message: "Product ID is required" })
    return
  }

  const parsedBody = bodySchema.safeParse(req.body)

  if (!parsedBody.success) {
    res.status(400).json({ message: "Invalid payload", issues: parsedBody.error.issues })
    return
  }

  const desiredIds = normalizeCollectionIds(parsedBody.data.collection_ids)

  const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)
  const assignmentService = req.scope.resolve<ProductMultiCollectionService>(PRODUCT_MULTI_COLLECTION_MODULE)

  try {
    await productService.retrieveProduct(productId)
  } catch (error) {
    res.status(404).json({ message: "Product not found" })
    return
  }

  if (desiredIds.length) {
    const availableCollections = await fetchCollections(productService, desiredIds)
    const validIdSet = new Set(availableCollections.map((collection) => collection.id))
    const invalidIds = desiredIds.filter((collectionId) => !validIdSet.has(collectionId))

    if (invalidIds.length) {
      res.status(400).json({
        message: "Some collections do not exist",
        invalid_ids: invalidIds,
      })
      return
    }
  }

  const updatedAssignments = await assignmentService.replaceAssignments(productId, desiredIds)
  const updatedCollections = await fetchCollections(
    productService,
    updatedAssignments.map((entry) => entry.collection_id)
  )

  res.json({
    product_id: productId,
    collection_ids: updatedAssignments.map((entry) => entry.collection_id),
    collections: updatedCollections,
  })
}
