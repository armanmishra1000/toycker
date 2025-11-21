"use client"

import { useMemo } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import ProductPreview from "@modules/products/components/product-preview"
import ResultsToolbar from "@modules/store/components/results-toolbar"
import { Pagination } from "@modules/store/components/pagination"
import {
  SortOptions,
  ViewMode,
} from "@modules/store/components/refinement-list/types"
import { useOptionalStorefrontFilters } from "@modules/store/context/storefront-filters"
import type { HttpTypes } from "@medusajs/types"

type ProductGridSectionProps = {
  title: string
  products: HttpTypes.StoreProduct[]
  totalCount: number
  page: number
  viewMode: ViewMode
  sortBy: SortOptions
  pageSize: number
  totalCountHint?: number
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

  const shouldShowSkeleton = derived.isLoading && context !== null

  const emptyStateHeading = useMemo(() => title || "Products", [title])

  return (
    <section className="space-y-6">
      <ResultsToolbar totalCount={effectiveCount} viewMode={derived.viewMode} sortBy={derived.sortBy} />

      {derived.error && (
        <p className="rounded-md border border-ui-border-danger bg-ui-bg-base px-4 py-3 text-sm text-ui-fg-danger" role="alert">
          {derived.error}
        </p>
      )}

      {shouldShowSkeleton ? (
        <SkeletonProductGrid numberOfProducts={pageSize} viewMode={derived.viewMode} />
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
  )
}

const getGridClassName = (mode: ViewMode) => {
  if (mode === "grid-4") {
    return "grid w-full grid-cols-1 gap-x-6 gap-y-10 small:grid-cols-2 medium:grid-cols-4"
  }

  if (mode === "list") {
    return "flex w-full flex-col gap-5"
  }

  return "grid w-full grid-cols-1 gap-x-6 gap-y-10 small:grid-cols-2 medium:grid-cols-3"
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

export default ProductGridSection
