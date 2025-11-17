"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import {
  AvailabilityFilter,
  PriceRangeFilter,
  SortOptions,
} from "@modules/store/components/refinement-list/types"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,",
          ...queryParams,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

const ORDER_MAP: Record<SortOptions, string | undefined> = {
  featured: "-created_at",
  best_selling: undefined,
  alpha_asc: "title",
  alpha_desc: "-title",
  price_asc: undefined,
  price_desc: undefined,
  date_old_new: "created_at",
  date_new_old: "-created_at",
}

const AGE_METADATA_KEY = "age_band"
const CLIENT_SCAN_LIMIT = 600
const CLIENT_SCAN_MAX_PAGES = 50

const convertMajorToMinor = (value: number) => Math.round(value * 100)

const isProductInStock = (product: HttpTypes.StoreProduct) => {
  return product.variants?.some((variant) => {
    if (variant?.manage_inventory === false) {
      return true
    }

    const quantity = variant?.inventory_quantity ?? 0
    return quantity > 0
  })
}

const matchesPriceFilter = (product: HttpTypes.StoreProduct, priceFilter?: PriceRangeFilter) => {
  if (!priceFilter || (priceFilter.min === undefined && priceFilter.max === undefined)) {
    return true
  }

  const cheapestPrice = getProductPrice({ product }).cheapestPrice

  if (!cheapestPrice) {
    return false
  }
  const amount = cheapestPrice.calculated_price_number

  const min =
    typeof priceFilter.min === "number" ? convertMajorToMinor(Math.max(priceFilter.min, 0)) : undefined
  const max =
    typeof priceFilter.max === "number" ? convertMajorToMinor(Math.max(priceFilter.max, 0)) : undefined

  if (min !== undefined && amount < min) {
    return false
  }

  if (max !== undefined && amount > max) {
    return false
  }

  return true
}

const matchesAgeFilter = (product: HttpTypes.StoreProduct, ageFilter?: string) => {
  if (!ageFilter) {
    return true
  }

  const metadataValue = product.metadata?.[AGE_METADATA_KEY]

  if (!metadataValue || typeof metadataValue !== "string") {
    return false
  }

  return metadataValue.toLowerCase() === ageFilter.toLowerCase()
}

const applyClientSideFilters = (
  product: HttpTypes.StoreProduct,
  filters: {
    availability?: AvailabilityFilter
    price?: PriceRangeFilter
    age?: string
  }
) => {
  const inStock = isProductInStock(product)

  if (filters.availability === "in_stock" && !inStock) {
    return false
  }

  if (filters.availability === "out_of_stock" && inStock) {
    return false
  }

  if (!matchesPriceFilter(product, filters.price)) {
    return false
  }

  if (!matchesAgeFilter(product, filters.age)) {
    return false
  }

  return true
}

type ListPaginatedProductsArgs = {
  page?: number
  limit?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  sortBy?: SortOptions
  countryCode: string
  availability?: AvailabilityFilter
  priceFilter?: PriceRangeFilter
  ageFilter?: string
}

export const listPaginatedProducts = async ({
  page = 1,
  limit = 12,
  queryParams,
  sortBy = "featured",
  countryCode,
  availability,
  priceFilter,
  ageFilter,
}: ListPaginatedProductsArgs): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  pagination: { page: number; limit: number }
}> => {
  const normalizedPage = Math.max(page, 1)
  const requiresClientSideSorting = sortBy === "price_asc" || sortBy === "price_desc"
  const requiresClientSideFiltering = Boolean(availability || priceFilter || ageFilter)
  const needsFullScan = requiresClientSideFiltering || requiresClientSideSorting
  const order = ORDER_MAP[sortBy]
  const baseQuery = {
    ...queryParams,
    ...(order ? { order } : {}),
  }

  if (!needsFullScan) {
    const {
      response: { products, count },
    } = await listProducts({
      pageParam: normalizedPage,
      queryParams: {
        ...baseQuery,
        limit,
      },
      countryCode,
    })

    return {
      response: {
        products,
        count,
      },
      pagination: {
        page: normalizedPage,
        limit,
      },
    }
  }

  const aggregated: HttpTypes.StoreProduct[] = []
  let cursor = 1
  let iterations = 0
  const chunkSize = Math.max(limit, 24)

  while (iterations < CLIENT_SCAN_MAX_PAGES && aggregated.length < CLIENT_SCAN_LIMIT) {
    iterations += 1
    const { response, nextPage } = await listProducts({
      pageParam: cursor,
      queryParams: {
        ...baseQuery,
        limit: chunkSize,
      },
      countryCode,
    })

    aggregated.push(...response.products)

    if (!nextPage) {
      break
    }

    cursor = nextPage
  }

  const filteredProducts = aggregated.filter((product) =>
    applyClientSideFilters(product, {
      availability,
      price: priceFilter,
      age: ageFilter,
    })
  )

  const sortedProducts = requiresClientSideSorting
    ? sortProducts(filteredProducts, sortBy)
    : filteredProducts

  const offset = (normalizedPage - 1) * limit
  const paginatedProducts = sortedProducts.slice(offset, offset + limit)

  return {
    response: {
      products: paginatedProducts,
      count: sortedProducts.length,
    },
    pagination: {
      page: normalizedPage,
      limit,
    },
  }
}

export const getStoreStats = async ({
  countryCode,
  queryParams,
}: {
  countryCode: string
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}) => {
  const {
    response: { count },
  } = await listProducts({
    pageParam: 1,
    queryParams: {
      limit: 1,
      ...queryParams,
    },
    countryCode,
  })

  return { count }
}
