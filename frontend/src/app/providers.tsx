"use client"

import { ReactNode } from "react"

import { CartSidebarProvider } from "@modules/layout/context/cart-sidebar-context"

const Providers = ({ children }: { children: ReactNode }) => {
  return <CartSidebarProvider>{children}</CartSidebarProvider>
}

export default Providers
