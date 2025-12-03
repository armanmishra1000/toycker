import { cookies } from "next/headers"

import { listPaginatedProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import {
  AvailabilityFilter,
  PriceRangeFilter,
  SortOptions,
  ViewMode,
} from "@modules/store/components/refinement-list/types"
import ProductGridSection from "@modules/store/components/product-grid-section"
import { STORE_PRODUCT_PAGE_SIZE } from "@modules/store/constants"

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  q?: string
}

type PaginatedProductsProps = {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  title?: string
  searchQuery?: string
  totalCountHint?: number
  filters?: {
    availability?: AvailabilityFilter
    price?: PriceRangeFilter
    age?: string
  }
  viewMode?: ViewMode
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  title = "All products",
  searchQuery,
  totalCountHint,
  filters,
  viewMode,
}: PaginatedProductsProps) {
  const queryParams: PaginatedProductsParams = {
    limit: STORE_PRODUCT_PAGE_SIZE,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (searchQuery) {
    queryParams["q"] = searchQuery
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products, count },
  } = await listPaginatedProducts({
    page,
    limit: STORE_PRODUCT_PAGE_SIZE,
    queryParams,
    sortBy,
    countryCode,
    availability: filters?.availability,
    priceFilter: filters?.price,
    ageFilter: filters?.age,
  })

  const totalCount = typeof count === "number" ? count : totalCountHint ?? 0
  const resolvedViewMode = viewMode || "grid-4"
  const resolvedSort = sortBy || "featured"

  const accountPath = `/${countryCode}/account`
  const cookieStore = await cookies()
  const isCustomerLoggedIn = Boolean(cookieStore.get("_medusa_jwt"))

  return (
    <ProductGridSection
      title={title}
      products={products}
      totalCount={totalCount}
      page={page}
      viewMode={resolvedViewMode}
      sortBy={resolvedSort}
      pageSize={STORE_PRODUCT_PAGE_SIZE}
      totalCountHint={totalCountHint}
      isCustomerLoggedIn={isCustomerLoggedIn}
      loginPath={accountPath}
    />
  )
}
