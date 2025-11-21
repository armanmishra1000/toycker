import { listPaginatedProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions, ViewMode } from "@modules/store/components/refinement-list/types"
import ProductGridSection from "@modules/store/components/product-grid-section"
import { StorefrontFiltersProvider } from "@modules/store/context/storefront-filters"
import { STORE_PRODUCT_PAGE_SIZE } from "@modules/store/constants"
import { fetchAvailabilityCounts } from "@modules/store/utils/availability"
import FilterDrawer from "@modules/store/components/filter-drawer"

export default async function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "featured"
  const defaultViewMode: ViewMode = "grid-4"

  const [{ inStock, outOfStock }, {
    response: { products: initialProducts, count: initialCount },
  }] = await Promise.all([
    fetchAvailabilityCounts(countryCode),
    listPaginatedProducts({
      page: pageNumber,
      limit: STORE_PRODUCT_PAGE_SIZE,
      sortBy: sort,
      countryCode,
      queryParams: {
        collection_id: [collection.id],
      },
    }),
  ])

  const availabilityOptions = [
    { value: "in_stock", label: "In stock", count: inStock },
    { value: "out_of_stock", label: "Out of stock", count: outOfStock },
  ]

  return (
    <StorefrontFiltersProvider
      countryCode={countryCode}
      initialFilters={{
        sortBy: sort,
        page: pageNumber,
        viewMode: defaultViewMode,
        collectionId: collection.id,
      }}
      initialProducts={initialProducts}
      initialCount={initialCount}
      pageSize={STORE_PRODUCT_PAGE_SIZE}
    >
      <FilterDrawer filterOptions={{ availability: availabilityOptions }}>
        <div className="content-container py-6">
          <div className="mb-8 text-2xl-semi">
            <h1>{collection.title}</h1>
          </div>
          <ProductGridSection
            title={collection.title}
            products={initialProducts}
            totalCount={initialCount}
            page={pageNumber}
            viewMode={defaultViewMode}
            sortBy={sort}
            pageSize={STORE_PRODUCT_PAGE_SIZE}
          />
        </div>
      </FilterDrawer>
    </StorefrontFiltersProvider>
  )
}
