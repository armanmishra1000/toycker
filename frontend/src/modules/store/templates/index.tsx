import { listCategories } from "@lib/data/categories"
import { getStoreStats, listPaginatedProducts } from "@lib/data/products"
import type { HttpTypes } from "@medusajs/types"
import RefinementList from "@modules/store/components/refinement-list"
import {
  AvailabilityFilter,
  PriceRangeFilter,
  SortOptions,
  ViewMode,
} from "@modules/store/components/refinement-list/types"
import { ageCategories } from "@modules/layout/config/navigation"
import { StorefrontFiltersProvider } from "@modules/store/context/storefront-filters"
import ProductGridSection from "@modules/store/components/product-grid-section"
import { STORE_PRODUCT_PAGE_SIZE } from "@modules/store/constants"
import { fetchAvailabilityCounts } from "@modules/store/utils/availability"

const StoreHero = ({ totalCount }: { totalCount: number }) => (
  <section className="rounded-2xl border border-ui-border-base bg-ui-bg-subtle px-6 py-8 shadow-elevation-card-rest">
    <p className="text-sm uppercase tracking-wide text-ui-fg-muted">
      Toycker flagship collection
    </p>
    <h1 className="mt-3 text-3xl font-semibold" data-testid="store-page-title">
      Discover every toy in one place
    </h1>
    <p className="mt-2 text-base text-ui-fg-subtle">
      {totalCount > 0
        ? `Browse ${totalCount} creative toys added through the Medusa admin panel. Each item listed there appears here automatically.`
        : "No products are live yet. Add toys from the Medusa admin panel to populate this page."}
    </p>
  </section>
)

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  searchQuery,
  availability,
  priceRange,
  ageFilter,
  categoryId,
  viewMode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  searchQuery?: string
  availability?: AvailabilityFilter
  priceRange?: PriceRangeFilter
  ageFilter?: string
  categoryId?: string
  viewMode?: ViewMode
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "featured"
  const resolvedViewMode = viewMode || "grid-3"

  const [{ count }, categories, availabilityCounts] = await Promise.all([
    getStoreStats({ countryCode }),
    listCategories({ limit: 100, include_descendants_tree: true }),
    fetchAvailabilityCounts(countryCode),
  ])

  const productQueryParams: HttpTypes.FindParams & HttpTypes.StoreProductListParams = {}

  if (categoryId) {
    productQueryParams["category_id"] = [categoryId]
  }

  if (searchQuery) {
    productQueryParams["q"] = searchQuery
  }

  const effectiveProductQueryParams: (HttpTypes.FindParams & HttpTypes.StoreProductListParams) | undefined =
    Object.keys(productQueryParams).length ? productQueryParams : undefined

  const {
    response: { products: initialProducts, count: initialCount },
  } = await listPaginatedProducts({
    page: pageNumber,
    limit: STORE_PRODUCT_PAGE_SIZE,
    queryParams: effectiveProductQueryParams,
    sortBy: sort,
    countryCode,
    availability,
    priceFilter: priceRange,
    ageFilter,
  })

  const prioritizedCategories = ["Merch", "Pants", "Shirts", "Sweatshirts"]

  const categoryOptions = categories
    ?.filter((category) => {
      if ("is_active" in category) {
        return (category as { is_active?: boolean }).is_active !== false
      }
      return true
    })
    .map((category) => ({ value: category.id, label: category.name }))
    .sort((a, b) => {
      const aIndex = prioritizedCategories.indexOf(a.label)
      const bIndex = prioritizedCategories.indexOf(b.label)

      if (aIndex !== -1 || bIndex !== -1) {
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      }

      return a.label.localeCompare(b.label)
    })
    ?? []

  const ageOptions = ageCategories.map((age) => ({ value: age.id, label: age.label }))

  const availabilityOptions = [
    {
      value: "in_stock" as AvailabilityFilter,
      label: "In stock",
      count: availabilityCounts.inStock,
    },
    {
      value: "out_of_stock" as AvailabilityFilter,
      label: "Out of stock",
      count: availabilityCounts.outOfStock,
    },
  ]

  return (
    <StorefrontFiltersProvider
      countryCode={countryCode}
      initialFilters={{
        sortBy: sort,
        page: pageNumber,
        searchQuery,
        availability,
        priceRange,
        age: ageFilter,
        categoryId,
        viewMode: resolvedViewMode,
      }}
      initialProducts={initialProducts}
      initialCount={initialCount}
      pageSize={STORE_PRODUCT_PAGE_SIZE}
    >
      <div className="content-container space-y-8 py-6" data-testid="category-container">
        <StoreHero totalCount={count} />
        <div className="flex flex-col gap-10 small:flex-row">
          <div className="small:min-w-[260px] small:max-w-xs">
            <RefinementList
              searchQuery={searchQuery}
              selectedFilters={{
                availability,
                priceMin: priceRange?.min,
                priceMax: priceRange?.max,
                age: ageFilter,
                category: categoryId,
              }}
              filterOptions={{
                availability: availabilityOptions,
                ages: ageOptions,
                categories: categoryOptions,
              }}
            />
          </div>
          <div className="w-full">
            <ProductGridSection
              title="All products"
              products={initialProducts}
              totalCount={initialCount}
              page={pageNumber}
              viewMode={resolvedViewMode}
              sortBy={sort}
              pageSize={STORE_PRODUCT_PAGE_SIZE}
              totalCountHint={count}
            />
          </div>
        </div>
      </div>
    </StorefrontFiltersProvider>
  )
}

export default StoreTemplate
