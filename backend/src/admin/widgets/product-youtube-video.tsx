"use client"

import { useEffect, useMemo, useState } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct } from "@medusajs/types"
import { Button, Input, Label, Text, toast } from "@medusajs/ui"

import { PRODUCT_YOUTUBE_VIDEO_KEY } from "../../constants/product-metadata"

type WidgetProps = {
  data?: AdminProduct
}

const extractYouTubeVideoId = (url: string): string | null => {
  if (!url || typeof url !== "string") {
    return null
  }

  // Match various YouTube URL formats:
  // - youtube.com/watch?v=VIDEO_ID
  // - youtu.be/VIDEO_ID
  // - youtube.com/embed/VIDEO_ID
  // - youtube.com/v/VIDEO_ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID input
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

const getMetadataYouTubeUrl = (product?: AdminProduct): string => {
  const metadata = product?.metadata as Record<string, unknown> | null | undefined
  const candidate = metadata?.[PRODUCT_YOUTUBE_VIDEO_KEY]
  return typeof candidate === "string" ? candidate : ""
}

const ProductYouTubeVideoWidget = ({ data }: WidgetProps) => {
  const productId = data?.id
  const initialValue = useMemo(() => getMetadataYouTubeUrl(data), [data?.id, data?.metadata])
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
  const videoId = extractYouTubeVideoId(normalizedValue)
  const isValidUrl = Boolean(normalizedValue && videoId)
  const hasError = Boolean(normalizedValue && !isValidUrl)

  const handleReset = () => {
    setValue(savedValue)
    toast.info("Reverted changes")
  }

  const handleSave = async () => {
    if (normalizedValue && !isValidUrl) {
      toast.error("Please enter a valid YouTube URL")
      return
    }

    setIsSaving(true)
    try {
      const nextMetadata: Record<string, unknown> = {
        ...((data?.metadata as Record<string, unknown> | null | undefined) ?? {}),
      }

      if (normalizedValue) {
        nextMetadata[PRODUCT_YOUTUBE_VIDEO_KEY] = normalizedValue
      } else {
        delete nextMetadata[PRODUCT_YOUTUBE_VIDEO_KEY]
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
        const payload = await response.json().catch(() => ({ message: "Unable to save video URL" }))
        throw new Error(payload.message || "Unable to save video URL")
      }

      setSavedValue(normalizedValue)
      setValue(normalizedValue)
      toast.success("YouTube video URL updated")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to save video URL")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-ui-border-base bg-ui-bg-base">
      <div className="flex flex-col gap-3 border-b border-ui-border-subtle px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-semibold text-ui-fg-base">YouTube Video</Label>
            <Text size="small" className="text-ui-fg-muted">
              Add a YouTube video URL to display on the product page.
            </Text>
          </div>
          <div className="flex gap-2">
            <Button size="small" variant="secondary" onClick={handleReset} disabled={!isDirty || isSaving}>
              Reset
            </Button>
            <Button size="small" onClick={handleSave} disabled={(isDirty && hasError) || !isDirty || isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Input
            id="product-youtube-video"
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={isSaving}
          />
          {hasError && (
            <Text size="small" className="text-red-500">
              Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=xxx or https://youtu.be/xxx)
            </Text>
          )}
          {isValidUrl && videoId && (
            <Text size="small" className="text-ui-fg-muted">
              Video ID: {videoId}
            </Text>
          )}
        </div>
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
  key: "product-youtube-video",
})

export default ProductYouTubeVideoWidget
