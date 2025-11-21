"use client"

import { MouseEvent } from "react"

import { Heart } from "lucide-react"

import { useWishlist } from "@modules/products/context/wishlist"

type WishlistButtonProps = {
  productId: string
  productTitle: string
}

const WishlistButton = ({ productId, productTitle }: WishlistButtonProps) => {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const isActive = isInWishlist(productId)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    toggleWishlist(productId)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isActive}
      aria-label={isActive ? `Remove ${productTitle} from wishlist` : `Add ${productTitle} to wishlist`}
      className="rounded-full border border-ui-border-base bg-white/90 p-2 text-ui-fg-muted shadow-sm transition hover:border-ui-border-strong hover:text-ui-fg-base"
    >
      <Heart
        className="h-4 w-4"
        aria-hidden
        fill={isActive ? "currentColor" : "none"}
      />
    </button>
  )
}

export default WishlistButton
