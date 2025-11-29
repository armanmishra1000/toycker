"use server"

import { listProducts } from "@lib/data/products"
import { getCollectionByHandle } from "@lib/data/collections"
import type { HttpTypes } from "@medusajs/types"

type GetCollectionProductsArgs = {
  handle: string
  regionId: string
  limit?: number
}

export const getCollectionProductsByHandle = async ({
  handle,
  regionId,
  limit = 5,
}: GetCollectionProductsArgs): Promise<HttpTypes.StoreProduct[]> => {
  const collection = await getCollectionByHandle(handle)

  if (!collection?.id) {
    return []
  }

  const {
    response: { products },
  } = await listProducts({
    regionId,
    queryParams: {
      collection_id: [collection.id],
      limit,
    },
  })

  return products
}
