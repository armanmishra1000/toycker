"use client"

import { Dispatch, SetStateAction, useRef, useState } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminCollection } from "@medusajs/types"
import { Button, Input, Label, Text, toast } from "@medusajs/ui"

import {
  CATALOG_CARD_IMAGE_ALT_KEY,
  CATALOG_CARD_IMAGE_URL_KEY,
} from "../../constants/catalog"

type CollectionEntity = AdminCollection

type CollectionWidgetProps = {
  data?: CollectionEntity
}

const CollectionCardImageWidget = ({ data }: CollectionWidgetProps) => {
  const [altText, setAltText] = useState<string>(
    ((data?.metadata ?? {}) as Record<string, unknown>)[
      CATALOG_CARD_IMAGE_ALT_KEY
    ] as string ?? ""
  )
  const [preview, setPreview] = useState<string | null>(
    (((data?.metadata ?? {}) as Record<string, unknown>)[
      CATALOG_CARD_IMAGE_URL_KEY
    ] as string) ?? null
  )
  const [isBusy, setIsBusy] = useState(false)
  const [metadataSnapshot, setMetadataSnapshot] = useState<Record<string, unknown>>(
    () => ({ ...((data?.metadata as Record<string, unknown>) ?? {}) })
  )
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!data) {
    return null
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setIsBusy(true)

    try {
      const uploadedUrl = await uploadFile(file)
      await updateCollectionMetadata(data.id, metadataSnapshot, {
        [CATALOG_CARD_IMAGE_URL_KEY]: uploadedUrl,
        [CATALOG_CARD_IMAGE_ALT_KEY]: altText || fallbackAlt(data),
      }, setMetadataSnapshot)
      setPreview(uploadedUrl)
      toast.success("Collection card updated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      )
    } finally {
      setIsBusy(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleSaveAlt = async () => {
    if (!preview && !altText) {
      toast.info("Add an image before saving alt text")
      return
    }

    setIsBusy(true)
    try {
      await updateCollectionMetadata(data.id, metadataSnapshot, {
        [CATALOG_CARD_IMAGE_URL_KEY]: preview,
        [CATALOG_CARD_IMAGE_ALT_KEY]: altText || fallbackAlt(data),
      }, setMetadataSnapshot)
      toast.success("Alt text saved")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save alt text"
      )
    } finally {
      setIsBusy(false)
    }
  }

  const handleRemove = async () => {
    if (!preview) {
      return
    }
    setIsBusy(true)
    try {
      await updateCollectionMetadata(data.id, metadataSnapshot, {
        [CATALOG_CARD_IMAGE_URL_KEY]: null,
        [CATALOG_CARD_IMAGE_ALT_KEY]: null,
      }, setMetadataSnapshot)
      setPreview(null)
      setAltText("")
      toast.success("Card image removed")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove image"
      )
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-ui-border-subtle bg-ui-bg-base p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-ui-fg-base">
            Collection card image
          </p>
          <Text size="small" className="text-ui-fg-muted">
            These images power the `/collections` landing grid.
          </Text>
        </div>
      </div>
      <div className="space-y-4">
        {preview ? (
          <div className="overflow-hidden rounded-xl border border-ui-border-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={altText || fallbackAlt(data)} className="h-56 w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-56 w-full items-center justify-center rounded-xl border border-dashed border-ui-border-strong bg-ui-bg-subtle text-sm text-ui-fg-muted">
            No image uploaded yet
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="collection-card-image">Upload image</Label>
          <input
            ref={fileInputRef}
            id="collection-card-image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={isBusy}
            className="rounded-lg border border-ui-border-subtle bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="collection-card-alt">Alt text</Label>
          <Input
            id="collection-card-alt"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            disabled={isBusy}
            placeholder={`E.g. ${data.title} assortment`}
          />
          <Text size="small" className="text-ui-fg-muted">
            Describe the image for accessibility and SEO.
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="small" variant="secondary" onClick={handleSaveAlt} disabled={isBusy}>
            Save text
          </Button>
          <Button
            size="small"
            variant="danger"
            onClick={handleRemove}
            disabled={isBusy || !preview}
          >
            Remove image
          </Button>
        </div>
      </div>
    </div>
  )
}

const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append("files", file)

  const response = await fetch("/admin/uploads", {
    method: "POST",
    body: formData,
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Image upload failed")
  }

  const payload = (await response.json()) as {
    files?: { url?: string; file_url?: string; download_url?: string; key?: string }[]
  }

  const uploaded = payload.files?.[0]

  const url = uploaded?.url || uploaded?.file_url || uploaded?.download_url

  if (!url) {
    throw new Error("Upload response missing URL")
  }

  return url
}

const updateCollectionMetadata = async (
  id: string,
  snapshot: Record<string, unknown>,
  overrides: Record<string, unknown | null>,
  setSnapshot: Dispatch<SetStateAction<Record<string, unknown>>>
) => {
  const nextMetadata = { ...snapshot }

  Object.entries(overrides).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      delete nextMetadata[key]
      if (value === null) {
        nextMetadata[key] = null
      }
      return
    }
    nextMetadata[key] = value
  })

  const response = await fetch(`/admin/collections/${id}`, {
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
    throw new Error("Unable to persist collection image")
  }

  setSnapshot(nextMetadata)
}

const fallbackAlt = (collection: CollectionEntity) => `${collection.title} preview`

export const config = defineWidgetConfig({
  zone: "product_collection.details.after",
})

export default CollectionCardImageWidget
