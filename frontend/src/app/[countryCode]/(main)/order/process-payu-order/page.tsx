import { placeOrder } from "@lib/data/cart"
import { redirect } from "next/navigation"

type Props = {
  searchParams: Promise<{ cartId?: string }>
}

/**
 * Process PayU Order
 *
 * This page is called after PayU callback with cart ID.
 * It creates the order from the cart and redirects to confirmation page.
 */
export default async function ProcessPayUOrderPage(props: Props) {
  const params = await props.searchParams
  const cartId = params.cartId

  // Validate cart ID
  if (!cartId) {
    redirect("/checkout?error=missing_cart_id")
  }

  try {
    // placeOrder will create the order and redirect to /order/[id]/confirmed
    await placeOrder(cartId)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order creation failed"
    console.error("[PayU] Order creation failed:", message)
    redirect("/checkout?error=order_creation_failed")
  }
}
