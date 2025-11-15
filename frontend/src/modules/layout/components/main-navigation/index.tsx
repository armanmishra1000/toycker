"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShopByAgeDropdown from "@modules/layout/components/shop-by-age-dropdown"
import { AgeCategory, NavLink } from "@modules/layout/config/navigation"
import { useOnClickOutside } from "@modules/layout/hooks/useOnClickOutside"

type MainNavigationProps = {
  navLinks: NavLink[]
  ageCategories: AgeCategory[]
}

const MainNavigation = ({ navLinks, ageCategories }: MainNavigationProps) => {
  const pathname = usePathname()
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const navRef = useRef<HTMLElement | null>(null)

  const cleanPathname = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/")

  useOnClickOutside(navRef, () => setActiveDropdownId(null))

  useEffect(() => {
    setActiveDropdownId(null)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === "/" && cleanPathname === "/") return true
    if (href !== "/" && cleanPathname.startsWith(href)) return true
    return false
  }

  const handleDropdownToggle = (id: string) => {
    setActiveDropdownId((current) => (current === id ? null : id))
  }

  const closeDropdown = () => setActiveDropdownId(null)

  return (
    <nav ref={navRef} className="flex items-center gap-8" aria-label="Main navigation">
      {navLinks.map((link) => {
        const active = isActive(link.href)

        if (link.hasDropdown) {
          const isOpen = activeDropdownId === link.id
          return (
            <div key={link.id} className="relative group">
              <button
                onClick={() => handleDropdownToggle(link.id)}
                className={`flex items-center gap-1 font-medium transition-colors hover:text-primary ${
                  active ? "text-primary" : "text-black"
                }`}
                aria-expanded={isOpen}
                aria-haspopup="true"
              >
                {link.label}
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <ShopByAgeDropdown
                isOpen={isOpen}
                items={ageCategories}
                activePathname={cleanPathname}
                onItemClick={closeDropdown}
              />
            </div>
          )
        }

        return (
          <LocalizedClientLink
            key={link.id}
            href={link.href}
            className={`font-medium transition-colors hover:text-primary ${
              active ? "text-primary" : "text-black"
            }`}
            onClick={closeDropdown}
          >
            {link.label}
          </LocalizedClientLink>
        )
      })}
    </nav>
  )
}

export default MainNavigation
