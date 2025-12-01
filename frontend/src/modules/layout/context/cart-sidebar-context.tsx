"use client"

import { deleteLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

type CartSidebarContextValue = {
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  cart: HttpTypes.StoreCart | null
  setCart: (cart: HttpTypes.StoreCart | null) => void
  refreshCart: () => Promise<void>
  removeLineItem: (lineItemId: string) => Promise<void>
}

const CartSidebarContext = createContext<CartSidebarContextValue | undefined>(
  undefined,
)

export const CartSidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const router = useRouter()

  const openCart = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeCart = useCallback(() => {
    setIsOpen(false)
  }, [])

  const refreshCart = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Failed to refresh cart")
      }
      const data = (await response.json()) as { cart: HttpTypes.StoreCart | null }
      setCart(data.cart)
    } catch (error) {
      console.error(error)
    }
  }, [])

  const removeLineItem = useCallback(
    async (lineItemId: string) => {
      try {
        await deleteLineItem(lineItemId)
        await refreshCart()
        router.refresh()
      } catch (error) {
        console.error("Failed to remove line item", error)
        throw error
      }
    },
    [refreshCart, router],
  )

  const value = useMemo(
    () => ({
      isOpen,
      openCart,
      closeCart,
      cart,
      setCart,
      refreshCart,
      removeLineItem,
    }),
    [cart, closeCart, isOpen, openCart, refreshCart, removeLineItem],
  )

  return (
    <CartSidebarContext.Provider value={value}>
      {children}
    </CartSidebarContext.Provider>
  )
}

export const useCartSidebar = () => {
  const context = useContext(CartSidebarContext)

  if (!context) {
    throw new Error("useCartSidebar must be used within a CartSidebarProvider")
  }

  return context
}
