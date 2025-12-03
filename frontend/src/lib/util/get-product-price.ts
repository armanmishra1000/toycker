import { HttpTypes } from "@medusajs/types"
import type { VariantPrice } from "types/global"
import { getPercentageDiff } from "./get-percentage-diff"
import { convertToLocale } from "./money"
import {
  MANUAL_COMPARE_AT_PRICE_KEY,
  MANUAL_SALE_PRICE_KEY,
  MANUAL_CURRENCY_CODE_KEY,
} from "../../constants/manual-pricing"

type VariantWithCalculatedPrice = HttpTypes.StoreProductVariant & {
  calculated_price: NonNullable<HttpTypes.StoreProductVariant["calculated_price"]>
}

const hasCalculatedPrice = (
  variant?: HttpTypes.StoreProductVariant | null
): variant is VariantWithCalculatedPrice => {
  const calculated = variant?.calculated_price

  return (
    typeof calculated?.calculated_amount === "number" &&
    typeof calculated.currency_code === "string" &&
    calculated.currency_code.length > 0
  )
}

const buildVariantPriceFromCalculated = (
  variant: VariantWithCalculatedPrice
): VariantPrice => {
  const manualPrice = getManualPriceOverride(variant)
  const baseCalculatedAmount = variant.calculated_price.calculated_amount
  const baseOriginalAmount =
    typeof variant.calculated_price.original_amount === "number"
      ? variant.calculated_price.original_amount
      : baseCalculatedAmount
  let currencyCode = variant.calculated_price.currency_code
  const priceListType =
    variant.calculated_price.calculated_price?.price_list_type ?? "default"

  let calculatedAmount = baseCalculatedAmount
  let originalAmount = baseOriginalAmount
  let appliedPriceType = priceListType

  if (manualPrice && priceListType !== "sale") {
    calculatedAmount = manualPrice.saleAmount
    originalAmount = manualPrice.compareAmount ?? manualPrice.saleAmount
    currencyCode = manualPrice.currencyCode
    appliedPriceType = manualPrice.compareAmount && manualPrice.compareAmount > manualPrice.saleAmount
      ? "manual-sale"
      : "manual"
  }

  return buildVariantPriceFromAmounts({
    calculatedAmount,
    originalAmount,
    currencyCode,
    priceType: appliedPriceType,
  })
}

const buildVariantPriceFromAmounts = ({
  calculatedAmount,
  originalAmount,
  currencyCode,
  priceType,
}: {
  calculatedAmount: number
  originalAmount: number
  currencyCode: string
  priceType: string
}): VariantPrice => {
  const safeOriginal = originalAmount === 0 ? calculatedAmount || 1 : originalAmount
  const percentageDiff = getPercentageDiff(safeOriginal, calculatedAmount)
  const isDiscounted = priceType === "sale" || originalAmount > calculatedAmount

  return {
    calculated_price_number: calculatedAmount,
    calculated_price: convertToLocale({ amount: calculatedAmount, currency_code: currencyCode }),
    original_price_number: originalAmount,
    original_price: convertToLocale({ amount: originalAmount, currency_code: currencyCode }),
    currency_code: currencyCode,
    price_type: priceType,
    percentage_diff: percentageDiff,
    is_discounted: isDiscounted,
  }
}

type ManualPriceOverride = {
  saleAmount: number
  compareAmount?: number
  currencyCode: string
}

const getManualPriceOverride = (
  variant: HttpTypes.StoreProductVariant
): ManualPriceOverride | null => {
  const metadata = variant.metadata as Record<string, unknown> | undefined

  if (!metadata) {
    return null
  }

  const saleAmount = parseStoredManualAmount(metadata[MANUAL_SALE_PRICE_KEY])
  const currencyCode = String(metadata[MANUAL_CURRENCY_CODE_KEY] ?? "").toUpperCase()
  if (saleAmount === null || !currencyCode) {
    return null
  }

  const compareAmount = parseStoredManualAmount(metadata[MANUAL_COMPARE_AT_PRICE_KEY])

  return {
    saleAmount,
    compareAmount: compareAmount ?? undefined,
    currencyCode,
  }
}

const buildManualVariantPrice = (manual: ManualPriceOverride): VariantPrice => {
  return buildVariantPriceFromAmounts({
    calculatedAmount: manual.saleAmount,
    originalAmount: manual.compareAmount ?? manual.saleAmount,
    currencyCode: manual.currencyCode,
    priceType: manual.compareAmount && manual.compareAmount > manual.saleAmount ? "manual-sale" : "manual",
  })
}

const parseStoredManualAmount = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value / 100
  }

  if (typeof value === "string") {
    const sanitized = value.replace(/,/g, "").trim()
    if (!sanitized) {
      return null
    }
    const numeric = Number(sanitized)
    if (!Number.isFinite(numeric)) {
      return null
    }
    const hasDecimal = sanitized.includes(".")
    return hasDecimal ? numeric : numeric / 100
  }

  return null
}

export const getPricesForVariant = (
  variant?: HttpTypes.StoreProductVariant | null
): VariantPrice | null => {
  if (!variant) {
    return null
  }

  if (hasCalculatedPrice(variant)) {
    return buildVariantPriceFromCalculated(variant)
  }

  const manual = getManualPriceOverride(variant)
  if (!manual) {
    return null
  }

  return buildManualVariantPrice(manual)
}

export function getProductPrice({
  product,
  variantId,
}: {
  product: HttpTypes.StoreProduct
  variantId?: string
}) {
  if (!product || !product.id) {
    throw new Error("No product provided")
  }

  const cheapestPrice = (): VariantPrice | null => {
    const variantsWithPrice = (product.variants ?? [])
      .map((variant) => ({ variant, price: getPricesForVariant(variant) }))
      .filter((entry): entry is { variant: HttpTypes.StoreProductVariant; price: VariantPrice } =>
        Boolean(entry.price)
      )

    if (!variantsWithPrice.length) {
      return null
    }

    const cheapestVariant = variantsWithPrice.sort(
      (a, b) => a.price.calculated_price_number - b.price.calculated_price_number
    )[0]

    return cheapestVariant.price
  }

  const variantPrice = (): VariantPrice | null => {
    if (!variantId) {
      return null
    }

    const variant = (product.variants ?? []).find((variantEntry) => {
      return variantEntry?.id === variantId || variantEntry?.sku === variantId
    })

    if (!variant) {
      return null
    }

    return getPricesForVariant(variant)
  }

  return {
    product,
    cheapestPrice: cheapestPrice(),
    variantPrice: variantPrice(),
  }
}
