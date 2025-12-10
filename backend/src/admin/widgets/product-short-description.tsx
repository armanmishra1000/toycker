"use client"

import { useEffect, useMemo, useState } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct } from "@medusajs/types"
import { Button, Label, Text, Textarea, toast } from "@medusajs/ui"

type WidgetProps = {
  data?: AdminProduct
}

const getMetadataShortDescription = (product?: AdminProduct) => {
  const metadata = product?.metadata as Record<string, unknown> | null | undefined
  const candidate = metadata?.["short_description"]
  return typeof candidate === "string" ? candidate : ""
}

const ProductShortDescriptionWidget = ({ data }: WidgetProps) => {
  const productId = data?.id
  const initialValue = useMemo(() => getMetadataShortDescription(data), [data?.id, data?.metadata])
  const [savedValue, setSavedValue] = useState(initialValue)
  const [value, setValue] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setSavedValue(initialValue)
    setValue(initialValue)
  }, [initialValue, productId])

  if (!productId) {
    return null
  }

  const normalizedSaved = savedValue.trim()
  const normalizedValue = value.trim()
  const isDirty = normalizedSaved !== normalizedValue

  const handleReset = () => {
    setValue(savedValue)
    toast.info("Reverted changes")
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const nextMetadata: Record<string, unknown> = {
        ...((data?.metadata as Record<string, unknown> | null | undefined) ?? {}),
      }

      if (normalizedValue) {
        nextMetadata.short_description = normalizedValue
      } else {
        delete nextMetadata.short_description
      }

      const response = await fetch(`/admin/products/${productId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ metadata: nextMetadata }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: "Unable to save description" }))
        throw new Error(payload.message || "Unable to save description")
      }

      setSavedValue(normalizedValue)
      setValue(normalizedValue)
      toast.success("Short description updated")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to save description")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-ui-border-base bg-ui-bg-base">
      <div className="flex flex-col gap-3 border-b border-ui-border-subtle px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-semibold text-ui-fg-base">Short description</Label>
            <Text size="small" className="text-ui-fg-muted">
              This text is surfaced on the storefront directly beneath the product title.
            </Text>
          </div>
          <div className="flex gap-2">
            <Button size="small" variant="secondary" onClick={handleReset} disabled={!isDirty || isSaving}>
              Reset
            </Button>
            <Button size="small" onClick={handleSave} disabled={!isDirty || isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        <Textarea
          id="product-short-description"
          rows={4}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Enter a punchy sentence that summarizes the product"
          disabled={isSaving}
        />
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
  key: "product-short-description",
})

export default ProductShortDescriptionWidget
