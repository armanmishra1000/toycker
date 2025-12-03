"use client"

import { useEffect, useMemo, useState } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, HttpTypes } from "@medusajs/types"
import { Button, Checkbox, Input, Label, Text, toast } from "@medusajs/ui"

const MODULE_KEY = "productMultiCollectionModule"

type WidgetProps = {
  data?: AdminProduct
}

type MultiCollectionResponse = {
  product_id: string
  collection_ids: string[]
  collections: HttpTypes.AdminProductCollection[]
}

const ProductMultiCollectionsWidget = ({ data }: WidgetProps) => {
  const productId = data?.id
  const [availableCollections, setAvailableCollections] = useState<HttpTypes.AdminProductCollection[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [initialSelection, setInitialSelection] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!productId) {
      return
    }

    let isMounted = true

    const loadCollections = async () => {
      try {
        setIsLoading(true)

        const [collectionsRes, selectionRes] = await Promise.all([
          fetch(`/admin/product-collections?limit=200`, {
            credentials: "include",
          }),
          fetch(`/admin/products/${productId}/multi-collections`, {
            credentials: "include",
          }),
        ])

        if (!collectionsRes.ok) {
          throw new Error("Unable to load collections")
        }

        if (!selectionRes.ok) {
          throw new Error("Unable to load product collections")
        }

        const collectionsPayload = (await collectionsRes.json()) as {
          product_collections?: HttpTypes.AdminProductCollection[]
        }
        const selectionPayload = (await selectionRes.json()) as MultiCollectionResponse

        if (!isMounted) {
          return
        }

        const apiSelection = selectionPayload.collection_ids ?? []
        const baseSelection = data?.collection_id
          ? Array.from(new Set([...apiSelection, data.collection_id]))
          : apiSelection

        setAvailableCollections(collectionsPayload.product_collections ?? [])
        setSelectedIds(baseSelection)
        setInitialSelection(baseSelection)
      } catch (error) {
        console.error(error)
        if (isMounted) {
          toast.error(error instanceof Error ? error.message : "Unable to load collections")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadCollections()

    return () => {
      isMounted = false
    }
  }, [productId, data?.collection_id])

  if (!productId) {
    return null
  }

  const filteredCollections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return availableCollections
    }
    return availableCollections.filter((collection) =>
      collection.title?.toLowerCase().includes(normalizedQuery)
    )
  }, [availableCollections, query])

  const selectedCount = selectedIds.length

  const toggleSelection = (collectionId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(collectionId)) {
        return prev.filter((id) => id !== collectionId)
      }
      return [...prev, collectionId]
    })
  }

  const handleReset = () => {
    setSelectedIds(initialSelection)
    toast.success("Selection reset")
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/admin/products/${productId}/multi-collections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ collection_ids: selectedIds }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: "Unable to save selections" }))
        throw new Error(payload.message || "Unable to save selections")
      }

      const payload = (await response.json()) as MultiCollectionResponse
      setInitialSelection(payload.collection_ids ?? [])
      setSelectedIds(payload.collection_ids ?? [])
      toast.success("Collections updated")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to save selections")
    } finally {
      setIsSaving(false)
    }
  }

  const isDirty = useMemo(() => {
    if (initialSelection.length !== selectedIds.length) {
      return true
    }
    const initialSet = new Set(initialSelection)
    return selectedIds.some((id) => !initialSet.has(id))
  }, [initialSelection, selectedIds])

  return (
    <div className="rounded-2xl border border-ui-border-subtle bg-ui-bg-base p-5">
      <div className="space-y-1">
        <p className="text-base font-semibold text-ui-fg-base">Product collections</p>
        <Text size="small" className="text-ui-fg-muted">
          Add this product to multiple collections to surface it across merchandising modules.
        </Text>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-1">
          <Label htmlFor="collection-search">Search collections</Label>
          <Input
            id="collection-search"
            placeholder="Search by collection name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="rounded-xl border border-ui-border-strong bg-ui-bg-field shadow-inner">
          <div className="flex items-center justify-between border-b border-ui-border-subtle px-4 py-2 text-xs uppercase tracking-wide text-ui-fg-muted">
            <span>Collections</span>
            <span className="font-medium text-ui-fg-base">
              {selectedCount} selected{availableCollections.length ? ` / ${availableCollections.length}` : ""}
            </span>
          </div>
          {isLoading ? (
            <div className="space-y-2 px-4 py-4 text-sm text-ui-fg-muted">
              {[...Array(4)].map((_, index) => (
                <div key={`skeleton-${index}`} className="h-4 w-full animate-pulse rounded bg-ui-bg-subtle" />
              ))}
            </div>
          ) : filteredCollections.length ? (
            <div className="max-h-72 divide-y divide-ui-border-subtle overflow-y-auto bg-ui-bg-base">
              {filteredCollections.map((collection) => (
                <label
                  key={collection.id}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-ui-fg-base transition-colors hover:bg-ui-bg-subtle focus-within:bg-ui-bg-subtle"
                >
                  <Checkbox
                    checked={selectedIds.includes(collection.id)}
                    onCheckedChange={() => toggleSelection(collection.id)}
                    id={`collection-${collection.id}`}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{collection.title}</span>
                    {collection.handle && (
                      <span className="text-xs text-ui-fg-muted">/{collection.handle}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-ui-fg-muted">
              No collections match “{query.trim()}”.
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="small" onClick={handleSave} disabled={!isDirty || isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button size="small" variant="secondary" onClick={handleReset} disabled={!isDirty || isSaving}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
  key: `${MODULE_KEY}-selector`,
})

export default ProductMultiCollectionsWidget
