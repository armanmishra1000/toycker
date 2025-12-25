import { NextRequest, NextResponse } from "next/server"

/**
 * PayU Payment Callback Handler
 *
 * PayU POSTs to this endpoint after payment completion with:
 * - udf1: Cart ID (passed during payment initiation)
 * - status: Payment status (success/failed/pending)
 * - Other PayU response parameters
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const cartId = formData.get("udf1") as string
    const status = formData.get("status") as string

    // Validate cart ID
    if (!cartId) {
      return NextResponse.redirect(
        new URL("/checkout?error=payu_no_cart_id", request.url)
      )
    }

    // Check payment status
    if (status !== "success") {
      return NextResponse.redirect(
        new URL("/checkout?error=payu_payment_failed", request.url)
      )
    }

    // Redirect to order processing page with cart ID
    return NextResponse.redirect(
      new URL(`/order/process-payu-order?cartId=${cartId}`, request.url)
    )
  } catch (error) {
    return NextResponse.redirect(
      new URL("/checkout?error=payu_callback_error", request.url)
    )
  }
}
