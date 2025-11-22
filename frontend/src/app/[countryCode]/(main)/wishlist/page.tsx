import { Metadata } from "next"
import { redirect } from "next/navigation"

import { retrieveCustomer } from "@lib/data/customer"
import WishlistPageTemplate from "@modules/wishlist/templates/wishlist-page"

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Review and manage your saved products.",
}

type WishlistPageProps = {
  params: Promise<{ countryCode: string }>
}

const buildLoginRedirect = (countryCode: string) => {
  const loginPath = `/${countryCode}/account`
  const wishlistPath = `/${countryCode}/wishlist`
  return `${loginPath}?redirect=${encodeURIComponent(wishlistPath)}`
}

export default async function WishlistPage({ params }: WishlistPageProps) {
  const { countryCode } = await params
  const customer = await retrieveCustomer()

  if (!customer) {
    redirect(buildLoginRedirect(countryCode))
  }

  const customerName = customer.first_name ?? customer.email ?? "Friend"
  const loginPath = `/${countryCode}/account`

  return (
    <WishlistPageTemplate
      countryCode={countryCode}
      customerName={customerName}
      loginPath={loginPath}
    />
  )
}
