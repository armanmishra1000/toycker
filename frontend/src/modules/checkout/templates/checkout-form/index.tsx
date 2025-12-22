import { listCartOptions } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const { shipping_options: shippingMethods } = await listCartOptions()

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <Addresses cart={cart} customer={customer} />

      {cart.shipping_address && (
        <Shipping cart={cart} availableShippingMethods={shippingMethods} />
      )}
    </div>
  )
}
