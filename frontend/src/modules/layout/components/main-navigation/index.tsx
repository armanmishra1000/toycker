"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShopByAgeDropdown from "@modules/layout/components/shop-by-age-dropdown"

interface NavLink {
  id: string
  label: string
  href: string
  hasDropdown?: boolean
}

const navLinks: NavLink[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "shop-by-age", label: "Shop by Age", href: "/shop-by-age", hasDropdown: true },
  { id: "about", label: "About Us", href: "/about" },
  { id: "contact", label: "Contact", href: "/contact" },
  { id: "metal-cars", label: "Metal Cars", href: "/metal-cars" },
]

const MainNavigation = () => {
  const pathname = usePathname()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true
    if (href !== "/" && pathname.startsWith(href)) return true
    return false
  }

  return (
    <nav className="flex items-center gap-8" aria-label="Main navigation">
      {navLinks.map((link) => {
        const active = isActive(link.href)
        
        if (link.hasDropdown) {
          return (
            <div key={link.id} className="relative group">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                  active ? "text-primary" : "text-black"
                }`}
              >
                {link.label}
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <ShopByAgeDropdown
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
              />
            </div>
          )
        }

        return (
          <LocalizedClientLink
            key={link.id}
            href={link.href}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              active ? "text-primary" : "text-black"
            }`}
          >
            {link.label}
          </LocalizedClientLink>
        )
      })}
    </nav>
  )
}

export default MainNavigation
