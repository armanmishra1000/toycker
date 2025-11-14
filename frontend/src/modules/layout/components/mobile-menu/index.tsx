"use client"

import { useRef, useState } from "react"
import { XMark } from "@medusajs/icons"
import { Button } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useOnClickOutside } from "@modules/layout/hooks/useOnClickOutside"

type MobileMenuProps = {
  isOpen: boolean
  onClose: () => void
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)
  
  useOnClickOutside(menuRef, onClose)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        ref={menuRef}
        className="relative bg-white w-full max-w-md h-full shadow-xl overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold font-grandstander">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <XMark className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-4">
            <li>
              <LocalizedClientLink
                href="/"
                className="block py-3 px-4 text-lg font-medium hover:bg-primary hover:text-white rounded-lg transition-colors font-grandstander"
                onClick={onClose}
              >
                Home
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/store"
                className="block py-3 px-4 text-lg font-medium hover:bg-primary hover:text-white rounded-lg transition-colors font-grandstander"
                onClick={onClose}
              >
                Shop
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/categories"
                className="block py-3 px-4 text-lg font-medium hover:bg-primary hover:text-white rounded-lg transition-colors font-grandstander"
                onClick={onClose}
              >
                Categories
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/deals"
                className="block py-3 px-4 text-lg font-medium hover:bg-primary hover:text-white rounded-lg transition-colors font-grandstander"
                onClick={onClose}
              >
                Deals
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/blog"
                className="block py-3 px-4 text-lg font-medium hover:bg-primary hover:text-white rounded-lg transition-colors font-grandstander"
                onClick={onClose}
              >
                Blog
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/contact"
                className="block py-3 px-4 text-lg font-medium hover:bg-primary hover:text-white rounded-lg transition-colors font-grandstander"
                onClick={onClose}
              >
                Contact
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/account"
                className="block py-3 px-4 text-lg font-medium hover:bg-primary hover:text-white rounded-lg transition-colors font-grandstander"
                onClick={onClose}
              >
                My Account
              </LocalizedClientLink>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2 text-sm text-gray-600">
            <p>📧 info@toycker.com</p>
            <p>📞 +1-888-TOYCKER</p>
            <p>📍 123 Toy Street, Play City</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileMenu
