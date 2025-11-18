import { listPaginatedProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import ResultsToolbar from "@modules/store/components/results-toolbar"
import {
  AvailabilityFilter,
  PriceRangeFilter,
  SortOptions,
  ViewMode,
} from "@modules/store/components/refinement-list/types"

const PRODUCT_LIMIT = 12

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

const EmptyState = ({ heading }: { heading: string }) => (
  <div className="rounded-xl border border-dashed border-ui-border-strong bg-ui-bg-base px-6 py-12 text-center">
    <p className="text-lg font-medium text-ui-fg-base">
      {`We couldn't find any ${heading.toLowerCase()}.`}
    </p>
    <p className="mt-2 text-sm text-ui-fg-subtle">
      Try adjusting your filters or add new products from the Medusa admin.
    </p>
  </div>
)

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
    limit: PRODUCT_LIMIT,
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
    limit: PRODUCT_LIMIT,
    queryParams,
    sortBy,
    countryCode,
    availability: filters?.availability,
    priceFilter: filters?.price,
    ageFilter: filters?.age,
  })

  const totalCount = typeof count === "number" ? count : totalCountHint ?? 0
  const totalPages = Math.ceil(totalCount / PRODUCT_LIMIT) || 1
  const hasProducts = products.length > 0
  const resolvedViewMode = viewMode || "grid-3"
  const resolvedSort = sortBy || "featured"

  const gridClassName = (() => {
    if (resolvedViewMode === "grid-4") {
      return "grid w-full grid-cols-1 gap-x-6 gap-y-10 small:grid-cols-2 medium:grid-cols-4"
    }

    if (resolvedViewMode === "list") {
      return "flex w-full flex-col gap-5"
    }

    return "grid w-full grid-cols-1 gap-x-6 gap-y-10 small:grid-cols-2 medium:grid-cols-3"
  })()

  return (
    <section className="space-y-6">
      <ResultsToolbar totalCount={totalCount} viewMode={resolvedViewMode} sortBy={resolvedSort} />
      {hasProducts ? (
        <>
          {resolvedViewMode === "list" ? (
            <div className={gridClassName} data-testid="products-list">
              {products.map((p) => (
                <ProductPreview key={p.id} product={p} viewMode={resolvedViewMode} />
              ))}
            </div>
          ) : (
            <ul className={gridClassName} data-testid="products-list">
              {products.map((p) => (
                <li key={p.id}>
                  <ProductPreview product={p} viewMode={resolvedViewMode} />
                </li>
              ))}
            </ul>
          )}
          {totalPages > 1 && (
            <Pagination
              data-testid="product-pagination"
              page={page}
              totalPages={totalPages}
            />
          )}
        </>
      ) : (
        <EmptyState heading={title} />
      )}
    </section>
  )
}
