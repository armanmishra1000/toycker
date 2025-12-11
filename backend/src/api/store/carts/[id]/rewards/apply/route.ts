import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"
import { z } from "zod"
import type { ICartModuleService, CartLineItemDTO } from "@medusajs/types"

import RewardService from "../../../../../../modules/rewards/service"
import { REWARDS_MODULE } from "../../../../../../modules/rewards"

type AuthContext = {
  actor_id?: string
  actor_type?: string
}

const bodySchema = z.object({
  points: z.number().int().nonnegative(),
})

const resolveCustomerId = (req: MedusaRequest) => {
  const auth = (req as MedusaRequest & { auth?: AuthContext }).auth
  if (auth?.actor_type === "customer" && auth.actor_id) {
    return auth.actor_id
  }
  return null
}

const isRewardLine = (metadata: unknown): metadata is Record<string, unknown> => {
  if (!metadata || typeof metadata !== "object") {
    return false
  }
  const data = metadata as Record<string, unknown>
  return data.reward_redemption === true
}

const normalizeBaseAmount = (cart: {
  item_subtotal?: unknown
  item_total?: unknown
  subtotal?: unknown
  total?: unknown
}) => {
  const candidates = [cart.item_subtotal, cart.item_total, cart.subtotal, cart.total]
  for (const candidate of candidates) {
    const value = Number(candidate)
    if (Number.isFinite(value) && value > 0) {
      return value
    }
  }
  return 0
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params?.id
  const customerId = resolveCustomerId(req)

  if (!customerId) {
    res.status(401).json({ message: "Login required" })
    return
  }

  if (!cartId) {
    res.status(400).json({ message: "Cart id is required" })
    return
  }

  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid payload" })
    return
  }

  const requestedPoints = parsed.data.points

  const cartService = req.scope.resolve<ICartModuleService>(Modules.CART)
  const rewardService = req.scope.resolve<RewardService>(REWARDS_MODULE)

  const cart = await cartService.retrieveCart(cartId, {
    relations: ["items"],
  })

  if (!cart.customer_id) {
    await cartService.updateCarts([
      {
        id: cartId,
        customer_id: customerId,
      },
    ])
    cart.customer_id = customerId
  }

  if (cart.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Cart does not belong to the current customer")
  }

  const rewardLines: CartLineItemDTO[] = (cart.items ?? []).filter((item) => isRewardLine(item.metadata))
  const rewardLineIds = rewardLines.map((item) => item.id).filter(Boolean) as string[]

  if (rewardLineIds.length) {
    await cartService.deleteLineItems(rewardLineIds)
  }

  await rewardService.clearPendingRedemption(cartId)

  if (requestedPoints <= 0) {
    const [updatedCart, balance] = await Promise.all([
      cartService.retrieveCart(cartId, { relations: ["items"] }),
      rewardService.getBalance(customerId, cartId),
    ])
    res.json({ cart: updatedCart, reward: { applied_points: 0, balance } })
    return
  }

  const balance = await rewardService.getBalance(customerId, cartId)

  if (balance.available <= 0) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "No reward balance available")
  }

  const baseAmount = normalizeBaseAmount(cart)
  if (baseAmount <= 0) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Cart total must be positive before applying rewards")
  }

  const cappedByBalance = Math.min(requestedPoints, balance.available)
  const cappedByCart = Math.min(cappedByBalance, baseAmount)
  const appliedPoints = Math.max(0, Math.floor(cappedByCart))

  if (appliedPoints <= 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Cannot apply zero reward points")
  }

  const tx = await rewardService.createPendingRedemption({
    customerId,
    cartId,
    points: appliedPoints,
    description: `Redeemed ${appliedPoints} points on cart ${cartId}`,
  })

  await cartService.addLineItems(cartId, [
    {
      title: "Reward redemption",
      cart_id: cartId,
      quantity: 1,
      unit_price: -appliedPoints,
      is_discountable: false,
      requires_shipping: false,
      is_custom_price: true,
      metadata: {
        reward_redemption: true,
        reward_points: appliedPoints,
        reward_transaction_id: tx.id,
      },
    },
  ])

  const [updatedCart, updatedBalance] = await Promise.all([
    cartService.retrieveCart(cartId, { relations: ["items"] }),
    rewardService.getBalance(customerId, cartId),
  ])

  res.json({
    cart: updatedCart,
    reward: {
      applied_points: appliedPoints,
      transaction_id: tx.id,
      balance: updatedBalance,
    },
  })
}
