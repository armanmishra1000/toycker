"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react"
import { Minus, Plus } from "lucide-react"

import { AvailabilityFilter, PRICE_SLIDER_LIMITS } from "./types"

type ActiveFilter = {
  label: string
  value: string
  paramKey: string | string[]
}

type FilterOption = {
  label: string
  value: string
  count?: number
}

type FilterConfig = {
  availability?: FilterOption[]
  ages?: FilterOption[]
  categories?: FilterOption[]
}

type SelectedFilters = {
  availability?: AvailabilityFilter
  age?: string
  category?: string
  priceMin?: number
  priceMax?: number
}

type RefinementListProps = {
  searchQuery?: string | null
  activeFilters?: ActiveFilter[]
  filterOptions?: FilterConfig
  selectedFilters?: SelectedFilters
}

type PriceRangeState = {
  min?: number
  max?: number
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
})

const formatCurrency = (value: number) => currencyFormatter.format(value)

const clampToBounds = (value: number | undefined, bounds: typeof PRICE_SLIDER_LIMITS) => {
  if (value === undefined || Number.isNaN(value)) {
    return undefined
  }

  return Math.min(Math.max(value, bounds.min), bounds.max)
}

const normalizePriceRange = (
  range: PriceRangeState,
  bounds: typeof PRICE_SLIDER_LIMITS = PRICE_SLIDER_LIMITS,
  activeField?: "min" | "max"
): PriceRangeState => {
  let min = clampToBounds(range.min, bounds)
  let max = clampToBounds(range.max, bounds)

  if (min !== undefined && max !== undefined) {
    if (activeField === "min" && min > max) {
      max = min
    } else if (activeField === "max" && max < min) {
      min = max
    }
  }

  return {
    min,
    max,
  }
}

