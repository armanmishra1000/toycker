import { Metadata } from "next"
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

  const isCustomerLoggedIn = Boolean(customer)
  const customerName = customer?.first_name ?? customer?.email ?? "Friend"
  const loginRedirect = buildLoginRedirect(countryCode)

  return (
    <WishlistPageTemplate
      countryCode={countryCode}
      customerName={customerName}
      loginRedirect={loginRedirect}
      isCustomerLoggedIn={isCustomerLoggedIn}
    />
  )
}
