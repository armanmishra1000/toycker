import { retrieveCustomer } from "@lib/data/customer"
import { listPaginatedProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions, ViewMode } from "@modules/store/components/refinement-list/types"
import ProductGridSection from "@modules/store/components/product-grid-section"
import { StorefrontFiltersProvider } from "@modules/store/context/storefront-filters"
import { STORE_PRODUCT_PAGE_SIZE } from "@modules/store/constants"
import { fetchAvailabilityCounts } from "@modules/store/utils/availability"
import FilterDrawer from "@modules/store/components/filter-drawer"
import Breadcrumbs from "@modules/common/components/breadcrumbs"

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

  const [availabilityCounts, productListing, customer] = await Promise.all([
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
    retrieveCustomer(),
  ])

  const { inStock, outOfStock } = availabilityCounts
  const {
    response: { products: initialProducts, count: initialCount },
  } = productListing

  const availabilityOptions = [
    { value: "in_stock", label: "In stock", count: inStock },
    { value: "out_of_stock", label: "Out of stock", count: outOfStock },
  ]

  const accountPath = `/${countryCode}/account`

  return (
    <StorefrontFiltersProvider
      countryCode={countryCode}
      initialFilters={{
        sortBy: sort,
        page: pageNumber,
        viewMode: defaultViewMode,
      }}
      initialProducts={initialProducts}
      initialCount={initialCount}
      pageSize={STORE_PRODUCT_PAGE_SIZE}
      fixedCollectionId={collection.id}
    >
      <FilterDrawer filterOptions={{ availability: availabilityOptions }}>
        <div className="mx-auto p-4 max-w-[1440px]">
          <Breadcrumbs
            className="mb-6"
            items={[
              { label: "Store", href: "/store" },
              { label: "Collections", href: "/collections" },
              { label: collection.title },
            ]}
          />
          <h1 className="mb-4 text-3xl font-semibold">{collection.title}</h1>
          <ProductGridSection
            title={collection.title}
            products={initialProducts}
            totalCount={initialCount}
            page={pageNumber}
            viewMode={defaultViewMode}
            sortBy={sort}
            pageSize={STORE_PRODUCT_PAGE_SIZE}
            isCustomerLoggedIn={Boolean(customer)}
            loginPath={accountPath}
          />
        </div>
      </FilterDrawer>
    </StorefrontFiltersProvider>
  )
}
