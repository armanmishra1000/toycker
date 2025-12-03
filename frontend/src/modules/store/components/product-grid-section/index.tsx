"use client"

import { useMemo } from "react"

import ProductPreview from "@modules/products/components/product-preview"
import ResultsToolbar from "@modules/store/components/results-toolbar"
import { Pagination } from "@modules/store/components/pagination"
import {
  SortOptions,
  ViewMode,
} from "@modules/store/components/refinement-list/types"
import { useOptionalStorefrontFilters } from "@modules/store/context/storefront-filters"
import type { HttpTypes } from "@medusajs/types"
import { WishlistProvider } from "@modules/products/context/wishlist"

type ProductGridSectionProps = {
  title: string
  products: HttpTypes.StoreProduct[]
  totalCount: number
  page: number
  viewMode: ViewMode
  sortBy: SortOptions
  pageSize: number
  totalCountHint?: number
  isCustomerLoggedIn?: boolean
  loginPath?: string
}

const ProductGridSection = ({
  title,
  products,
  totalCount,
  page,
  viewMode,
  sortBy,
  pageSize,
  totalCountHint,
  isCustomerLoggedIn = false,
  loginPath = "/account",
}: ProductGridSectionProps) => {
  const context = useOptionalStorefrontFilters()

  const derived = context
    ? {
        products: context.products,
        totalCount: context.totalCount,
        page: context.filters.page,
        viewMode: context.filters.viewMode,
        sortBy: context.filters.sortBy,
        pageSize: context.pageSize,
        isLoading: context.isFetching || context.isPending,
        error: context.error,
      }
    : {
        products,
        totalCount,
        page,
        viewMode,
        sortBy,
        pageSize,
        isLoading: false,
        error: undefined,
      }

  const effectiveCount = typeof derived.totalCount === "number" ? derived.totalCount : totalCountHint ?? 0
  const totalPages = Math.max(1, Math.ceil(effectiveCount / derived.pageSize))
  const hasProducts = derived.products.length > 0
  const gridClassName = getGridClassName(derived.viewMode)

  const isLoading = derived.isLoading && context !== null

  const emptyStateHeading = useMemo(() => title || "Products", [title])

  return (
    <WishlistProvider isAuthenticated={isCustomerLoggedIn} loginPath={loginPath}>
      <section className="space-y-6" data-loading={isLoading ? "true" : undefined}>
        <ResultsToolbar totalCount={effectiveCount} viewMode={derived.viewMode} sortBy={derived.sortBy} />

        {derived.error && (
          <p className="rounded-md border border-ui-border-danger bg-ui-bg-base px-4 py-3 text-sm text-ui-fg-danger" role="alert">
            {derived.error}
          </p>
        )}

        {isLoading ? (
          <ProductGridSkeleton viewMode={derived.viewMode} count={derived.pageSize} />
        ) : hasProducts ? (
          derived.viewMode === "list" ? (
            <div className={gridClassName} data-testid="products-list">
              {derived.products.map((product) => (
                <ProductPreview key={product.id} product={product} viewMode={derived.viewMode} />
              ))}
            </div>
          ) : (
            <ul className={gridClassName} data-testid="products-list">
              {derived.products.map((product) => (
                <li key={product.id}>
                  <ProductPreview product={product} viewMode={derived.viewMode} />
                </li>
              ))}
            </ul>
          )
        ) : (
          <EmptyState heading={emptyStateHeading} />
        )}

        {totalPages > 1 && !derived.error && (
          <Pagination data-testid="product-pagination" page={derived.page} totalPages={totalPages} />
        )}
      </section>
    </WishlistProvider>
  )
}

const getGridClassName = (mode: ViewMode) => {
  if (mode === "grid-5") {
    return "grid w-full grid-cols-1 gap-x-5 gap-y-8 small:grid-cols-2 medium:grid-cols-5"
  }

  if (mode === "grid-4") {
    return "grid w-full grid-cols-1 gap-x-6 gap-y-10 small:grid-cols-2 medium:grid-cols-4"
  }

  if (mode === "list") {
    return "flex w-full flex-col gap-5"
  }

  return "grid w-full grid-cols-1 gap-x-6 gap-y-10 small:grid-cols-2 medium:grid-cols-4"
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

const ProductGridSkeleton = ({ viewMode, count }: { viewMode: ViewMode; count: number }) => {
  const items = Array.from({ length: count }, (_, index) => index)
  const gridClassName = getGridClassName(viewMode)
  const block = "animate-pulse bg-ui-bg-subtle"

  if (viewMode === "list") {
    return (
      <div className={gridClassName} data-testid="products-list-skeleton" aria-label="Loading products">
        {items.map((item) => (
          <div
            key={`list-skeleton-${item}`}
            className="group flex w-full gap-6 rounded-2xl bg-ui-bg-base/90"
          >
            <div className={`${block} h-44 w-44 flex-shrink-0 rounded-2xl`} />
            <div className="flex flex-1 flex-col gap-4">
              <div className="space-y-3">
                <div className={`${block} h-6 w-2/3 rounded-full`} />
                <div className={`${block} h-4 w-1/3 rounded-full`} />
                <div className="space-y-2">
                  <div className={`${block} h-4 w-full rounded-full`} />
                  <div className={`${block} h-4 w-5/6 rounded-full`} />
                </div>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-3">
                <div className={`${block} h-6 w-24 rounded-full`} />
                <div className={`${block} h-10 w-36 rounded-full`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ul className={gridClassName} data-testid="products-list-skeleton" aria-label="Loading products">
      {items.map((item) => (
        <li key={`grid-skeleton-${item}`}>
          <div className="group relative flex flex-col gap-4 rounded-2xl bg-ui-bg-base/90">
            <div className={`${block} aspect-square w-full rounded-2xl`} />
            <div className="flex flex-col gap-3">
              <div className={`${block} h-5 w-3/4 rounded-full`} />
              <div className={`${block} h-4 w-1/2 rounded-full`} />
              <div className="flex items-center justify-between gap-3">
                <div className={`${block} h-5 w-20 rounded-full`} />
                <div className={`${block} h-10 w-28 rounded-full`} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default ProductGridSection
