"use client"

import { Heading, Text, Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { useState } from "react"
import { initiatePaymentSession, placeOrder } from "@lib/data/cart"
import ErrorMessage from "@modules/checkout/components/error-message"
import { CheckCircleSolid } from "@medusajs/icons"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirmOrder = async () => {
    setSubmitting(true)
    setError(null)

    try {
      // 1. Initialize manual payment session (COD)
      await initiatePaymentSession(cart, {
        provider_id: "pp_system_default",
      })

      // 2. Place the order
      await placeOrder()
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const isReady = !!cart.shipping_address && !!cart.shipping_methods?.length

  return (
    <div className="sticky top-0 flex flex-col-reverse small:flex-col gap-y-8 py-8 small:py-0 ">
      <div className="w-full bg-white flex flex-col">
        <Divider className="my-6 small:hidden" />
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular items-baseline"
        >
          In your Cart
        </Heading>
        <Divider className="my-6" />
        <CartTotals totals={cart} />
        
        <div className="my-6 p-4 border rounded-rounded bg-ui-bg-subtle">
          <Heading level="h3" className="text-base-semi mb-2">
            Payment Method
          </Heading>
          <div className="flex items-center gap-x-3 py-2 px-3 border border-ui-border-interactive rounded-rounded bg-white">
            <CheckCircleSolid className="text-ui-fg-interactive" />
            <Text className="txt-medium text-ui-fg-base">Cash on Delivery (COD)</Text>
          </div>
          <Text className="txt-small text-ui-fg-subtle mt-2">
            Pay with cash when your order is delivered to your doorstep.
          </Text>
        </div>

        <Button
          size="large"
          className="w-full"
          onClick={handleConfirmOrder}
          isLoading={submitting}
          disabled={!isReady || submitting}
        >
          Confirm Order
        </Button>
        
        <ErrorMessage error={error} className="mt-2" />

        <Divider className="my-6" />
        <ItemsPreviewTemplate cart={cart} />
        <div className="my-6">
          <DiscountCode cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary
