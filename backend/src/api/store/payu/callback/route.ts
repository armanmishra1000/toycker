import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * PayU Callback Handler
 *
 * This route handles the redirect from PayU after payment completion.
 *
 * PayU redirects here with transaction details in query parameters:
 * - txnid: PayU transaction ID
 * - status: success/failure/pending
 * - hash: Response hash for verification
 * - udf1: Medusa payment session ID
 * - udf2: Cart ID
 *
 * This route redirects to the order processing page with the cart ID.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { txnid, status, udf1, udf2 } = req.query

  console.log("[PayU Callback] Received:", { txnid, status, udf1, udf2 })

  // If payment was not successful, redirect to checkout with error
  if (status === "failure" || status === "pending") {
    console.error("[PayU Callback] Payment failed:", status)
    return res.redirect("/checkout?error=payment_failed")
  }

  // Use cart_id from udf2, or redirect to error page
  if (!udf2) {
    console.error("[PayU Callback] Missing cart ID (udf2)")
    return res.redirect("/checkout?error=missing_cart_id")
  }

  // Redirect to the order processing page with the cart ID
  console.log("[PayU Callback] Redirecting to order processing with cart_id:", udf2)

  return res.redirect(`/order/process-payu-order?cartId=${udf2}`)
}
