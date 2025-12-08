"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

import { getAuthHeaders } from "./cookies"

type StoreExclusiveCollectionEntry = {
  id: string
  product_id: string
  video_url: string
  poster_url: string | null
  sort_order: number | null
}

export type ExclusiveCollectionEntry = StoreExclusiveCollectionEntry & {
  product: HttpTypes.StoreProduct | null
}

const PRODUCT_FIELD_SELECTION = [
  "id",
  "title",
  "handle",
  "thumbnail",
  "*images",
  "+metadata",
  "*variants.calculated_price",
  "*variants.prices",
  "*variants.options",
  "*variants.inventory_quantity",
  "+variants.metadata",
].join(",")

export const listExclusiveCollections = async ({
  regionId,
}: {
  regionId: string
}): Promise<ExclusiveCollectionEntry[]> => {
  if (!regionId) {
    return []
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  let entries: StoreExclusiveCollectionEntry[] = []

  try {
    const payload = await sdk.client.fetch<{ entries: StoreExclusiveCollectionEntry[] }>(
      "/store/exclusive-collections",
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    )

    entries = payload.entries ?? []
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to load exclusive collections", error)
    }

    return []
  }

  if (!entries.length) {
    return []
  }

  const productIds = Array.from(new Set(entries.map((entry) => entry.product_id).filter(Boolean)))

  if (!productIds.length) {
    return entries.map((entry) => ({ ...entry, product: null }))
  }

  let products: HttpTypes.StoreProduct[] = []

  try {
    const payload = await sdk.client.fetch<{ products: HttpTypes.StoreProduct[] }>(
      "/store/products",
      {
        method: "GET",
        headers,
        cache: "no-store",
        query: {
          id: productIds,
          region_id: regionId,
          limit: productIds.length,
          fields: PRODUCT_FIELD_SELECTION,
        },
      },
    )

    products = payload.products ?? []
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to load exclusive collection products", error)
    }
  }

  const productMap = new Map(products.map((product) => [product.id, product]))

  return entries.map((entry) => ({
    ...entry,
    product: productMap.get(entry.product_id) ?? null,
  }))
}
