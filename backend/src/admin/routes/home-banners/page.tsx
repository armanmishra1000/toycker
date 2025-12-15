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
const KEY_PREFIX = "uploads/home-banners/"

type AdminHomeBanner = {
  id: string
  image_url: string
  image_key: string
  alt_text: string | null
  sort_order: number | null
  is_visible: boolean
  starts_at: string | null
  ends_at: string | null
}

type UploadResponse = {
  key: string
  url: string
}

const bannersQueryKey = ["home-banners", "entries"] as const

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
      return `${fallbackBase.replace(/\/+/g, "/")}/${path.replace(/^\/+/, "")}`
    }
  }
}

const fetchBanners = async () => {
  const response = await fetch(apiUrl("/admin/home-banners"), { credentials: "include" })

  if (!response.ok) {
    throw new Error("Unable to load banners")
  }

  const payload = (await response.json()) as { banners?: AdminHomeBanner[] }
  return payload.banners ?? []
}

const formSchema = z.object({
  id: z.string().optional(),
  image_key: z.string({ required_error: "Upload an image" }).min(1, "Upload an image"),
  image_url: z.string({ required_error: "Upload an image" }).url("Image URL must be valid"),
  alt_text: z.string().trim().optional().or(z.literal("")),
  sort_order: z.union([z.number(), z.nan()]).optional(),
  is_visible: z.boolean().default(true),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
})

type BannerFormValues = z.infer<typeof formSchema>

const uploadImage = async (file: File): Promise<UploadResponse> => {
  const sanitizedName = file.name.replace(/\s+/g, "-")
  const fileName = `home-banners/${Date.now()}-${sanitizedName}`

  const formData = new FormData()
  formData.append("files", file, fileName)

  const response = await fetch(apiUrl("/admin/uploads"), {
    method: "POST",
    body: formData,
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Upload failed. Please try again.")
  }

  const payload = (await response.json()) as {
    uploads?: Array<{ key?: string; url?: string; file_url?: string; download_url?: string; name?: string }>
    files?: Array<{ key?: string; url?: string; file_url?: string; download_url?: string; name?: string }>
  }

  const upload = payload.uploads?.[0] ?? payload.files?.[0]

  if (!upload) {
    throw new Error("Upload response missing file payload")
  }

  const fileUrl = upload.url ?? upload.file_url ?? upload.download_url
  const keyCandidates = [upload.key, upload.name, upload.id]

  let derivedKey = keyCandidates.find((candidate) => typeof candidate === "string" && candidate.trim())

  if (!derivedKey && fileUrl) {
    try {
      const parsedUrl = new URL(fileUrl)
      derivedKey = parsedUrl.pathname.replace(/\/+$/, "").replace(/^\/+/, "")
    } catch {
      derivedKey = fileUrl
    }
  }

  if (!fileUrl || !derivedKey) {
    throw new Error("Upload response missing required fields")
  }

  const normalizedKey = derivedKey.startsWith(KEY_PREFIX)
    ? derivedKey
    : `${KEY_PREFIX}${derivedKey.replace(/^uploads\//, "")}`

  return {
    key: normalizedKey,
    url: fileUrl,
  }
}

const formatDateRange = (startsAt: string | null, endsAt: string | null) => {
  if (!startsAt && !endsAt) {
    return "Always visible"
  }
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })

  const startLabel = startsAt ? formatter.format(new Date(startsAt)) : "From now"
  const endLabel = endsAt ? formatter.format(new Date(endsAt)) : "No end date"

  return `${startLabel} → ${endLabel}`
}

