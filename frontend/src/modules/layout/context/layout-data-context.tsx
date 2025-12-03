"use client"

import { HttpTypes, StoreCartShippingOption, StoreCustomer } from "@medusajs/types"
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

type LayoutDataContextValue = {
  cart: HttpTypes.StoreCart | null
  setCart: (cart: HttpTypes.StoreCart | null) => void
  customer: StoreCustomer | null
  setCustomer: (customer: StoreCustomer | null) => void
  shippingOptions: StoreCartShippingOption[]
  loading: boolean
  refresh: () => Promise<void>
}

const LayoutDataContext = createContext<LayoutDataContextValue | undefined>(undefined)

const fetchLayoutState = async (signal?: AbortSignal) => {
  const response = await fetch("/api/storefront/layout-state", {
    cache: "no-store",
    signal,
  })

  if (!response.ok) {
    throw new Error("Failed to load layout state")
  }

  return (await response.json()) as {
    cart: HttpTypes.StoreCart | null
    customer: StoreCustomer | null
    shippingOptions: StoreCartShippingOption[]
  }
}

export const LayoutDataProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const [customer, setCustomer] = useState<StoreCustomer | null>(null)
  const [shippingOptions, setShippingOptions] = useState<StoreCartShippingOption[]>([])
  const [loading, setLoading] = useState(true)
  const abortController = useRef<AbortController | null>(null)

  const refresh = useCallback(async () => {
    abortController.current?.abort()

    const controller = new AbortController()
    abortController.current = controller
    setLoading(true)

    try {
      const payload = await fetchLayoutState(controller.signal)
      setCart(payload.cart)
      setCustomer(payload.customer)
      setShippingOptions(payload.shippingOptions)
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        return
      }
      console.error("Failed to refresh layout data", error)
    } finally {
      if (abortController.current === controller) {
        setLoading(false)
        abortController.current = null
      }
    }
  }, [])

  useEffect(() => {
    refresh()

    return () => {
      abortController.current?.abort()
    }
  }, [refresh])

  const value = useMemo(
    () => ({
      cart,
      setCart,
      customer,
      setCustomer,
      shippingOptions,
      loading,
      refresh,
    }),
    [cart, customer, shippingOptions, loading, refresh],
  )

  return <LayoutDataContext.Provider value={value}>{children}</LayoutDataContext.Provider>
}

export const useLayoutData = () => {
  const context = useContext(LayoutDataContext)

  if (!context) {
    throw new Error("useLayoutData must be used within a LayoutDataProvider")
  }

  return context
}
