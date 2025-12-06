"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"

import type { ReactNode } from "react"

import type { HttpTypes } from "@medusajs/types"

import {
  AvailabilityFilter,
  PriceRangeFilter,
  SortOptions,
  ViewMode,
} from "@modules/store/components/refinement-list/types"
import { STORE_PRODUCT_PAGE_SIZE } from "@modules/store/constants"

type FilterState = {
  availability?: AvailabilityFilter
  priceRange?: PriceRangeFilter
  age?: string
  categoryId?: string
  collectionId?: string
  sortBy: SortOptions
  page: number
  searchQuery?: string
  viewMode: ViewMode
}

type StorefrontFiltersProviderProps = {
  children: ReactNode
  countryCode: string
  initialFilters: FilterState
  initialProducts: HttpTypes.StoreProduct[]
  initialCount: number
  pageSize?: number
  fixedCategoryId?: string
  fixedCollectionId?: string
}

type StorefrontFiltersContextValue = {
  filters: FilterState
  products: HttpTypes.StoreProduct[]
  totalCount: number
  pageSize: number
  totalPages: number
  isFetching: boolean
  isPending: boolean
  error?: string
  setAvailability: (value?: AvailabilityFilter) => void
  setPriceRange: (range?: PriceRangeFilter) => void
  setAge: (value?: string) => void
  setCategory: (value?: string) => void
  /** @deprecated Use updateFilters instead */
  setFilters: (partial: Partial<FilterState>, options?: { resetPage?: boolean }) => void
  updateFilters: (partial: Partial<FilterState>, options?: { resetPage?: boolean }) => void
  setSort: (value: SortOptions) => void
  setViewMode: (value: ViewMode) => void
  setPage: (page: number) => void
  setSearchQuery: (value?: string) => void
  refresh: () => void
  productsPerPage: number
}

const StorefrontFiltersContext = createContext<StorefrontFiltersContextValue | null>(null)

