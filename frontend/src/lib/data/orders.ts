"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders } from "./cookies"
import { HttpTypes } from "@medusajs/types"

export const retrieveOrder = async (id: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${id}`, {
      method: "GET",
      query: {
        fields:
          "*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product",
      },
      headers,
      cache: "no-store",
    })
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
}

/**
 * Find an order by cart ID.
 * This is useful when a webhook has already completed a cart and created an order,
 * but we need to find that order from the frontend.
 *
 * @param cartId - The cart ID to search for
 * @returns The order if found, or null if not found
 */
export const findOrderByCartId = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  // Try to find order by filtering with cart_id
  // In Medusa v2, orders have a cart_id field that references the original cart
  try {
    const response = await sdk.client
      .fetch<HttpTypes.StoreOrderListResponse>(`/store/orders`, {
        method: "GET",
        query: {
          limit: 1,
          offset: 0,
          order: "-created_at",
          fields: "id",
          cart_id: cartId,
        },
        headers,
        cache: "no-store",
      })

    if (response.orders && response.orders.length > 0) {
      return response.orders[0]
    }
  } catch (err) {
    console.error("[findOrderByCartId] Error:", err)
  }

  return null
}

export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, string | number | boolean | undefined>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!headers.authorization) {
    return Promise.resolve(null)
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderListResponse>(`/store/orders`, {
      method: "GET",
      query: {
        limit,
        offset,
        order: "-created_at",
        fields: "*items,+items.metadata,*items.variant,*items.product",
        ...filters,
      },
      headers,
      cache: "no-store",
    })
    .then(({ orders }) => orders)
    .catch((err) => medusaError(err))
}

export const createTransferRequest = async (
  state: {
    success: boolean
    error: string | null
    order: HttpTypes.StoreOrder | null
  },
  formData: FormData
): Promise<{
  success: boolean
  error: string | null
  order: HttpTypes.StoreOrder | null
}> => {
  const id = formData.get("order_id") as string

  if (!id) {
    return { success: false, error: "Order ID is required", order: null }
  }

  const headers = await getAuthHeaders()

  return await sdk.store.order
    .requestTransfer(
      id,
      {},
      {
        fields: "id, email",
      },
      headers
    )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const acceptTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .acceptTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const declineTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .declineTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}
