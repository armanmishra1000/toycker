"use client"

import { addToCart, deleteLineItem } from "@lib/data/cart"
import { DEFAULT_COUNTRY_CODE } from "@lib/constants/region"
import { HttpTypes } from "@medusajs/types"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useLayoutData } from "@modules/layout/context/layout-data-context"

type OptimisticAddInput = {
  product: HttpTypes.StoreProduct
  variant: HttpTypes.StoreProductVariant
  quantity: number
  countryCode?: string
  metadata?: Record<string, string | number | boolean | null>
}

type CartStoreContextValue = {
  cart: HttpTypes.StoreCart | null
  setFromServer: (cart: HttpTypes.StoreCart | null) => void
  optimisticAdd: (input: OptimisticAddInput) => Promise<void>
  optimisticRemove: (lineId: string) => Promise<void>
  reloadFromServer: () => Promise<void>
  isSyncing: boolean
  lastError: string | null
}

const CartStoreContext = createContext<CartStoreContextValue | undefined>(undefined)

const mergeLineItems = (
  current: HttpTypes.StoreCart,
  nextItems: HttpTypes.StoreCartLineItem[],
): HttpTypes.StoreCart => {
  const itemSubtotal = nextItems.reduce((sum, item) => sum + (item.total ?? 0), 0)
  return {
    ...current,
    items: nextItems,
    item_subtotal: itemSubtotal,
    subtotal: itemSubtotal,
    total: itemSubtotal + (current.shipping_subtotal ?? 0) + (current.tax_total ?? 0),
  }
}

const buildOptimisticLineItem = (
  product: HttpTypes.StoreProduct,
  variant: HttpTypes.StoreProductVariant,
  quantity: number,
  currencyCode: string,
  metadata?: Record<string, string | number | boolean | null>,
): HttpTypes.StoreCartLineItem => {
  const tempId = `temp-${variant.id}-${Date.now()}`
  const price = variant.calculated_price?.calculated_amount ?? variant.prices?.[0]?.amount ?? 0
  const original = variant.calculated_price?.original_amount ?? price
  const total = price * quantity
  const originalTotal = original * quantity

  return {
    id: tempId,
    title: variant.title ?? product.title,
    description: product.title,
    thumbnail: product.thumbnail ?? variant.product?.thumbnail ?? product.images?.[0]?.url ?? null,
    quantity,
    variant_id: variant.id,
    product_id: product.id,
    cart_id: "temp",
    metadata: metadata ?? {},
    variant: {
      ...variant,
      product,
    },
    product_title: product.title,
    product_handle: product.handle ?? undefined,
    unit_price: price,
    total,
    original_total: originalTotal,
    subtotal: total,
    discount_total: 0,
    tax_total: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    returned_quantity: 0,
    fulfilled_quantity: 0,
    shipped_quantity: 0,
    refundable: 0,
    claim_order_id: null,
    is_return: false,
    swap_id: null,
    tax_lines: [],
    adjustments: [],
    variant_sku: variant.sku ?? undefined,
    variant_barcode: variant.barcode ?? undefined,
    variant_title: variant.title ?? undefined,
    unit_price_incl_tax: price,
    includes_tax: false,
    allow_discounts: true,
    original_unit_price: original,
    original_total_incl_tax: originalTotal,
    original_tax_total: 0,
    unit_price_incl_discounts: price,
    total_incl_tax: total,
    tax_rate: 0,
    is_giftcard: false,
    should_merge: true,
    should_split: false,
    refundable_total: originalTotal,
    refundable_incl_tax_total: originalTotal,
    currency_code: currencyCode,
  }
}

