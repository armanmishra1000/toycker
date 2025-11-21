import { listPaginatedProducts } from "@lib/data/products"

export const fetchAvailabilityCounts = async (countryCode: string) => {
  const [inStock, outOfStock] = await Promise.all([
    listPaginatedProducts({ countryCode, availability: "in_stock", limit: 1 }),
    listPaginatedProducts({ countryCode, availability: "out_of_stock", limit: 1 }),
  ])

  return {
    inStock: inStock.response.count,
    outOfStock: outOfStock.response.count,
  }
}
