import { Modules } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/types"

import ProductMultiCollectionService from "../../../../../modules/product-multi-collection/service"
import { PRODUCT_MULTI_COLLECTION_MODULE } from "../../../../../modules/product-multi-collection"

const PAGE_SIZE = 200

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const collectionId = req.params?.id

  if (!collectionId) {
    res.status(400).json({ message: "Collection ID is required" })
    return
  }

  const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)
  const assignmentService = req.scope.resolve<ProductMultiCollectionService>(PRODUCT_MULTI_COLLECTION_MODULE)

  const productIds = new Set<string>()

  let skip = 0

  while (true) {
    const batch = await productService.listProducts(
      { collection_id: [collectionId] },
      {
        select: ["id"],
        skip,
        take: PAGE_SIZE,
      }
    )

    if (!batch.length) {
      break
    }

    for (const product of batch) {
      if (product?.id) {
        productIds.add(product.id)
      }
    }

    if (batch.length < PAGE_SIZE) {
      break
    }

    skip += PAGE_SIZE
  }

  const assignments = await assignmentService.listProductMultiCollections({
    collection_id: collectionId,
  })

  for (const assignment of assignments) {
    productIds.add(assignment.product_id)
  }

  res.json({
    collection_id: collectionId,
    product_ids: Array.from(productIds),
  })
}