const HomeBannersPage = () => {
  const queryClient = useQueryClient()
  const [drawerBanner, setDrawerBanner] = useState<AdminHomeBanner | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { data: banners = [], isLoading } = useQuery({
    queryKey: bannersQueryKey,
    queryFn: fetchBanners,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: bannersQueryKey })
  }, [queryClient])

  const upsertMutation = useMutation({
    mutationFn: async (payload: BannerFormValues) => {
      const method = payload.id ? "PATCH" : "POST"
      const response = await fetch(apiUrl("/admin/home-banners"), {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({ message: "Unable to save banner" }))
        throw new Error(errorPayload.message || "Unable to save banner")
      }

      return (await response.json()) as { banner: AdminHomeBanner }
    },
    onSuccess: () => {
      toast.success("Banner saved")
      invalidate()
      setIsDrawerOpen(false)
      setDrawerBanner(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save banner")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(apiUrl("/admin/home-banners"), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: "Unable to delete banner" }))
        throw new Error(payload.message || "Unable to delete banner")
      }
    },
    onSuccess: () => {
      toast.success("Banner deleted")
      invalidate()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete banner")
    },
  })

  const handleToggleVisibility = async (banner: AdminHomeBanner, nextVisible: boolean) => {
    upsertMutation.mutate({
      id: banner.id,
      image_key: banner.image_key,
      image_url: banner.image_url,
      alt_text: banner.alt_text ?? "",
      sort_order: banner.sort_order ?? undefined,
      is_visible: nextVisible,
      starts_at: banner.starts_at ?? undefined,
      ends_at: banner.ends_at ?? undefined,
    })
  }

  const sortedBanners = useMemo(() => {
    return [...banners].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [banners])

  const openDrawer = (banner?: AdminHomeBanner | null) => {
    setDrawerBanner(banner ?? null)
    setIsDrawerOpen(true)
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Heading level="h1">Home hero banners</Heading>
          <Text className="text-ui-fg-subtle">
            Manage hero banners stored in Cloudflare R2 under uploads/home-banners.
          </Text>
        </div>
        <Button size="small" onClick={() => openDrawer(null)}>
          Add banner
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-ui-border-subtle bg-ui-bg-base p-6">
          <Text size="small" className="text-ui-fg-subtle">
            Loading banners...
          </Text>
        </div>
      ) : sortedBanners.length ? (
        <div className="space-y-4">
          {sortedBanners.map((banner) => (
            <article
              key={banner.id}
              className="rounded-3xl border border-ui-border-base bg-ui-bg-base p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-20 overflow-hidden rounded-lg border border-ui-border-subtle bg-ui-bg-subtle">
                    <img
                      src={banner.image_url}
                      alt={banner.alt_text ?? "Hero banner"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <Text className="text-sm font-semibold text-ui-fg-base">{banner.alt_text || "Hero banner"}</Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      {formatDateRange(banner.starts_at, banner.ends_at)}
                    </Text>
                  </div>
                </div>
                <Badge color={banner.is_visible ? "green" : "orange"}>
                  {banner.is_visible ? "Visible" : "Hidden"}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`banner-${banner.id}-toggle`}
                    checked={banner.is_visible}
                    onCheckedChange={(value) => handleToggleVisibility(banner, Boolean(value))}
                  />
                  <Label htmlFor={`banner-${banner.id}-toggle`}>Visible</Label>
                </div>
                <div className="flex gap-2">
                  <Button size="small" variant="secondary" onClick={() => openDrawer(banner)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="danger"
                    onClick={() => deleteMutation.mutate(banner.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-ui-border-subtle bg-ui-bg-base p-10 text-center">
          <Heading level="h3" className="text-lg">
            No banners yet
          </Heading>
          <Text className="mt-2 text-ui-fg-subtle">
            Upload an image to appear in the home hero slider.
          </Text>
          <Button className="mt-6" onClick={() => openDrawer(null)}>
            Create first banner
          </Button>
        </div>
      )}

      <BannerDrawer
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open)
          if (!open) {
            setDrawerBanner(null)
          }
        }}
        banner={drawerBanner}
        isSaving={upsertMutation.isPending}
        onSubmit={(values) => upsertMutation.mutate(values)}
      />
    </div>
  )
}

type BannerDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  banner: AdminHomeBanner | null
  isSaving: boolean
  onSubmit: (values: BannerFormValues) => void
}

const toInputDateTimeValue = (value: string | null) => {
  if (!value) return ""
  const date = new Date(value)
  const iso = date.toISOString()
  return iso.slice(0, 16)
}

