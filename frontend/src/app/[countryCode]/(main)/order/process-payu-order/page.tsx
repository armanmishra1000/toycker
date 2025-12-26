import { placeOrder, retrieveCart } from "@lib/data/cart"
import { redirect } from "next/navigation"

type Props = {
  searchParams: Promise<{ cartId?: string }>
}

/**
 * Process PayU Order
 *
 * This page is called after PayU callback with cart ID.
 * It waits for the webhook to update the payment session, then creates the order.
 */
export default async function ProcessPayUOrderPage(props: Props) {
  const params = await props.searchParams
  const cartId = params.cartId

  // Validate cart ID
  if (!cartId) {
    redirect("/checkout?error=missing_cart_id")
  }

  try {
    // Wait briefly for webhook to be processed (max 5 seconds)
    // The webhook updates the payment session with PayU's response
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const cart = (await retrieveCart(
        cartId,
        "*payment_collection,*payment_collection.payment_sessions"
      )) as unknown as {
        payment_collection?: {
          payment_sessions?: Array<{ data?: { status?: string; payuStatus?: string } }>
        }
      }

      const paymentSession = cart?.payment_collection?.payment_sessions?.[0]
      const sessionData = paymentSession?.data

      // Check if payment session has been updated with webhook data
      if (sessionData?.status === "captured" || sessionData?.payuStatus === "success") {
        console.log("[PayU] Payment session updated by webhook:", { status: sessionData.status })
        break
      }

      // Wait 500ms before retrying
      await new Promise((resolve) => setTimeout(resolve, 500))
      attempts++
    }

    if (attempts >= maxAttempts) {
      console.warn("[PayU] Webhook not received after 5 seconds, proceeding with order placement")
    }

    // placeOrder will create the order and redirect to /order/[id]/confirmed
    await placeOrder(cartId)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order creation failed"
    console.error("[PayU] Order creation failed:", message)
    redirect("/checkout?error=order_creation_failed")
  }
}
