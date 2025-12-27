import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * PayU Payment Callback Handler
 *
 * PayU POSTs to this endpoint after payment completion with:
 * - udf1: Payment session ID (passed during payment initiation)
 * - udf2: Cart ID (passed during payment initiation)
 * - status: Payment status (success/failed/pending)
 * - txnid: PayU transaction ID
 * - hash: Response signature for verification
 * - Other PayU response parameters
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    // udf2 contains the cart ID (udf1 is payment session ID)
    const cartId = formData.get("udf2") as string
    const status = formData.get("status") as string
    const txnid = formData.get("txnid") as string
    const hash = formData.get("hash") as string

    // Validate required parameters
    if (!cartId) {
      return NextResponse.redirect(
        new URL("/checkout?error=payu_no_cart_id", request.url)
      )
    }

    // Store payment response data in HTTP-only cookie for verification
    const cookieStore = await cookies()
    cookieStore.set("payu_payment_data", JSON.stringify({
      cartId,
      status,
      txnid,
      hash,
      timestamp: Date.now(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
    })

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
