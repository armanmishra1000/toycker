"use client"

import { useEffect, useRef, useState } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useBodyScrollLock } from "@modules/layout/hooks/useBodyScrollLock"

interface Product {
  id: string
  name: string
  price: number
  comparePrice?: number
  image?: string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Classic Toy Car",
    price: 12.99,
    comparePrice: 15.99,
    image: "/images/toy-car.jpg",
  },
  {
    id: "2",
    name: "Wooden Building Blocks",
    price: 24.99,
    comparePrice: 29.99,
    image: "/images/blocks.jpg",
  },
  {
    id: "3",
    name: "Action Figure Set",
    price: 19.99,
    comparePrice: 24.99,
    image: "/images/figures.jpg",
  },
  {
    id: "4",
    name: "Puzzle Game",
    price: 14.99,
    comparePrice: 18.99,
    image: "/images/puzzle.jpg",
  },
]

const SearchModal = ({ isOpen, onClose, searchQuery = "", onSearchChange }: SearchModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([])

  // Lock body scroll when modal is open
  useBodyScrollLock({ isLocked: isOpen })

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const query = localSearchQuery || searchQuery
    if (query.trim()) {
      const filtered = mockProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      )
      setDisplayedProducts(filtered.length > 0 ? filtered : mockProducts)
    } else {
      setDisplayedProducts(mockProducts)
    }
  }, [localSearchQuery, searchQuery])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearchQuery(value)
    if (onSearchChange) {
      onSearchChange(value)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscapeKey)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`fixed left-0 top-0 h-screen w-full max-w-md bg-white z-50 transform transition-transform duration-300 ease-out will-change-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col overflow-hidden`}
        style={{ backfaceVisibility: "hidden" }}
      >
        {/* Search Input - No Header */}
        <div className="p-4">
          <div className="relative flex items-center">
            {/* Search Icon - Left */}
            <svg
              className="absolute left-0 w-4 h-4 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {/* Input with border-bottom only */}
            <input
              ref={searchInputRef}
              type="text"
              value={localSearchQuery}
              onChange={handleSearchChange}
              placeholder="Search products..."
              className="w-full py-3 pl-8 pr-10 bg-white border-0 border-b-2 border-primary rounded-none text-gray-900 placeholder-gray-500 outline-none transition-colors"
              aria-label="Search products"
            />

            {/* Close Button - Right (always visible) */}
            <button
              onClick={() => {
                setLocalSearchQuery("")
                if (onSearchChange) onSearchChange("")
                onClose()
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 transition-colors group"
              aria-label="Close search"
            >
              <XMarkIcon className="w-5 h-5 text-gray-900 group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto">
          {displayedProducts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {displayedProducts.map((product) => (
                <LocalizedClientLink
                  key={product.id}
                  href={`/products/${product.id}`}
                  onClick={onClose}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex gap-4">
                    {product.image && (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg font-semibold text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.comparePrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ${product.comparePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </LocalizedClientLink>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-600">No products found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <LocalizedClientLink
            href={`/store?q=${encodeURIComponent(searchQuery || "")}`}
            onClick={onClose}
            className="block w-full text-center py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all"
          >
            View All Products
          </LocalizedClientLink>
        </div>
      </div>
    </>
  )
}

export default SearchModal
