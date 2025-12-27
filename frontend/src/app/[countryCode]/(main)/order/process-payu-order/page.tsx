import { placeOrder, retrieveCart } from "@lib/data/cart"
import { redirect } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

type Props = {
  searchParams: Promise<{ cartId?: string }>
}

// Extended cart type with completion status and order
type CartWithCompletion = HttpTypes.StoreCart & {
  completed_at?: string | null
  order?: { id: string }
}

/**
 * Process PayU Order
 *
 * This page is called after PayU callback with cart ID.
 * It waits for the webhook to update the payment session, then creates the order.
 *
 * If the order was already created by the webhook, it will redirect to the order confirmation.
 */
export default async function ProcessPayUOrderPage(props: Props) {
  const params = await props.searchParams
  const cartId = params.cartId

  // Validate cart ID
  if (!cartId) {
    redirect("/checkout?error=missing_cart_id")
  }

  try {
    // Retrieve the cart to check its status
    const cart = await retrieveCart(
      cartId,
      "id,completed_at,order,*payment_collection,*payment_collection.payment_sessions"
    ) as CartWithCompletion | null

    if (!cart) {
      console.error("[PayU] Cart not found:", cartId)
      redirect("/checkout?error=cart_not_found")
    }

    // If cart is already completed (order created by webhook), get order ID and redirect
    if (cart.completed_at && cart.order) {
      console.log("[PayU] Order already created by webhook:", cart.order.id)
      redirect(`/order/${cart.order.id}/confirmed`)
    }

    // Wait briefly for webhook to be processed (max 5 seconds)
    // The webhook updates the payment session with PayU's response
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const cartData = (await retrieveCart(
        cartId,
        "*payment_collection,*payment_collection.payment_sessions"
      )) as unknown as {
        payment_collection?: {
          payment_sessions?: Array<{ data?: { status?: string; payuStatus?: string } }>
        }
      }

      const paymentSession = cartData?.payment_collection?.payment_sessions?.[0]
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

    // Check again if cart was completed while waiting
    const updatedCart = await retrieveCart(cartId, "id,completed_at,order") as CartWithCompletion | null
    if (updatedCart?.completed_at && updatedCart?.order) {
      console.log("[PayU] Order created during wait:", updatedCart.order.id)
      redirect(`/order/${updatedCart.order.id}/confirmed`)
    }

    // placeOrder will create the order and redirect to /order/[id]/confirmed
    await placeOrder(cartId)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order creation failed"
    console.error("[PayU] Order creation failed:", message)

    // Check if the error is because order was already created
    if (message.includes("already been placed") || message.includes("completed")) {
      // Try to retrieve the cart again to get the order ID
      try {
        const cart = await retrieveCart(cartId, "id,completed_at,order") as CartWithCompletion | null
        if (cart?.order) {
          console.log("[PayU] Order exists, redirecting to confirmation:", cart.order.id)
          redirect(`/order/${cart.order.id}/confirmed`)
        }
      } catch (cartError) {
        console.error("[PayU] Could not retrieve cart:", cartError)
      }
    }

    redirect("/checkout?error=order_creation_failed")
  }
}
