"use client"

import { WishlistProvider } from "@modules/products/context/wishlist"
import WishlistContent from "@modules/wishlist/components/wishlist-content"

type WishlistPageClientProps = {
  countryCode: string
  loginRedirect: string
  loginRedirect: string
  isCustomerLoggedIn: boolean
}

const WishlistPageClient = ({ countryCode, loginPath, loginRedirect, isCustomerLoggedIn }: WishlistPageClientProps) => {
  return (
    <WishlistProvider
      isAuthenticated={isCustomerLoggedIn}
      loginPath={loginRedirect}
    >
      <WishlistContent countryCode={countryCode} />
    </WishlistProvider>
  )
}

export default WishlistPageClient
