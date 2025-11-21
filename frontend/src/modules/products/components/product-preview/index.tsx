"use client"

import { Text, clx } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ViewMode } from "@modules/store/components/refinement-list/types"
import WishlistButton from "@modules/products/components/wishlist-button"

import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { MouseEvent, useMemo, useState, useTransition } from "react"
import type { TransitionStartFunction } from "react"
import { useParams, useRouter } from "next/navigation"

type ProductPreviewProps = {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  viewMode?: ViewMode
}

export default function ProductPreview({
  product,
  isFeatured,
  viewMode = "grid-4",
}: ProductPreviewProps) {
  const { cheapestPrice } = getProductPrice({ product })
  const isListView = viewMode === "list"
  const router = useRouter()
  const params = useParams<{ countryCode?: string }>()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "added" | "error">("idle")
  const countryCodeParam = Array.isArray(params?.countryCode)
    ? params.countryCode[0]
    : params?.countryCode
  const multipleVariants = (product.variants?.length ?? 0) > 1
  const defaultVariant = useMemo(() => {
    if (!product.variants?.length) {
      return null
    }

    const prioritized = product.variants.find((variant) => {
      if (!variant) return false
      if (variant.manage_inventory === false) return true
      if (variant.allow_backorder) return true
      return (variant.inventory_quantity ?? 0) > 0
    })

    return prioritized ?? product.variants[0]
  }, [product.variants])

  const cardClassName = clx(
    "group relative block overflow-hidden transition-all duration-300",
    {
      "flex flex-row gap-6": isListView,
    }
  )
  const imageWrapperClassName = clx(
    "relative w-full overflow-hidden rounded-2xl bg-ui-bg-subtle",
    {
      "w-48 shrink-0 aspect-square": isListView,
      "aspect-square": !isListView,
    }
  )
  const titleSizeMap: Record<ViewMode, string> = {
    "grid-4": "text-lg",
    "grid-5": "text-base",
    list: "text-2xl",
  }
  const titleClassName = clx(
    "font-semibold tracking-tight",
    isListView ? "line-clamp-2" : "line-clamp-1",
    titleSizeMap[viewMode] ?? "text-lg"
  )
  const descriptionPreview = isListView
    ? product.description?.trim()
    : undefined

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className={cardClassName}
    >
      <div
        className={clx("flex flex-col gap-4", {
          "flex w-full flex-row gap-6": isListView,
        })}
        data-testid="product-wrapper"
      >
        <div className={imageWrapperClassName}>
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
            className="h-full w-full rounded-2xl border-none bg-ui-bg-base/0 p-0 shadow-none object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute right-3 top-3 z-10 translate-x-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            <WishlistButton
              productId={product.id}
              productTitle={product.title}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <div className={clx("flex flex-1 flex-col gap-2")}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Text className={titleClassName} data-testid="product-title">
                {product.title}
              </Text>
            </div>
            {descriptionPreview && (
              <p className="text-sm text-ui-fg-muted line-clamp-4 whitespace-pre-line">
                {descriptionPreview}
              </p>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between gap-4">
            <div className="flex items-end justify-between gap-1">
              {cheapestPrice ? (
                <PreviewPrice price={cheapestPrice} />
              ) : (
                <span className="text-sm font-semibold text-ui-fg-base">
                  Pricing unavailable
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(event) =>
                handleAddToCart(event, {
                  multipleVariants,
                  defaultVariantId: defaultVariant?.id,
                  countryCode: countryCodeParam,
                  productHandle: product.handle,
                  startTransition,
                  setStatus,
                  router,
                })
              }
              className={clx(
                "rounded-full px-5 py-2 text-xs font-semibold text-white transition",
                multipleVariants
                  ? "bg-slate-900 hover:bg-slate-800"
                  : "bg-[#111827] hover:bg-black",
                {
                  "cursor-not-allowed opacity-60":
                    !multipleVariants && !defaultVariant?.id,
                }
              )}
              disabled={isPending && !multipleVariants}
            >
              {multipleVariants
                ? "View options"
                : status === "added"
                ? "Added!"
                : status === "error"
                ? "Try again"
                : isPending
                ? "Adding..."
                : "Add to cart"}
            </button>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}

const handleAddToCart = (
  event: MouseEvent<HTMLButtonElement>,
  {
    multipleVariants,
    defaultVariantId,
    countryCode,
    productHandle,
    startTransition,
    setStatus,
    router,
  }: {
    multipleVariants: boolean
    defaultVariantId?: string | null
    countryCode?: string
    productHandle: string
    startTransition: TransitionStartFunction
    setStatus: (value: "idle" | "added" | "error") => void
    router: ReturnType<typeof useRouter>
  }
) => {
  event.preventDefault()
  event.stopPropagation()

  if (multipleVariants || !defaultVariantId || !countryCode) {
    router.push(`/${countryCode ?? "in"}/products/${productHandle}`)
    return
  }

  startTransition(async () => {
    try {
      await addToCart({ variantId: defaultVariantId, quantity: 1, countryCode })
      setStatus("added")
      setTimeout(() => setStatus("idle"), 2000)
    } catch (error) {
      console.error("Failed to add to cart", error)
      setStatus("error")
      setTimeout(() => setStatus("idle"), 2000)
    }
  })
}
