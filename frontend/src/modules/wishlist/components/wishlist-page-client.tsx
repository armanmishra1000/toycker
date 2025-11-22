"use client"

import { WishlistProvider } from "@modules/products/context/wishlist"
import WishlistContent from "@modules/wishlist/components/wishlist-content"

type WishlistPageClientProps = {
  countryCode: string
  loginPath: string
}

const WishlistPageClient = ({ countryCode, loginPath }: WishlistPageClientProps) => {
  return (
    <WishlistProvider isAuthenticated={true} loginPath={loginPath}>
      <WishlistContent countryCode={countryCode} />
    </WishlistProvider>
  )
}

export default WishlistPageClient
