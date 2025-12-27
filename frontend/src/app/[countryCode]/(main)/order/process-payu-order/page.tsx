import { redirect } from "next/navigation"
import PayUProcessor from "@modules/order/components/payu-processor"

type Props = {
  searchParams: Promise<{ cartId?: string }>
}

/**
 * Process PayU Order
 *
 * This page is called after PayU callback with cart ID.
 * It displays a loading UI while processing the payment and creating the order.
 *
 * The page shows:
 * 1. Checking payment status
 * 2. Waiting for webhook confirmation
 * 3. Creating the order
 * 4. Redirecting to confirmation page
 */
export default async function ProcessPayUOrderPage(props: Props) {
  const params = await props.searchParams
  const cartId = params.cartId

  // Validate cart ID
  if (!cartId) {
    redirect("/checkout?error=missing_cart_id")
  }

  return <PayUProcessor cartId={cartId} />
}
