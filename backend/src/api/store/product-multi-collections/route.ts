import { Modules } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/types"
import { z } from "zod"

import ProductMultiCollectionService from "../../../modules/product-multi-collection/service"
import { PRODUCT_MULTI_COLLECTION_MODULE } from "../../../modules/product-multi-collection"

const querySchema = z.object({
  product_id: z.union([z.string(), z.array(z.string())]).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parsedQuery = querySchema.safeParse(req.query)

  if (!parsedQuery.success) {
    res.status(400).json({ message: "Invalid query", issues: parsedQuery.error.issues })
    return
  }

  const productIdsRaw = parsedQuery.data.product_id

  if (!productIdsRaw) {
    res.json({ items: [] })
    return
  }

  const productIds = Array.isArray(productIdsRaw)
    ? Array.from(new Set(productIdsRaw))
    : [productIdsRaw]

  if (!productIds.length) {
    res.json({ items: [] })
    return
  }

  const assignmentService = req.scope.resolve<ProductMultiCollectionService>(PRODUCT_MULTI_COLLECTION_MODULE)
  const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)

  const assignments = await assignmentService.listProductMultiCollections({
    product_id: productIds,
  })

  const grouped = new Map<string, string[]>()
  const allCollectionIds = new Set<string>()

  for (const assignment of assignments) {
    const existing = grouped.get(assignment.product_id) || []
    existing.push(assignment.collection_id)
    grouped.set(assignment.product_id, existing)
    allCollectionIds.add(assignment.collection_id)
  }

  const collections = await productService.listProductCollections({
    id: Array.from(allCollectionIds),
  })

  const collectionMap = new Map(collections.map((collection) => [collection.id, collection]))

  const items = productIds.map((productId) => {
    const collectionIds = grouped.get(productId) || []
    return {
      product_id: productId,
      collection_ids: collectionIds,
      collections: collectionIds
        .map((collectionId) => collectionMap.get(collectionId))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    }
  })

  res.json({ items })
}
