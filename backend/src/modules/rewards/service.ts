import { MedusaService } from "@medusajs/framework/utils"

import RewardSetting from "./models/reward-setting"
import RewardTransaction, { type RewardTransactionType } from "./models/reward-transaction"

const DEFAULT_EARN_RATE_BPS = 500
const MAX_RATE_BPS = 10_000

type BalanceResult = {
  balance: number
  pending_other_carts: number
  pending_for_cart: number
  available: number
  earn_rate_bps: number
}

type Pagination = {
  limit?: number
  offset?: number
}

type EarnInput = {
  customerId: string
  orderId: string
  baseAmount: number
}

type RedemptionInput = {
  customerId: string
  cartId: string
  points: number
  description?: string | null
}

type ConfirmRedemptionInput = {
  cartId: string
  orderId: string
}

class RewardService extends MedusaService({
  RewardTransaction,
  RewardSetting,
}) {
  private normalizeRate(inputBps: number): number {
    if (!Number.isFinite(inputBps) || inputBps < 0) {
      return 0
    }
    if (inputBps > MAX_RATE_BPS) {
      return MAX_RATE_BPS
    }
    return Math.round(inputBps)
  }

  private calculatePoints(baseAmount: number, rateBps: number): number {
    if (!Number.isFinite(baseAmount) || baseAmount <= 0 || rateBps <= 0) {
      return 0
    }
    return Math.ceil((baseAmount * rateBps) / 10_000)
  }

  async getSettings() {
    const [existing] = await this.listRewardSettings({}, { take: 1 })
    if (existing) {
      return existing
    }

    return await this.createRewardSettings({
      earn_rate_bps: DEFAULT_EARN_RATE_BPS,
    })
  }

  async updateSettings(earnRateBps: number, updatedBy?: string) {
    const normalized = this.normalizeRate(earnRateBps)
    const [setting] = await this.listRewardSettings({}, { take: 1 })

    if (!setting) {
      return await this.createRewardSettings({
        earn_rate_bps: normalized,
        updated_by: updatedBy,
      })
    }

    return await this.updateRewardSettings({
      id: setting.id,
      earn_rate_bps: normalized,
      updated_by: updatedBy ?? setting.updated_by ?? null,
    })
  }

  async getBalance(customerId: string, cartId?: string): Promise<BalanceResult> {
    const settings = await this.getSettings()
    const transactions = await this.listRewardTransactions(
      {
        customer_id: customerId,
      },
      {
        select: ["points", "type", "is_confirmed", "cart_id"],
        take: 500,
      },
    )

    let confirmedEarn = 0
    let confirmedRedeem = 0
    let pendingOtherCarts = 0
    let pendingForCart = 0

    for (const tx of transactions) {
      if (tx.is_confirmed) {
        if (tx.type === "earn") {
          confirmedEarn += tx.points
        } else if (tx.type === "redeem") {
          confirmedRedeem += tx.points
        }
        continue
      }

      if (tx.type === "redeem") {
        if (cartId && tx.cart_id === cartId) {
          pendingForCart += tx.points
        } else {
          pendingOtherCarts += tx.points
        }
      }
    }

    const balance = Math.max(confirmedEarn - confirmedRedeem, 0)
    const available = Math.max(balance - pendingOtherCarts, 0)

    return {
      balance,
      pending_other_carts: pendingOtherCarts,
      pending_for_cart: pendingForCart,
      available,
      earn_rate_bps: settings.earn_rate_bps,
    }
  }

  async listHistory(customerId: string, config?: Pagination) {
    return await this.listRewardTransactions(
      {
        customer_id: customerId,
      },
      {
        order: {
          created_at: "DESC",
        },
        take: config?.limit ?? 50,
        skip: config?.offset ?? 0,
      },
    )
  }

  async recordEarn(input: EarnInput) {
    const settings = await this.getSettings()
    const existing = await this.listRewardTransactions({
      order_id: input.orderId,
      type: "earn",
    })

    if (existing.length) {
      return existing[0]
    }

    const rate = this.normalizeRate(settings.earn_rate_bps)
    const points = this.calculatePoints(input.baseAmount, rate)

    if (points <= 0) {
      return null
    }

    return await this.createRewardTransactions({
      customer_id: input.customerId,
      order_id: input.orderId,
      type: "earn",
      points,
      is_confirmed: true,
      description: `Earned ${points} points for order ${input.orderId}`,
    })
  }

  async clearPendingRedemption(cartId: string) {
    const pending = await this.listRewardTransactions({
      cart_id: cartId,
      type: "redeem",
      is_confirmed: false,
    })

    if (pending.length) {
      const ids = pending.map((tx) => tx.id)
      await this.deleteRewardTransactions(ids)
    }
  }

  async createPendingRedemption(input: RedemptionInput) {
    const points = Math.floor(Math.max(input.points, 0))
    if (points <= 0) {
      throw new Error("Points must be greater than zero")
    }

    await this.clearPendingRedemption(input.cartId)

    return await this.createRewardTransactions({
      customer_id: input.customerId,
      cart_id: input.cartId,
      points,
      type: "redeem",
      is_confirmed: false,
      description: input.description ?? null,
    })
  }

  async confirmRedemption(input: ConfirmRedemptionInput) {
    const pending = await this.listRewardTransactions({
      cart_id: input.cartId,
      type: "redeem",
      is_confirmed: false,
    })

    if (!pending.length) {
      return
    }

    const updates = pending.map((tx) => ({
      id: tx.id,
      is_confirmed: true,
      order_id: input.orderId,
      description: tx.description ?? `Redeemed ${tx.points} points`,
    }))

    await this.updateRewardTransactions(updates)
  }
}

export default RewardService
