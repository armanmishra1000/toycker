import { MedusaService } from "@medusajs/framework/utils"

import ProductMultiCollection from "./models/product-multi-collection"

class ProductMultiCollectionService extends MedusaService({
  ProductMultiCollection,
}) {
  async listByProduct(productId: string) {
    return await this.listProductMultiCollections({ product_id: productId })
  }

  async listByCollection(collectionId: string) {
    return await this.listProductMultiCollections({ collection_id: collectionId })
  }

  async listByCollections(collectionIds: string[]) {
    if (!collectionIds.length) {
      return []
    }

    return await this.listProductMultiCollections({ collection_id: collectionIds })
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

  async replaceForCollection(collectionId: string, productIds: string[]) {
    const normalizedIds = Array.from(new Set(productIds.filter(Boolean)))

    const existing = await this.listProductMultiCollections({ collection_id: collectionId })
    const existingMap = new Map(existing.map((entry) => [entry.product_id, entry]))

    const desiredSet = new Set(normalizedIds)

    const toCreate = normalizedIds
      .filter((productId) => !existingMap.has(productId))
      .map((product_id) => ({ product_id, collection_id: collectionId }))

    const toDelete = existing
      .filter((entry) => !desiredSet.has(entry.product_id))
      .map((entry) => entry.id)

    if (toDelete.length) {
      await this.deleteProductMultiCollections(toDelete)
    }

    if (toCreate.length) {
      await this.createProductMultiCollections(toCreate)
    }

    return await this.listProductMultiCollections({ collection_id: collectionId })
  }

  async addProductsToCollection(collectionId: string, productIds: string[]) {
    const normalizedIds = Array.from(new Set(productIds.filter(Boolean)))

    if (!normalizedIds.length) {
      return
    }

    const existing = await this.listProductMultiCollections({
      collection_id: collectionId,
      product_id: normalizedIds,
    })

    const existingSet = new Set(existing.map((entry) => entry.product_id))

    const toCreate = normalizedIds
      .filter((productId) => !existingSet.has(productId))
      .map((product_id) => ({ product_id, collection_id: collectionId }))

    if (toCreate.length) {
      await this.createProductMultiCollections(toCreate)
    }
  }

  async removeProductsFromCollection(collectionId: string, productIds: string[]) {
    const normalizedIds = Array.from(new Set(productIds.filter(Boolean)))

    if (!normalizedIds.length) {
      return
    }

    const existing = await this.listProductMultiCollections({
      collection_id: collectionId,
      product_id: normalizedIds,
    })

    const toDelete = existing.map((entry) => entry.id)

    if (toDelete.length) {
      await this.deleteProductMultiCollections(toDelete)
    }
  }
}

export default ProductMultiCollectionService
