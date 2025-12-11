"use client"

import { ReactNode } from "react"

import { CartSidebarProvider } from "@modules/layout/context/cart-sidebar-context"
import { LayoutDataProvider } from "@modules/layout/context/layout-data-context"
import { CartStoreProvider } from "@modules/cart/context/cart-store-context"

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <LayoutDataProvider>
      <CartStoreProvider>
        <CartSidebarProvider>{children}</CartSidebarProvider>
      </CartStoreProvider>
    </LayoutDataProvider>
  )
}

export default Providers
