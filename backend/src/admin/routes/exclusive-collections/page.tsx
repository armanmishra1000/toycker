"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Badge,
  Button,
  Drawer,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlaySolid } from "@medusajs/icons"

import { backendBaseUrl } from "../../lib/sdk"

const DEFAULT_BACKEND_URL = "http://localhost:9000"

type ProductSummary = {
  id: string
  title: string
  handle?: string | null
  thumbnail?: string | null
  description?: string | null
}

type AdminExclusiveEntry = {
  id: string
  product_id: string
  video_url: string
  video_key: string
  poster_url: string | null
  sort_order: number | null
  is_active: boolean
  product: ProductSummary | null
}

type UploadResponse = {
  key: string
  url: string
}

const entriesQueryKey = ["exclusive-collections", "entries"] as const

const buildUrlWithQuery = (
  path: string,
  query?: Record<string, string | number | boolean | Array<string | number | boolean> | undefined>,
) => {
  const url = new URL(apiUrl(path))

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return
      }

      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry !== undefined && entry !== null) {
            url.searchParams.append(key, String(entry))
          }
        })
        return
      }

      url.searchParams.set(key, String(value))
    })
  }

  return url.toString()
}

const fetchEntries = async () => {
  const response = await fetch(apiUrl("/admin/exclusive-collections"), {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Unable to load exclusive entries")
  }

  const payload = (await response.json()) as { entries?: AdminExclusiveEntry[] }
  return payload.entries ?? []
}

const formSchema = z.object({
  id: z.string().optional(),
  product_id: z.string({ required_error: "Select a product" }).min(1, "Select a product"),
  video_key: z.string({ required_error: "Upload a video" }).min(1, "Upload a video"),
  video_url: z.string({ required_error: "Upload a video" }).url("Video URL must be valid"),
  poster_url: z.string().url().optional().or(z.literal("")),
  sort_order: z.union([z.number(), z.nan()]).optional(),
  is_active: z.boolean().default(true),
})

type EntryFormValues = z.infer<typeof formSchema>

const apiUrl = (path: string) => {
  try {
    return new URL(path, backendBaseUrl).toString()
  } catch (error) {
    const fallbackBase =
      typeof window !== "undefined" && window.location ? window.location.origin : DEFAULT_BACKEND_URL

    try {
      return new URL(path, fallbackBase).toString()
    } catch {
      if (path.startsWith("http")) {
        return path
      }
      return `${fallbackBase.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
    }
  }
}

const uploadVideo = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append("files", file)

  const response = await fetch(apiUrl("/admin/uploads"), {
    method: "POST",
    body: formData,
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Upload failed. Please try again.")
  }

  const payload = (await response.json()) as {
    uploads?: Array<{ key?: string; url?: string; file_url?: string; download_url?: string; id?: string; name?: string }>
    files?: Array<{ key?: string; url?: string; file_url?: string; download_url?: string; id?: string; name?: string }>
  }

  const upload = payload.uploads?.[0] ?? payload.files?.[0]

  if (!upload) {
    throw new Error("Upload response missing file payload")
  }

  const fileUrl = upload.url ?? upload.file_url ?? upload.download_url
  const keyCandidates = [upload.key, upload.name, upload.id]

  let derivedKey = keyCandidates.find((candidate) => {
    if (typeof candidate === "string") {
      return candidate.trim().length > 0
    }
    return Boolean(candidate)
  }) as string | undefined

  if (!derivedKey && fileUrl) {
    try {
      const parsedUrl = new URL(fileUrl)
      derivedKey = parsedUrl.pathname.replace(/\/+$/, "").replace(/^\/+/, "")
    } catch {
      derivedKey = fileUrl
    }
  }

  if (!derivedKey || !fileUrl) {
    throw new Error("Upload response missing required fields")
  }

  return {
    key: derivedKey,
    url: fileUrl,
  }
}

const ExclusiveCollectionsPage = () => {
  const queryClient = useQueryClient()
  const [drawerEntry, setDrawerEntry] = useState<AdminExclusiveEntry | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { data: entries = [], isLoading } = useQuery({
    queryKey: entriesQueryKey,
    queryFn: fetchEntries,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: entriesQueryKey })
  }, [queryClient])

  const upsertMutation = useMutation({
    mutationFn: async (payload: EntryFormValues) => {
      const method = payload.id ? "PATCH" : "POST"
      const response = await fetch(apiUrl("/admin/exclusive-collections"), {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({ message: "Unable to save entry" }))
        throw new Error(errorPayload.message || "Unable to save entry")
      }

      return (await response.json()) as { entry: AdminExclusiveEntry }
    },
    onSuccess: () => {
      toast.success("Entry saved")
      invalidate()
      setIsDrawerOpen(false)
      setDrawerEntry(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save entry")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(apiUrl("/admin/exclusive-collections"), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
        credentials: "include",
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: "Unable to delete entry" }))
        throw new Error(payload.message || "Unable to delete entry")
      }
    },
    onSuccess: () => {
      toast.success("Entry deleted")
      invalidate()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete entry")
    },
  })

  const handleToggleVisibility = async (entry: AdminExclusiveEntry, nextValue: boolean) => {
    upsertMutation.mutate({
      id: entry.id,
      product_id: entry.product_id,
      video_key: entry.video_key,
      video_url: entry.video_url,
      poster_url: entry.poster_url ?? "",
      sort_order: entry.sort_order ?? undefined,
      is_active: nextValue,
    })
  }

  const openDrawer = (entry?: AdminExclusiveEntry | null) => {
    setDrawerEntry(entry ?? null)
    setIsDrawerOpen(true)
  }

  const handleDelete = (id: string) => {
    if (deleteMutation.isPending) {
      return
    }
    deleteMutation.mutate(id)
  }

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [entries])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level="h1">Exclusive collections</Heading>
            <Text className="text-ui-fg-subtle">
              Pair Cloudflare R2 videos with products to power the storefront slider.
            </Text>
          </div>
          <Button size="small" onClick={() => openDrawer(null)}>
            Add entry
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-ui-border-subtle bg-ui-bg-base p-6">
          <Text size="small" className="text-ui-fg-subtle">
            Loading entries...
          </Text>
        </div>
      ) : sortedEntries.length ? (
        <div className="space-y-4">
          {sortedEntries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-3xl border border-ui-border-base bg-ui-bg-base p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Text className="text-sm font-semibold text-ui-fg-base">
                    {entry.product?.title ?? "Product deleted"}
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    {entry.product?.handle ? `/${entry.product.handle}` : entry.product_id}
                  </Text>
                </div>
                <Badge color={entry.is_active ? "green" : "orange"}>
                  {entry.is_active ? "Active" : "Hidden"}
                </Badge>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[240px,1fr]">
                <div className="overflow-hidden rounded-2xl border border-ui-border-subtle bg-ui-bg-subtle">
                  <video
                    src={entry.video_url}
                    controls
                    poster={entry.poster_url ?? entry.product?.thumbnail ?? undefined}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-ui-fg-subtle">
                      Video URL
                    </Label>
                    <Textarea value={entry.video_url} readOnly rows={3} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`entry-${entry.id}-toggle`}
                        checked={entry.is_active}
                        onCheckedChange={(value) =>
                          handleToggleVisibility(entry, Boolean(value))
                        }
                      />
                      <Label htmlFor={`entry-${entry.id}-toggle`}>Visible</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button size="small" variant="secondary" onClick={() => openDrawer(entry)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-ui-border-subtle bg-ui-bg-base p-10 text-center">
          <Heading level="h3" className="text-lg">
            No entries yet
          </Heading>
          <Text className="mt-2 text-ui-fg-subtle">
            Upload a video and connect it to a product to populate the storefront section.
          </Text>
          <Button className="mt-6" onClick={() => openDrawer(null)}>
            Create first entry
          </Button>
        </div>
      )}

      <EntryDrawer
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open)
          if (!open) {
            setDrawerEntry(null)
          }
        }}
        entry={drawerEntry}
        isSaving={upsertMutation.isPending}
        onSubmit={(values) => upsertMutation.mutate(values)}
      />
    </div>
  )
}

type EntryDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: AdminExclusiveEntry | null
  isSaving: boolean
  onSubmit: (values: EntryFormValues) => void
}

const EntryDrawer = ({ open, onOpenChange, entry, isSaving, onSubmit }: EntryDrawerProps) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: "",
      video_key: "",
      video_url: "",
      poster_url: "",
      sort_order: undefined,
      is_active: true,
    },
  })

  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(entry?.product ?? null)
  const [searchTerm, setSearchTerm] = useState(entry?.product?.title ?? "")
  const [searchResults, setSearchResults] = useState<ProductSummary[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [uploading, setUploading] = useState(false)

  const closeDrawer = () => {
    onOpenChange(false)
  }

  const resetForm = useCallback(() => {
    reset({
      id: entry?.id,
      product_id: entry?.product_id ?? "",
      video_key: entry?.video_key ?? "",
      video_url: entry?.video_url ?? "",
      poster_url: entry?.poster_url ?? "",
      sort_order: entry?.sort_order ?? undefined,
      is_active: entry?.is_active ?? true,
    })
    setSelectedProduct(entry?.product ?? null)
    setSearchTerm(entry?.product?.title ?? "")
  }, [entry, reset])

  useEffect(() => {
    if (open) {
      resetForm()
      return
    }
    setSearchTerm("")
    setSearchResults([])
    setSelectedProduct(null)
  }, [open, resetForm])

  const performSearch = useCallback(
    async (term: string) => {
      if (term.trim().length < 2) {
        setSearchResults([])
        setIsSearching(false)
        return
      }
      setIsSearching(true)
      try {
        const response = await fetch(
          buildUrlWithQuery("/admin/products", {
            q: term,
            limit: 5,
            fields: "id,title,handle,thumbnail",
          }),
          {
            credentials: "include",
          },
        )

        if (!response.ok) {
          throw new Error("Unable to search products")
        }

        const { products } = (await response.json()) as { products?: ProductSummary[] }
        setSearchResults(products ?? [])
      } catch (error) {
        console.error(error)
      } finally {
        setIsSearching(false)
      }
    },
    [],
  )

  const handleVideoSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)
    try {
      const upload = await uploadVideo(file)
      setValue("video_key", upload.key, { shouldDirty: true })
      setValue("video_url", upload.url, { shouldDirty: true })
      toast.success("Video uploaded")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const submit = handleSubmit((values) => {
    const normalizedSort = Number.isFinite(values.sort_order as number)
      ? (values.sort_order as number)
      : undefined
    onSubmit({
      ...values,
      sort_order: normalizedSort,
    })
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content className="flex max-w-2xl flex-col rounded-l-3xl border border-ui-border-base bg-ui-bg-base">
        <form onSubmit={submit} className="flex h-full flex-col">
          <input type="hidden" {...register("product_id")} />
          <input type="hidden" {...register("video_key")} />
          <Drawer.Header className="border-b border-ui-border-subtle p-6">
            <Drawer.Title className="text-xl font-semibold text-ui-fg-base">
              {entry ? "Edit entry" : "New entry"}
            </Drawer.Title>
            <Drawer.Description className="text-sm text-ui-fg-subtle">
              Upload a video and select the product that should appear in the Exclusive Collections section.
            </Drawer.Description>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="exclusive-product">Product</Label>
                <Input
                  id="exclusive-product"
                  placeholder="Search by product title"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value)
                    void performSearch(event.target.value)
                  }}
                />
                {errors.product_id && (
                  <Text size="small" className="text-ui-fg-error">
                    {errors.product_id.message}
                  </Text>
                )}
                <div className="rounded-2xl border border-ui-border-subtle">
                  {isSearching ? (
                    <div className="p-4 text-sm text-ui-fg-subtle">Searching…</div>
                  ) : searchResults.length ? (
                    searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="flex w-full items-start gap-3 border-b border-ui-border-subtle px-4 py-3 text-left last:border-b-0 hover:bg-ui-bg-subtle"
                        onClick={() => {
                          setSelectedProduct(product)
                          setValue("product_id", product.id, { shouldDirty: true })
                          setSearchTerm(product.title)
                          setSearchResults([])
                        }}
                      >
                        <div>
                          <Text className="font-medium">{product.title}</Text>
                          <Text size="small" className="text-ui-fg-subtle">
                            {product.handle ? `/${product.handle}` : product.id}
                          </Text>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-ui-fg-subtle">
                      {searchTerm.length < 2 ? "Enter at least 2 characters" : "No matches"}
                    </div>
                  )}
                </div>
                {selectedProduct && (
                  <div className="rounded-2xl border border-ui-border-subtle bg-ui-bg-field p-4">
                    <Text className="font-semibold">{selectedProduct.title}</Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      {selectedProduct.handle ? `/${selectedProduct.handle}` : selectedProduct.id}
                    </Text>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exclusive-video">Video upload</Label>
                <Input id="exclusive-video" type="file" accept="video/*" onChange={handleVideoSelection} />
                <Text size="small" className="text-ui-fg-subtle">
                  Upload MP4 or WebM files. They are stored in Cloudflare R2 automatically.
                </Text>
                {uploading && (
                  <Text size="small" className="text-ui-fg-subtle">
                    Uploading…
                  </Text>
                )}
                {errors.video_key && (
                  <Text size="small" className="text-ui-fg-error">
                    {errors.video_key.message}
                  </Text>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exclusive-video-url">Video URL</Label>
                <Input id="exclusive-video-url" readOnly {...register("video_url")} />
                {errors.video_url && (
                  <Text size="small" className="text-ui-fg-error">
                    {errors.video_url.message}
                  </Text>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exclusive-sort">Sort order (optional)</Label>
                <Input id="exclusive-sort" type="number" {...register("sort_order", { valueAsNumber: true })} />
              </div>

              <div className="flex items-center gap-3">
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Switch
                      id="exclusive-visible"
                      checked={Boolean(value)}
                      onCheckedChange={(state) => onChange(Boolean(state))}
                    />
                  )}
                />
                <Label htmlFor="exclusive-visible">Visible on storefront</Label>
              </div>
            </div>
          </Drawer.Body>
          <Drawer.Footer className="flex items-center justify-end gap-3 border-t border-ui-border-subtle p-6">
            <Button type="button" variant="secondary" onClick={closeDrawer}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || uploading}>
              {isSaving ? "Saving…" : entry ? "Update" : "Create"}
            </Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  )
}

export const config = defineRouteConfig({
  label: "Exclusive collections",
  icon: PlaySolid,
})

export default ExclusiveCollectionsPage
