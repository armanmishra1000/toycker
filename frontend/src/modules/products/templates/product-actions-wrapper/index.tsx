import { retrieveCustomer } from "@lib/data/customer"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"
import { WishlistProvider } from "@modules/products/context/wishlist"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 */
export default async function ProductActionsWrapper({
  id,
  region,
  countryCode,
}: {
  id: string
  region: HttpTypes.StoreRegion
  countryCode: string
}) {
  const customerPromise = retrieveCustomer()
  const product = await listProducts({
    queryParams: { id: [id] },
    regionId: region.id,
    countryCode,
  }).then(({ response }) => response.products[0])

  const customer = await customerPromise

  if (!product) {
    return null
  }

  const accountPath = `/${countryCode}/account`

  return (
    <WishlistProvider isAuthenticated={Boolean(customer)} loginPath={accountPath}>
      <ProductActions product={product} />
    </WishlistProvider>
  )
}