export const CartStoreProvider = ({ children }: { children: ReactNode }) => {
  const { cart: layoutCart } = useLayoutData()
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(layoutCart ?? null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const previousCartRef = useRef<HttpTypes.StoreCart | null>(layoutCart ?? null)


  // Sync in-memory cart when layout cart updates
  useEffect(() => {
    if (!layoutCart) return
    const hasChanged = layoutCart.updated_at !== previousCartRef.current?.updated_at
    if (hasChanged) {
      previousCartRef.current = layoutCart
      setCart(layoutCart)
    }
  }, [layoutCart])

  const setFromServer = useCallback((nextCart: HttpTypes.StoreCart | null) => {
    setCart(nextCart)
    previousCartRef.current = nextCart
  }, [])

  const optimisticRemove = useCallback(
    async (lineId: string) => {
      if (!cart) return
      setLastError(null)
      const previous = cart
      const nextItems = (cart.items ?? []).filter((item) => item.id !== lineId)
      setCart(mergeLineItems(cart, nextItems))

      try {
        await deleteLineItem(lineId)
        const refreshed = await fetch("/api/cart", { cache: "no-store" })
        if (refreshed.ok) {
          const payload = (await refreshed.json()) as { cart: HttpTypes.StoreCart | null }
          if (payload.cart) {
            setFromServer(payload.cart)
          }
        }
      } catch (error) {
        setLastError((error as Error)?.message ?? "Failed to remove item")
        setCart(previous)
      }
    },
    [cart, setFromServer],
  )

  const optimisticAdd = useCallback(
    async ({ product, variant, quantity, countryCode, metadata }: OptimisticAddInput) => {
      const targetCountry = countryCode ?? DEFAULT_COUNTRY_CODE
      setLastError(null)

      const previousCart = cart

      const baseCart: HttpTypes.StoreCart = cart ?? {
        id: "temp-cart",
        items: [],
        region_id: null,
        currency_code:
          variant.calculated_price?.currency_code ?? layoutCart?.currency_code ?? "USD",
        subtotal: 0,
        total: 0,
        item_subtotal: 0,
        discount_total: 0,
        tax_total: 0,
        shipping_subtotal: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const existing = baseCart.items?.find((item) => item.variant_id === variant.id)
      let nextItems: HttpTypes.StoreCartLineItem[]

      if (existing) {
        const updatedItem: HttpTypes.StoreCartLineItem = {
          ...existing,
          quantity: existing.quantity + quantity,
          total: (existing.total ?? 0) + (existing.unit_price ?? 0) * quantity,
          original_total:
            (existing.original_total ?? existing.total ?? 0) + (existing.original_unit_price ?? existing.unit_price ?? 0) * quantity,
          updated_at: new Date().toISOString(),
        }
        nextItems = baseCart.items!.map((item) => (item.id === existing.id ? updatedItem : item))
      } else {
        const optimistic = buildOptimisticLineItem(
          product,
          variant,
          quantity,
          baseCart.currency_code,
          metadata,
        )
        nextItems = [...(baseCart.items ?? []), optimistic]
      }

      const optimisticCart = mergeLineItems(baseCart, nextItems)
      setCart(optimisticCart)

      try {
        const idempotencyKey =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `cart-${Date.now()}-${Math.random()}`

        const serverCart = await addToCart({
          variantId: variant.id,
          quantity,
          countryCode: targetCountry,
          metadata,
          idempotencyKey,
        })

        if (serverCart) {
          setFromServer(serverCart)
          return
        }

        const refreshed = await fetch("/api/cart", { cache: "no-store" })
        if (refreshed.ok) {
          const payload = (await refreshed.json()) as { cart: HttpTypes.StoreCart | null }
          setFromServer(payload.cart)
        }
      } catch (error) {
        setLastError((error as Error)?.message ?? "Failed to add to cart")
        setCart(previousCart)
        throw error
      }
    },
    [cart, layoutCart?.currency_code, setFromServer],
  )

  const reloadFromServer = useCallback(async () => {
    setIsSyncing(true)
    setLastError(null)
    try {
      const response = await fetch("/api/cart", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Failed to reload cart")
      }
      const payload = (await response.json()) as { cart: HttpTypes.StoreCart | null }
      setFromServer(payload.cart)
    } catch (error) {
      setLastError((error as Error)?.message ?? "Failed to reload cart")
    } finally {
      setIsSyncing(false)
    }
  }, [setFromServer])

  const value = useMemo(
    () => ({ cart, setFromServer, optimisticAdd, optimisticRemove, reloadFromServer, isSyncing, lastError }),
    [cart, isSyncing, lastError, optimisticAdd, optimisticRemove, reloadFromServer, setFromServer],
  )

  return <CartStoreContext.Provider value={value}>{children}</CartStoreContext.Provider>
}

export const useCartStore = () => {
  const context = useContext(CartStoreContext)
  if (!context) {
    throw new Error("useCartStore must be used within a CartStoreProvider")
  }
  return context
}

export const useOptionalCartStore = () => useContext(CartStoreContext)
