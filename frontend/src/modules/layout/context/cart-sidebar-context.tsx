"use client"

import { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react"

import { useCartStore } from "@modules/cart/context/cart-store-context"

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
  const { cart, setFromServer, optimisticRemove, reloadFromServer } = useCartStore()

  const refreshCart = useCallback(async () => {
    try {
      await reloadFromServer()
    } catch (error) {
      console.error("Failed to refresh cart", error)
    }
  }, [reloadFromServer])

  const openCart = useCallback(() => {
    refreshCart()
    setIsOpen(true)
  }, [refreshCart])

  const closeCart = useCallback(() => {
    setIsOpen(false)
  }, [])

  const removeLineItem = useCallback(
    async (lineItemId: string) => {
      try {
        await optimisticRemove(lineItemId)
        router.refresh()
      } catch (error) {
        console.error("Failed to remove line item", error)
        throw error
      }
    },
    [optimisticRemove, router],
  )

  const value = useMemo(
    () => ({
      isOpen,
      openCart,
      closeCart,
      cart,
      setCart: setFromServer,
      refreshCart,
      removeLineItem,
    }),
    [cart, closeCart, isOpen, openCart, refreshCart, removeLineItem, setFromServer],
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

export const useOptionalCartSidebar = () => {
  return useContext(CartSidebarContext)
}