const RefinementList = ({
  searchQuery,
  activeFilters,
  filterOptions,
  selectedFilters,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const sliderBounds = PRICE_SLIDER_LIMITS
  const [priceRange, setPriceRange] = useState<PriceRangeState>(() =>
    normalizePriceRange(
      {
        min: selectedFilters?.priceMin ?? sliderBounds.min,
        max: selectedFilters?.priceMax ?? sliderBounds.max,
      },
      sliderBounds
    )
  )

  useEffect(() => {
    setPriceRange(
      normalizePriceRange(
        {
          min: selectedFilters?.priceMin ?? sliderBounds.min,
          max: selectedFilters?.priceMax ?? sliderBounds.max,
        },
        sliderBounds
      )
    )
  }, [selectedFilters?.priceMin, selectedFilters?.priceMax, sliderBounds])

  const pushWithParams = (params: URLSearchParams) => {
    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname)
  }

  const toggleCheckboxParam = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    const currentValue = params.get(name)

    if (currentValue === value) {
      params.delete(name)
    } else {
      params.set(name, value)
    }

    params.delete("page")
    pushWithParams(params)
  }

  const commitPriceRange = (range: PriceRangeState) => {
    const params = new URLSearchParams(searchParams)

    if (range.min !== undefined && range.min > sliderBounds.min) {
      params.set("price_min", Math.round(range.min).toString())
    } else {
      params.delete("price_min")
    }

    if (range.max !== undefined && range.max < sliderBounds.max) {
      params.set("price_max", Math.round(range.max).toString())
    } else {
      params.delete("price_max")
    }

    params.delete("page")
    pushWithParams(params)
  }

  const updatePriceRange = (field: "min" | "max", value: number | undefined, commit?: boolean) => {
    const next = normalizePriceRange(
      {
        ...priceRange,
        [field]: clampToBounds(value, sliderBounds),
      },
      sliderBounds,
      field
    )
    setPriceRange(next)

    if (commit) {
      commitPriceRange(next)
    }
  }

  const resolvedFilters = useMemo(() => {
    const chips = [...(activeFilters ?? [])]

    const appendChip = (
      paramKey: string,
      value?: string,
      options?: FilterOption[]
    ) => {
      if (!value) {
        return
      }

      const matchedLabel = options?.find((option) => option.value === value)?.label
      chips.push({
        label: matchedLabel || value,
        value,
        paramKey,
      })
    }

    appendChip("availability", selectedFilters?.availability, filterOptions?.availability)
    appendChip("age", selectedFilters?.age, filterOptions?.ages)
    appendChip("category", selectedFilters?.category, filterOptions?.categories)

    if (selectedFilters?.priceMin !== undefined || selectedFilters?.priceMax !== undefined) {
      const formattedMin = formatCurrency(selectedFilters?.priceMin ?? sliderBounds.min)
      const formattedMax = formatCurrency(selectedFilters?.priceMax ?? sliderBounds.max)
      chips.push({
        label: `Price: ${formattedMin} – ${formattedMax}`,
        value: `${selectedFilters?.priceMin ?? sliderBounds.min}-${selectedFilters?.priceMax ?? sliderBounds.max}`,
        paramKey: ["price_min", "price_max"],
      })
    }

    if (searchQuery) {
      chips.push({
        label: `Search: "${searchQuery}"`,
        value: searchQuery,
        paramKey: "q",
      })
    }

    return chips
  }, [activeFilters, filterOptions, searchQuery, selectedFilters, sliderBounds])

  const clearFilter = (paramKey: string | string[]) => {
    const params = new URLSearchParams(searchParams)
    const keys = Array.isArray(paramKey) ? paramKey : [paramKey]
    keys.forEach((key) => params.delete(key))
    params.delete("page")
    pushWithParams(params)
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <section className="rounded-2xl border border-ui-border-base bg-ui-bg-base/80 p-5 shadow-elevation-card-rest">
        {resolvedFilters.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2" data-testid="active-filters">
            {resolvedFilters.map((filter) => (
              <button
                key={`${Array.isArray(filter.paramKey) ? filter.paramKey.join("-") : filter.paramKey}-${filter.value}`}
                type="button"
                onClick={() => clearFilter(filter.paramKey)}
                className="group/filter inline-flex items-center gap-2 rounded-full border border-ui-border-strong/70 bg-ui-bg-base px-3 py-1 text-xs font-medium text-ui-fg-base shadow-sm transition-colors hover:bg-ui-bg-subtle"
                aria-label={`Remove ${filter.label}`}
              >
                <span>{filter.label}</span>
                <span className="text-ui-fg-muted">✕</span>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-6">
          {filterOptions?.availability?.length ? (
            <AccordionSection title="Availability" defaultOpen>
              <CheckboxGroup
                options={filterOptions.availability}
                selectedValue={selectedFilters?.availability}
                onChange={(value) => toggleCheckboxParam("availability", value)}
              />
            </AccordionSection>
          ) : null}

          <AccordionSection title="Price" defaultOpen>
            <PriceRangeControls
              sliderBounds={sliderBounds}
              priceRange={priceRange}
              onRangeChange={updatePriceRange}
            />
          </AccordionSection>

          {filterOptions?.ages?.length ? (
            <AccordionSection title="Shop by age" defaultOpen>
              <CheckboxGroup
                options={filterOptions.ages}
                selectedValue={selectedFilters?.age}
                onChange={(value) => toggleCheckboxParam("age", value)}
              />
            </AccordionSection>
          ) : null}

          {filterOptions?.categories?.length ? (
            <AccordionSection title="Category" defaultOpen>
              <CheckboxGroup
                options={filterOptions.categories}
                selectedValue={selectedFilters?.category}
                onChange={(value) => toggleCheckboxParam("category", value)}
              />
            </AccordionSection>
          ) : null}
        </div>
      </section>
    </div>
  )
}

const AccordionSection = ({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-ui-border-subtle pb-4 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-ui-fg-base">{title}</span>
        {isOpen ? (
          <Minus className="h-4 w-4 text-ui-fg-muted" aria-hidden />
        ) : (
          <Plus className="h-4 w-4 text-ui-fg-muted" aria-hidden />
        )}
      </button>
      {isOpen && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  )
}

const CheckboxGroup = ({
  options,
  selectedValue,
  onChange,
}: {
  options: FilterOption[]
  selectedValue?: string
  onChange: (value: string) => void
}) => (
  <div className="space-y-2">
    {options.map((option) => {
      const isChecked = selectedValue === option.value

      return (
        <label key={option.value} className="flex items-center gap-3 text-sm font-medium text-ui-fg-base">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => onChange(option.value)}
            className="h-4 w-4 rounded border border-ui-border-base text-ui-fg-base focus:ring-0"
          />
          <span className="flex-1 text-ui-fg-base">
            {option.label}
            {typeof option.count === "number" && (
              <span className="text-ui-fg-muted"> ({option.count})</span>
            )}
          </span>
        </label>
      )
    })}
  </div>
)

const PriceRangeControls = ({
  sliderBounds,
  priceRange,
  onRangeChange,
}: {
  sliderBounds: typeof PRICE_SLIDER_LIMITS
  priceRange: PriceRangeState
  onRangeChange: (field: "min" | "max", value: number | undefined, commit?: boolean) => void
}) => {
  const handleInputChange = (field: "min" | "max", event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === "" ? undefined : Number(event.target.value)
    onRangeChange(field, Number.isNaN(value as number) ? undefined : value)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <InputField
          value={priceRange.min ?? sliderBounds.min}
          onChange={(event) => handleInputChange("min", event)}
          onBlur={() => onRangeChange("min", priceRange.min, true)}
        />
        <span className="text-sm text-ui-fg-muted">—</span>
        <InputField
          value={priceRange.max ?? sliderBounds.max}
          onChange={(event) => handleInputChange("max", event)}
          onBlur={() => onRangeChange("max", priceRange.max, true)}
        />
      </div>

      <div className="space-y-3">
        <div className="relative h-6">
          <input
            type="range"
            min={sliderBounds.min}
            max={sliderBounds.max}
            step={sliderBounds.step}
            value={priceRange.min ?? sliderBounds.min}
            onChange={(event) => onRangeChange("min", Number(event.target.value))}
            onMouseUp={(event) => onRangeChange("min", Number((event.target as HTMLInputElement).value), true)}
            onTouchEnd={(event) => onRangeChange("min", Number((event.target as HTMLInputElement).value), true)}
            className="absolute inset-0 h-6 w-full appearance-none bg-transparent"
            style={{ accentColor: "#0f172a" }}
          />
          <input
            type="range"
            min={sliderBounds.min}
            max={sliderBounds.max}
            step={sliderBounds.step}
            value={priceRange.max ?? sliderBounds.max}
            onChange={(event) => onRangeChange("max", Number(event.target.value))}
            onMouseUp={(event) => onRangeChange("max", Number((event.target as HTMLInputElement).value), true)}
            onTouchEnd={(event) => onRangeChange("max", Number((event.target as HTMLInputElement).value), true)}
            className="absolute inset-0 h-6 w-full appearance-none bg-transparent"
            style={{ accentColor: "#0f172a" }}
          />
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-full border border-ui-fg-base" />
        </div>
        <p className="text-sm font-medium text-ui-fg-base">
          Price: {formatCurrency(priceRange.min ?? sliderBounds.min)} – {formatCurrency(priceRange.max ?? sliderBounds.max)}
        </p>
      </div>
    </div>
  )
}

const InputField = ({
  value,
  onChange,
  onBlur,
}: {
  value: number
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
}) => (
  <div className="flex flex-1 items-center gap-2 rounded-lg border border-ui-border-base px-3 py-2 text-sm font-semibold text-ui-fg-base shadow-sm">
    <span className="text-xs font-semibold text-ui-fg-muted">₹</span>
    <input
      type="number"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className="w-full border-none bg-transparent p-0 text-sm font-semibold text-ui-fg-base outline-none"
    />
  </div>
)

export default RefinementList
