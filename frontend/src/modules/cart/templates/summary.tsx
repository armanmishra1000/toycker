"use client"

import { Button, Heading, Text } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import type { RewardBalance } from "@lib/data/rewards"
import RewardRedeemer from "../components/reward-redeemer"
import { convertToLocale } from "@lib/util/money"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
  isLoggedIn: boolean
  rewardBalance: RewardBalance | null
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart, isLoggedIn, rewardBalance }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const rewardLines = (cart.items ?? []).filter((item) => item?.metadata?.reward_redemption)
  const appliedPoints = rewardLines.reduce((sum, item) => {
    const points = Number((item.metadata as Record<string, unknown>)?.reward_points ?? 0)
    return sum + (Number.isFinite(points) ? Math.abs(points) : 0)
  }, 0)
  const available = rewardBalance?.balance?.available ?? 0

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Summary
      </Heading>
      {isLoggedIn ? (
        <RewardRedeemer
          currencyCode={cart.currency_code}
          available={available}
          appliedPoints={appliedPoints}
        />
      ) : (
        <Text size="small" className="text-ui-fg-subtle">
          Sign in to use reward points at checkout.
        </Text>
      )}
      {appliedPoints > 0 && (
        <Text size="small" className="text-ui-fg-subtle">
          Rewards applied: {convertToLocale({ amount: appliedPoints, currency_code: cart.currency_code })}
        </Text>
      )}
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={{ ...cart, discount_subtotal: cart.discount_subtotal }} />
      <LocalizedClientLink href={"/checkout?step=" + step} data-testid="checkout-button">
        <Button className="w-full h-10" disabled={!isLoggedIn}>
          {isLoggedIn ? "Go to checkout" : "Sign in to checkout"}
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
