import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { IOrderModuleService } from "@medusajs/types"

import RewardService from "../modules/rewards/service"
import { REWARDS_MODULE } from "../modules/rewards"

type OrderPlacedEvent = {
  id?: string
}

export default async function rewardPointsSubscriber({
  event,
  container,
}: SubscriberArgs<OrderPlacedEvent>) {
  const orderId = event.data?.id
  if (!orderId) {
    return
  }

  const orderService = container.resolve<IOrderModuleService>(Modules.ORDER)
  const rewardService = container.resolve<RewardService>(REWARDS_MODULE)

  const order = await orderService.retrieveOrder(orderId, {
    select: ["id", "customer_id", "cart_id", "item_subtotal", "subtotal", "total"],
  })

  if (!order.customer_id) {
    return
  }

  const baseAmount =
    typeof order.item_subtotal === "number"
      ? order.item_subtotal
      : typeof order.subtotal === "number"
        ? order.subtotal
        : typeof order.total === "number"
          ? order.total
          : 0

  if (baseAmount > 0) {
    await rewardService.recordEarn({
      customerId: order.customer_id,
      orderId: order.id,
      baseAmount,
    })
  }

  const cartIdRaw = (order as unknown as { cart_id?: unknown }).cart_id
  const cartIdFromMeta = (order as unknown as { metadata?: Record<string, unknown> | null })?.metadata?.cart_id
  const cartId = [cartIdRaw, cartIdFromMeta].find(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  )

  if (cartId) {
    await rewardService.confirmRedemption({
      cartId,
      orderId: order.id,
    })
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
  context: {
    subscriberId: "reward-points-subscriber",
  },
}
