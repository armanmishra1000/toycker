"use client"

import { deleteLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react"

import { useLayoutData } from "./layout-data-context"

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
  const router = useRouter()
  const { cart, setCart, refresh } = useLayoutData()

  const openCart = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeCart = useCallback(() => {
    setIsOpen(false)
  }, [])

  const refreshCart = useCallback(async () => {
    try {
      await refresh()
    } catch (error) {
      console.error("Failed to refresh cart", error)
    }
  }, [refresh])

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
    [cart, closeCart, isOpen, openCart, refreshCart, removeLineItem, setCart],
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
