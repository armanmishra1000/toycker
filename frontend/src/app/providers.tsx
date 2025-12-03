"use client"

import { ReactNode } from "react"

import { CartSidebarProvider } from "@modules/layout/context/cart-sidebar-context"
import { LayoutDataProvider } from "@modules/layout/context/layout-data-context"

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <LayoutDataProvider>
      <CartSidebarProvider>{children}</CartSidebarProvider>
    </LayoutDataProvider>
  )
}

export default Providers
