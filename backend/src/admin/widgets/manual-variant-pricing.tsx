"use client"

import { useEffect, useMemo, useState } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProductVariant } from "@medusajs/types"
import { Button, Input, Label, Text, toast } from "@medusajs/ui"

import {
  MANUAL_COMPARE_AT_PRICE_KEY,
  MANUAL_SALE_PRICE_KEY,
  MANUAL_CURRENCY_CODE_KEY,
} from "../../constants/manual-pricing"

type VariantWidgetProps = {
  data?: AdminProductVariant
}

const ManualVariantPricingWidget = ({ data }: VariantWidgetProps) => {
  const [metadataSnapshot, setMetadataSnapshot] = useState<Record<string, unknown>>(
    () => ({ ...((data?.metadata as Record<string, unknown>) ?? {}) })
  )

  const [saleInput, setSaleInput] = useState(() =>
    formatMinorToMajor(metadataSnapshot[MANUAL_SALE_PRICE_KEY])
  )
  const [compareInput, setCompareInput] = useState(() =>
    formatMinorToMajor(metadataSnapshot[MANUAL_COMPARE_AT_PRICE_KEY])
  )
  const [currencyInput, setCurrencyInput] = useState(
    () => (metadataSnapshot[MANUAL_CURRENCY_CODE_KEY] as string) ?? ""
  )
  const [currencyOptions, setCurrencyOptions] = useState<string[]>([])
  const [defaultCurrency, setDefaultCurrency] = useState<string>("")
  const [isBusy, setIsBusy] = useState(false)

  const productId = data?.product_id ?? data?.product?.id

  const hasManualPricing = useMemo(() => {
    return Boolean(
      metadataSnapshot[MANUAL_SALE_PRICE_KEY] || metadataSnapshot[MANUAL_COMPARE_AT_PRICE_KEY]
    )
  }, [metadataSnapshot])

  if (!data || !productId) {
    return null
  }

  useEffect(() => {
    let isMounted = true

    const fetchStore = async () => {
      try {
        const response = await fetch("/admin/store", {
          credentials: "include",
        })
        if (!response.ok) {
          return
        }
        const payload = (await response.json()) as {
          store?: {
            default_currency_code?: string
            supported_currencies?: { currency_code: string }[]
          }
        }
        if (!isMounted) return
        const options = payload.store?.supported_currencies?.map((item) =>
          item.currency_code.toUpperCase()
        )
        if (options?.length) {
          setCurrencyOptions(options)
        }

        const defaultCode =
          payload.store?.default_currency_code?.toUpperCase() ?? options?.[0] ?? ""
        setDefaultCurrency(defaultCode)
        if (!currencyInput && defaultCode) {
          setCurrencyInput(defaultCode)
        }
      } catch (error) {
        console.warn("Unable to load store info", error)
      }
    }

    fetchStore()

    return () => {
      isMounted = false
    }
  }, [])

  const resetManualInputs = () => {
    setSaleInput("")
    setCompareInput("")
    setCurrencyInput(defaultCurrency)
  }

  const persistManualClear = async () => {
    setIsBusy(true)
    try {
      await updateVariantMetadata(productId, data.id, metadataSnapshot, {
        [MANUAL_SALE_PRICE_KEY]: null,
        [MANUAL_COMPARE_AT_PRICE_KEY]: null,
        [MANUAL_CURRENCY_CODE_KEY]: null,
      })

      setMetadataSnapshot((snapshot) => {
        const next = { ...snapshot }
        delete next[MANUAL_SALE_PRICE_KEY]
        delete next[MANUAL_COMPARE_AT_PRICE_KEY]
        delete next[MANUAL_CURRENCY_CODE_KEY]
        return next
      })

      resetManualInputs()
      toast.success("Manual prices cleared")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to clear manual prices")
      throw error
    } finally {
      setIsBusy(false)
    }
  }

  const handleSave = async () => {
    const saleMinor = convertMajorToMinorString(saleInput)
    const compareMinor = convertMajorToMinorString(compareInput)

    if (!saleMinor) {
      if (hasManualPricing) {
        try {
          await persistManualClear()
        } catch (error) {
          console.error(error)
        }
      } else {
        resetManualInputs()
        toast.success("Manual prices cleared")
      }
      return
    }

    if (!currencyInput) {
      toast.error("Select a currency code")
      return
    }

    setIsBusy(true)
    try {
      await updateVariantMetadata(productId, data.id, metadataSnapshot, {
        [MANUAL_SALE_PRICE_KEY]: saleMinor,
        [MANUAL_COMPARE_AT_PRICE_KEY]: compareMinor,
        [MANUAL_CURRENCY_CODE_KEY]: currencyInput.toUpperCase(),
      })

      setMetadataSnapshot((snapshot) => {
        const next = { ...snapshot }
        next[MANUAL_SALE_PRICE_KEY] = saleMinor
        if (compareMinor) {
          next[MANUAL_COMPARE_AT_PRICE_KEY] = compareMinor
        } else {
          delete next[MANUAL_COMPARE_AT_PRICE_KEY]
        }
        next[MANUAL_CURRENCY_CODE_KEY] = currencyInput.toUpperCase()
        return next
      })

      toast.success("Manual prices saved")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to save manual prices")
    } finally {
      setIsBusy(false)
    }
  }

  const handleClear = async () => {
    if (!hasManualPricing) {
      resetManualInputs()
      toast.success("Manual prices cleared")
      return
    }

    try {
      await persistManualClear()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="rounded-2xl border border-ui-border-subtle bg-ui-bg-base p-5">
      <div className="space-y-1">
        <p className="text-base font-semibold text-ui-fg-base">Manual storefront prices</p>
        <Text size="small" className="text-ui-fg-muted">
          Override the storefront display price for this variant without using sale price lists.
          Enter values in your store currency (for example, 1649.00).
        </Text>
      </div>
      <div className="mt-4 space-y-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="manual-sale-price">Displayed (red) price</Label>
          <Input
            id="manual-sale-price"
            type="text"
            inputMode="decimal"
            pattern="[0-9.,]*"
            placeholder="1649.00"
            value={saleInput}
            onChange={(event) => setSaleInput(event.target.value)}
            disabled={isBusy}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="manual-compare-price">Struck (original) price</Label>
          <Input
            id="manual-compare-price"
            type="text"
            inputMode="decimal"
            pattern="[0-9.,]*"
            placeholder="1899.00"
            value={compareInput}
            onChange={(event) => setCompareInput(event.target.value)}
            disabled={isBusy}
          />
          <Text size="small" className="text-ui-fg-muted">
            Leave empty if you only want to show the red price. Provide a higher number to show a strikethrough value.
          </Text>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="manual-currency">Currency</Label>
          {currencyOptions.length ? (
            <select
              id="manual-currency"
              className="rounded-lg border border-ui-border-subtle bg-white px-3 py-2 text-sm"
              value={currencyInput}
              onChange={(event) => setCurrencyInput(event.target.value)}
              disabled={isBusy}
            >
              {currencyOptions.map((code) => (
                <option value={code} key={code}>
                  {code}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="manual-currency"
              value={currencyInput}
              onChange={(event) => setCurrencyInput(event.target.value.toUpperCase())}
              placeholder="INR"
              disabled={isBusy}
            />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="small" variant="secondary" onClick={handleSave} disabled={isBusy}>
            Save manual prices
          </Button>
          <Button size="small" variant="danger" onClick={handleClear} disabled={isBusy}>
            Clear values
          </Button>
        </div>
      </div>
    </div>
  )
}

const formatMinorToMajor = (value?: unknown): string => {
  if (value === null || value === undefined) {
    return ""
  }
  const numeric = typeof value === "number" ? value : Number(String(value))
  if (!Number.isFinite(numeric)) {
    return ""
  }
  return (numeric / 100).toFixed(2)
}

const convertMajorToMinorString = (value?: string): string | null => {
  if (!value) {
    return null
  }
  const sanitized = sanitizePriceInput(value).replace(/,/g, "").trim()
  if (!sanitized) {
    return null
  }
  const numeric = Number(sanitized)
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null
  }
  return Math.round(numeric * 100).toString()
}

const sanitizePriceInput = (value: string) => {
  return value.replace(/[^0-9.,-]/g, "")
}

const updateVariantMetadata = async (
  productId: string,
  variantId: string,
  snapshot: Record<string, unknown>,
  overrides: Record<string, unknown | null>
) => {
  const nextMetadata: Record<string, unknown> = { ...snapshot }

  Object.entries(overrides).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      delete nextMetadata[key]
      return
    }
    nextMetadata[key] = value
  })

  const response = await fetch(`/admin/products/${productId}/variants/${variantId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      metadata: nextMetadata,
    }),
  })

  if (!response.ok) {
    let errorMessage = "Unable to update variant metadata"
    try {
      const payload = await response.json()
      errorMessage = (payload as { message?: string })?.message || errorMessage
    } catch (error) {
      // ignore parse errors
    }
    throw new Error(errorMessage)
  }
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.side.after",
})

export default ManualVariantPricingWidget