export const StorefrontFiltersProvider = ({
  children,
  countryCode,
  initialFilters,
  initialProducts,
  initialCount,
  pageSize = STORE_PRODUCT_PAGE_SIZE,
  fixedCategoryId,
  fixedCollectionId,
}: StorefrontFiltersProviderProps) => {
  const [filters, setFilterState] = useState<FilterState>(initialFilters)
  const filtersRef = useRef(initialFilters)
  const [listing, setListing] = useState<{ products: HttpTypes.StoreProduct[]; count: number }>({
    products: initialProducts,
    count: initialCount,
  })
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  const fetchProducts = useCallback(
    async (nextFilters: FilterState) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      setIsFetching(true)
      setError(undefined)

      const effectiveCategoryId = nextFilters.categoryId ?? fixedCategoryId
      const effectiveCollectionId = nextFilters.collectionId ?? fixedCollectionId

      try {
        const response = await fetch("/api/storefront/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            countryCode,
            page: nextFilters.page,
            sortBy: nextFilters.sortBy,
            categoryId: effectiveCategoryId,
            collectionId: effectiveCollectionId,
            searchQuery: nextFilters.searchQuery,
            limit: pageSize,
            filters: {
              availability: nextFilters.availability,
              price: nextFilters.priceRange,
              age: nextFilters.age,
            },
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          let message = "Failed to load products"
          try {
            const errorBody = await response.json()
            if (typeof errorBody?.message === "string") {
              message = errorBody.message
            }
          } catch (_) {
            // Ignore JSON parsing errors and fall back to default message
          }
          throw new Error(message)
        }

        const payload = (await response.json()) as {
          products: HttpTypes.StoreProduct[]
          count: number
        }

        setListing(payload)
      } catch (error) {
        if ((error as Error)?.name === "AbortError") {
          return
        }
        setError((error as Error)?.message || "Something went wrong")
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
          setIsFetching(false)
        }
      }
    },
    [countryCode, pageSize, fixedCategoryId, fixedCollectionId]
  )

  const triggerFetch = useCallback(
    (next: FilterState, { shouldFetch = true }: { shouldFetch?: boolean } = {}) => {
      if (!shouldFetch) {
        return
      }

      fetchProducts(next).catch((error) => {
        if ((error as Error)?.name !== "AbortError") {
          console.error("Failed to load products", error)
        }
      })
    },
    [fetchProducts]
  )

  const commitFilters = useCallback(
    (next: FilterState, { shouldFetch = true }: { shouldFetch?: boolean } = {}) => {
      filtersRef.current = next
      startTransition(() => setFilterState(next))
      triggerFetch(next, { shouldFetch })
    },
    [triggerFetch]
  )

  const baseUpdate = useCallback(
    (
      partial: Partial<FilterState>,
      {
        resetPage = true,
        shouldFetch = true,
      }: { resetPage?: boolean; shouldFetch?: boolean } = {}
    ) => {
      const current = filtersRef.current
      const next = {
        ...current,
        ...(resetPage ? { page: 1 } : {}),
        ...partial,
      }
      commitFilters(next, { shouldFetch })
    },
    [commitFilters]
  )

  const setAvailability = useCallback((value?: AvailabilityFilter) => baseUpdate({ availability: value }), [baseUpdate])
  const setAge = useCallback((value?: string) => baseUpdate({ age: value ?? undefined }), [baseUpdate])
  const setCategory = useCallback((value?: string) => baseUpdate({ categoryId: value ?? undefined }), [baseUpdate])
  const updateFilters = useCallback(
    (partial: Partial<FilterState>, options?: { resetPage?: boolean }) => {
      baseUpdate(partial, {
        resetPage: options?.resetPage ?? true,
      })
    },
    [baseUpdate]
  )
  const setPriceRange = useCallback(
    (range?: PriceRangeFilter) => {
      if (!range || (range.min === undefined && range.max === undefined)) {
        baseUpdate({ priceRange: undefined })
        return
      }
      baseUpdate({ priceRange: range })
    },
    [baseUpdate]
  )
  const setSort = useCallback((value: SortOptions) => baseUpdate({ sortBy: value }), [baseUpdate])
  const setSearchQuery = useCallback(
    (value?: string) => baseUpdate({ searchQuery: value?.trim() || undefined }),
    [baseUpdate]
  )
  const setPage = useCallback(
    (page: number) => baseUpdate({ page: Math.max(1, page) }, { resetPage: false }),
    [baseUpdate]
  )
  const setViewMode = useCallback(
    (value: ViewMode) => baseUpdate({ viewMode: value }, { shouldFetch: false, resetPage: false }),
    [baseUpdate]
  )
  const refresh = useCallback(() => triggerFetch(filtersRef.current), [triggerFetch])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((listing.count || 0) / pageSize)),
    [listing.count, pageSize]
  )

  const value = useMemo<StorefrontFiltersContextValue>(
    () => ({
      filters,
      products: listing.products,
      totalCount: listing.count,
      pageSize,
      totalPages,
      isFetching,
      isPending,
      error,
      setAvailability,
      setPriceRange,
      setAge,
      setCategory,
      setFilters: updateFilters,
      updateFilters,
      setSort,
      setViewMode,
      setPage,
      setSearchQuery,
      refresh,
      productsPerPage: pageSize,
    }),
    [
      filters,
      listing.products,
      listing.count,
      pageSize,
      totalPages,
      isFetching,
      isPending,
      error,
      setAvailability,
      setPriceRange,
      setAge,
      setCategory,
      updateFilters,
      setSort,
      setViewMode,
      setPage,
      setSearchQuery,
      refresh,
    ]
  )

  return <StorefrontFiltersContext.Provider value={value}>{children}</StorefrontFiltersContext.Provider>
}

export const useStorefrontFilters = () => {
  const context = useContext(StorefrontFiltersContext)

  if (!context) {
    throw new Error("useStorefrontFilters must be used within StorefrontFiltersProvider")
  }

  return context
}

export const useOptionalStorefrontFilters = () => useContext(StorefrontFiltersContext)
