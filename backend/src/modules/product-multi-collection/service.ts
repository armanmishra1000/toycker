import { MedusaService } from "@medusajs/framework/utils"

import ProductMultiCollection from "./models/product-multi-collection"

class ProductMultiCollectionService extends MedusaService({
  ProductMultiCollection,
}) {
  async listByProduct(productId: string) {
    return await this.listProductMultiCollections({ product_id: productId })
  }

  async replaceAssignments(productId: string, collectionIds: string[]) {
    const normalizedIds = Array.from(new Set(collectionIds.filter(Boolean)))

    const existing = await this.listProductMultiCollections({ product_id: productId })
    const existingMap = new Map(existing.map((entry) => [entry.collection_id, entry]))

    const desiredSet = new Set(normalizedIds)

    const toCreate = normalizedIds
      .filter((collectionId) => !existingMap.has(collectionId))
      .map((collection_id) => ({ product_id: productId, collection_id }))

    const toDelete = existing
      .filter((entry) => !desiredSet.has(entry.collection_id))
      .map((entry) => entry.id)

    if (toDelete.length) {
      await this.deleteProductMultiCollections(toDelete)
    }

    if (toCreate.length) {
      await this.createProductMultiCollections(toCreate)
    }

    return await this.listProductMultiCollections({ product_id: productId })
  }
}

export default ProductMultiCollectionService
