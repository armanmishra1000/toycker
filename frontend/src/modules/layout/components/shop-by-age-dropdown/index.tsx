"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface DropdownProps {
  isOpen: boolean
  onClose: () => void
}

const ageCategories = [
  { id: "0-12-months", label: "0-12 Months", href: "/shop-by-age/0-12-months" },
  { id: "1-2-years", label: "1-2 Years", href: "/shop-by-age/1-2-years" },
  { id: "2-3-years", label: "2-3 Years", href: "/shop-by-age/2-3-years" },
  { id: "3-5-years", label: "3-5 Years", href: "/shop-by-age/3-5-years" },
  { id: "5-8-years", label: "5-8 Years", href: "/shop-by-age/5-8-years" },
  { id: "8-12-years", label: "8-12 Years", href: "/shop-by-age/8-12-years" },
  { id: "12-plus", label: "12+ Years", href: "/shop-by-age/12-plus" },
]

const ShopByAgeDropdown = ({ isOpen, onClose }: DropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const isActive = (href: string) => {
    // Remove locale prefix if present (e.g., /en, /in)
    const cleanPathname = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/')
    return cleanPathname.startsWith(href)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-10 left-0 mt-0.5 bg-white shadow-lg rounded-lg overflow-hidden transform transition-all duration-300 ease-out origin-top z-40 ${
        isOpen
          ? "opacity-100 scale-y-100 visible"
          : "opacity-0 scale-y-95 invisible"
      }`}
      style={{
        transformOrigin: "top left",
      }}
    >
      <div className="w-60 py-2">
        {ageCategories.map((category) => (
          <LocalizedClientLink
            key={category.id}
            href={category.href}
            onClick={onClose}
            className={`block px-6 py-3 text-sm font-medium transition-colors ${
              isActive(category.href)
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-50 hover:text-primary"
            }`}
          >
            {category.label}
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}

export default ShopByAgeDropdown
