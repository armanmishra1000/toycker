"use client"

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

type WishlistContextValue = {
  isInWishlist: (productId: string) => boolean
  toggleWishlist: (productId: string) => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

const STORAGE_KEY = "toycker_wishlist"

const readFromStorage = (): string[] => {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<string[]>([])

  useEffect(() => {
    setItems(readFromStorage())
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore storage errors for prototype scope
    }
  }, [items])

  const toggleWishlist = useCallback((productId: string) => {
    setItems((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      }
      return [...prev, productId]
    })
  }, [])

  const value = useMemo<WishlistContextValue>(
    () => ({
      isInWishlist: (productId: string) => items.includes(productId),
      toggleWishlist,
    }),
    [items, toggleWishlist]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider")
  }

  return context
}

export const useOptionalWishlist = () => useContext(WishlistContext)
