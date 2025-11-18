import { Text, clx } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ViewMode } from "@modules/store/components/refinement-list/types"

import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

type ProductPreviewProps = {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  viewMode?: ViewMode
}

const isProductInStock = (product: HttpTypes.StoreProduct) =>
  product.variants?.some((variant) => {
    if (variant?.manage_inventory === false) {
      return true
    }

    return (variant?.inventory_quantity ?? 0) > 0
  }) ?? false

export default function ProductPreview({
  product,
  isFeatured,
  viewMode = "grid-3",
}: ProductPreviewProps) {
  const { cheapestPrice } = getProductPrice({ product })
  const inStock = isProductInStock(product)
  const isListView = viewMode === "list"
  const cardClassName = clx(
    "group relative block rounded-3xl border border-ui-border-base bg-ui-bg-base/80 p-4 shadow-elevation-card-rest transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevation-card-hover",
    {
      "flex flex-row gap-6 p-6": isListView,
    }
  )
  const imageWrapperClassName = clx(
    "relative w-full overflow-hidden rounded-2xl",
    {
      "w-44 shrink-0 aspect-square": isListView,
      "aspect-square": !isListView,
    }
  )

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className={cardClassName}>
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
            className="h-full w-full rounded-2xl border-none bg-ui-bg-base/0 p-0 shadow-none object-cover transition-transform duration-300 group-hover:scale-[1.05]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-ui-bg-base/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
          <div className="pointer-events-none absolute inset-x-8 bottom-6 translate-y-4 rounded-full bg-white px-4 py-2 text-center text-xs font-semibold text-ui-fg-base opacity-0 shadow-elevation-card-hover transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Add to cart
          </div>
        </div>
        <div className={clx("flex flex-1 flex-col justify-between gap-3", { "py-1": !isListView })}>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Text className="text-lg font-semibold" data-testid="product-title">
                {product.title}
              </Text>
              <span
                className={clx(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  inStock ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                )}
              >
                {inStock ? "Available" : "Sold out"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
