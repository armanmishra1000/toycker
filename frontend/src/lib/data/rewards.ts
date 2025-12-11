"use server"

import { revalidateTag } from "next/cache"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"

import { getAuthHeaders, getCacheTag, getCartId } from "./cookies"

export type RewardBalance = {
  balance: {
    balance: number
    pending_other_carts: number
    pending_for_cart: number
    available: number
    earn_rate_bps: number
  }
}

export type RewardHistoryEntry = {
  id: string
  type: string
  is_confirmed: boolean
  points: number
  order_id?: string | null
  cart_id?: string | null
  created_at?: string | Date
}

export const getRewardBalance = async (): Promise<RewardBalance | null> => {
  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    return null
  }

  return sdk.client
    .fetch<RewardBalance>("/store/rewards/balance", {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .catch(() => null)
}

export const getRewardHistory = async (): Promise<RewardHistoryEntry[]> => {
  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    return []
  }

  return sdk.client
    .fetch<{ history: RewardHistoryEntry[] }>("/store/rewards/history", {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .then(({ history }) => history ?? [])
    .catch(() => [])
}

export const applyRewardPoints = async (
  points: number,
): Promise<{ cart: HttpTypes.StoreCart; reward: { applied_points: number } }> => {
  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("No active cart found")
  }

  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    throw new Error("You need to sign in before applying rewards")
  }

  return sdk.client
    .fetch<{ cart: HttpTypes.StoreCart; reward: { applied_points: number } }>(
      `/store/carts/${cartId}/rewards/apply`,
      {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ points }),
      },
    )
    .then(async (data) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return data
    })
    .catch(medusaError)
}