const BannerDrawer = ({ open, onOpenChange, banner, isSaving, onSubmit }: BannerDrawerProps) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      image_key: "",
      image_url: "",
      alt_text: "",
      sort_order: undefined,
      is_visible: true,
      starts_at: "",
      ends_at: "",
    },
  })

  const [uploading, setUploading] = useState(false)

  const resetForm = useCallback(() => {
    reset({
      id: banner?.id,
      image_key: banner?.image_key ?? "",
      image_url: banner?.image_url ?? "",
      alt_text: banner?.alt_text ?? "",
      sort_order: banner?.sort_order ?? undefined,
      is_visible: banner?.is_visible ?? true,
      starts_at: toInputDateTimeValue(banner?.starts_at ?? null),
      ends_at: toInputDateTimeValue(banner?.ends_at ?? null),
    })
  }, [banner, reset])

  useEffect(() => {
    if (open) {
      resetForm()
      return
    }
  }, [open, resetForm])

  const handleImageSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)
    try {
      const upload = await uploadImage(file)
      setValue("image_key", upload.key, { shouldDirty: true })
      setValue("image_url", upload.url, { shouldDirty: true })
      toast.success("Image uploaded")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const submit = handleSubmit((values) => {
    const startsAtIso = values.starts_at ? new Date(values.starts_at).toISOString() : undefined
    const endsAtIso = values.ends_at ? new Date(values.ends_at).toISOString() : undefined
    const normalizedSort = Number.isFinite(values.sort_order as number)
      ? (values.sort_order as number)
      : undefined

    onSubmit({
      ...values,
      sort_order: normalizedSort,
      starts_at: startsAtIso,
      ends_at: endsAtIso,
    })
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content className="flex max-w-2xl flex-col rounded-l-3xl border border-ui-border-base bg-ui-bg-base">
        <form onSubmit={submit} className="flex h-full flex-col">
          <input type="hidden" {...register("image_key")} />
          <input type="hidden" {...register("image_url")} />
          <Drawer.Header className="border-b border-ui-border-subtle p-6">
            <Drawer.Title className="text-xl font-semibold text-ui-fg-base">
              {banner ? "Edit banner" : "New banner"}
            </Drawer.Title>
            <Drawer.Description className="text-sm text-ui-fg-subtle">
              Upload a hero banner image stored under uploads/home-banners and control visibility.
            </Drawer.Description>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="hero-image">Image upload</Label>
                <Input id="hero-image" type="file" accept="image/*" onChange={handleImageSelection} />
                <Text size="small" className="text-ui-fg-subtle">
                  Stored under uploads/home-banners.
                </Text>
                {uploading && (
                  <Text size="small" className="text-ui-fg-subtle">
                    Uploading…
                  </Text>
                )}
                {errors.image_key && (
                  <Text size="small" className="text-ui-fg-error">
                    {errors.image_key.message}
                  </Text>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero-image-url">Image URL</Label>
                <Input id="hero-image-url" readOnly {...register("image_url")} />
                {errors.image_url && (
                  <Text size="small" className="text-ui-fg-error">
                    {errors.image_url.message}
                  </Text>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero-alt">Alt text</Label>
                <Textarea id="hero-alt" rows={2} placeholder="Describe the banner" {...register("alt_text")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hero-start">Starts at (optional)</Label>
                  <Input id="hero-start" type="datetime-local" {...register("starts_at")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-end">Ends at (optional)</Label>
                  <Input id="hero-end" type="datetime-local" {...register("ends_at")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero-sort">Sort order (optional)</Label>
                <Input id="hero-sort" type="number" {...register("sort_order", { valueAsNumber: true })} />
              </div>

              <div className="flex items-center gap-3">
                <Controller
                  name="is_visible"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Switch
                      id="hero-visible"
                      checked={Boolean(value)}
                      onCheckedChange={(state) => onChange(Boolean(state))}
                    />
                  )}
                />
                <Label htmlFor="hero-visible">Visible on storefront</Label>
              </div>
            </div>
          </Drawer.Body>
          <Drawer.Footer className="flex items-center justify-end gap-3 border-t border-ui-border-subtle p-6">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || uploading}>
              {isSaving ? "Saving…" : banner ? "Update" : "Create"}
            </Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  )
}

export const config = defineRouteConfig({
  label: "Home hero banners",
  icon: PlaySolid,
})

export default HomeBannersPage
