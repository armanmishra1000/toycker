import { Metadata } from "next"

import {
  AvailabilityFilter,
  PriceRangeFilter,
  SortOptions,
  ViewMode,
} from "@modules/store/components/refinement-list/types"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    q?: string
    availability?: AvailabilityFilter
    price_min?: string
    price_max?: string
    age?: string
    category?: string
    view?: ViewMode
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page, q, availability, price_min, price_max, age, category, view } = searchParams

  const parsedPriceRange: PriceRangeFilter | undefined = (() => {
    const min = price_min !== undefined ? Number(price_min) : undefined
    const max = price_max !== undefined ? Number(price_max) : undefined

    if (
      (min !== undefined && Number.isFinite(min)) ||
      (max !== undefined && Number.isFinite(max))
    ) {
      return {
        min: Number.isFinite(min) ? min : undefined,
        max: Number.isFinite(max) ? max : undefined,
      }
    }

    return undefined
  })()

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      searchQuery={q}
      availability={availability}
      priceRange={parsedPriceRange}
      ageFilter={age}
      categoryId={category}
      viewMode={view}
    />
  )
}
