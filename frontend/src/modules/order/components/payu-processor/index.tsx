"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { retrieveCart, placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

// Extended cart type with completion status
type CartWithCompletion = HttpTypes.StoreCart & {
  completed_at?: string | null
}

type Props = {
  cartId: string
}

type ProcessingState = "checking" | "waiting" | "creating" | "redirecting"

export default function PayUProcessor({ cartId }: Props) {
  const router = useRouter()
  const [state, setState] = useState<ProcessingState>("checking")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    processOrder()
  }, [cartId])

  async function processOrder() {
    try {
      setState("checking")

      // Retrieve the cart to check its status
      const cart = (await retrieveCart(
        cartId,
        "id,completed_at,*payment_collection,*payment_collection.payment_sessions"
      )) as CartWithCompletion | null

      if (!cart) {
        console.error("[PayU] Cart not found:", cartId)
        router.push("/checkout?error=cart_not_found")
        return
      }

      // If cart is already completed, directly call placeOrder
      // placeOrder will handle completing the cart or redirecting appropriately
      if (cart.completed_at) {
        console.log("[PayU] Cart already completed, calling placeOrder")
        setState("creating")
        await placeOrder(cartId)
        return
      }

      // Wait briefly for webhook to be processed (max 5 seconds)
      setState("waiting")
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
      const updatedCart = (await retrieveCart(cartId, "id,completed_at")) as CartWithCompletion | null
      if (updatedCart?.completed_at) {
        console.log("[PayU] Order created during wait, calling placeOrder")
        setState("creating")
        await placeOrder(cartId)
        return
      }

      // Create the order
      setState("creating")
      await placeOrder(cartId)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Order creation failed"
      console.error("[PayU] Order creation failed:", message)

      // Check if the error is because order was already created
      // In this case, the user might need to check their email or go to orders page
      if (message.includes("already been placed") || message.includes("completed")) {
        setError("Your order has already been placed. Please check your email for confirmation.")
        setTimeout(() => {
          router.push("/")
        }, 5000)
        return
      }

      setError("Failed to create your order. Please contact support.")
      setTimeout(() => {
        router.push("/checkout?error=order_creation_failed")
      }, 3000)
    }
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={48}
              height={48}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Payment Processing Error</h2>
          <p className="text-gray-500">{error}</p>
          <p className="text-sm text-gray-400 mt-2">Redirecting to checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center px-4">
      <div className="text-center">
        {/* Spinner Animation */}
        <div className="mb-6 flex justify-center">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-solid border-gray-200"></div>
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-t-transparent"></div>
          </div>
        </div>

        {/* Messages based on state */}
        {state === "checking" && (
          <>
            <h2 className="text-2xl font-semibold mb-3">Checking Payment Status...</h2>
            <p className="text-gray-500">Please wait while we verify your payment</p>
          </>
        )}

        {state === "waiting" && (
          <>
            <h2 className="text-2xl font-semibold mb-3">Processing Your Payment</h2>
            <p className="text-gray-500">We are confirming your payment with PayU</p>
            <p className="text-sm text-gray-400 mt-2">This usually takes a few seconds...</p>
          </>
        )}

        {state === "creating" && (
          <>
            <h2 className="text-2xl font-semibold mb-3">Creating Your Order</h2>
            <p className="text-gray-500">Almost done! We are setting up your order</p>
          </>
        )}

        {state === "redirecting" && (
          <>
            <h2 className="text-2xl font-semibold mb-3">Payment Successful!</h2>
            <p className="text-gray-500">Redirecting you to your order confirmation...</p>
          </>
        )}

        {/* Progress Steps */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
            ["checking", "waiting", "creating", "redirecting"].includes(state) ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div className="h-0.5 w-12 bg-gray-200"></div>
          <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
            ["waiting", "creating", "redirecting"].includes(state) ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
          }`}>
            {["waiting", "creating", "redirecting"].includes(state) ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="text-xs">2</span>
            )}
          </span>
          <div className="h-0.5 w-12 bg-gray-200"></div>
          <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
            ["creating", "redirecting"].includes(state) ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
          }`}>
            {["creating", "redirecting"].includes(state) ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="text-xs">3</span>
            )}
          </span>
        </div>

        {/* Info Text */}
        <div className="mt-8 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
          <p className="font-medium">Do not close this window</p>
          <p className="mt-1">We are processing your payment and will redirect you automatically.</p>
        </div>
      </div>
    </div>
  )
}
