"use client"

import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface NavLink {
  id: string
  label: string
  href: string
}

const navLinks: NavLink[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "shop-by-age", label: "Shop by Age", href: "/shop-by-age" },
  { id: "about", label: "About Us", href: "/about" },
  { id: "contact", label: "Contact", href: "/contact" },
  { id: "metal-cars", label: "Metal Cars", href: "/metal-cars" },
]

const MainNavigation = () => {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true
    if (href !== "/" && pathname.startsWith(href)) return true
    return false
  }

  return (
    <nav className="flex items-center gap-8" aria-label="Main navigation">
      {navLinks.map((link) => {
        const active = isActive(link.href)
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
