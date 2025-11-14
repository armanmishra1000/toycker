"use client"

import { useState } from "react"
import { Button } from "@medusajs/ui"
import { Bars3Icon, ArrowPathIcon, HeartIcon, ShoppingBagIcon } from "@heroicons/react/24/outline"
import { HttpTypes } from "@medusajs/types"

import AnnouncementBar from "@modules/layout/components/announcement-bar"
import Logo from "@modules/layout/components/logo"
import Search from "@modules/layout/components/search"
import ContactInfo from "@modules/layout/components/contact-info"
import IconButton from "@modules/layout/components/icon-button"
import MainNavigation from "@modules/layout/components/main-navigation"
import SuperDealsBadge from "@modules/layout/components/super-deals-badge"
import CartButton from "@modules/layout/components/cart-button"
import MobileMenu from "@modules/layout/components/mobile-menu"

type HeaderProps = {
  regions?: Record<string, unknown>
  cart?: HttpTypes.StoreCart | null
}

const Header = ({ regions, cart }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const cartItemCount = cart?.items?.length || 0

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-40 bg-primary text-white">
        {/* Row 1 - Main Header with Primary Background */}
        <div className="mx-auto px-4 max-w-[1440px]">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Mobile Menu Button */}
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variant="transparent"
              className="lg:hidden p-2 hover:bg-white/10"
              aria-label="Toggle mobile menu"
            >
              <Bars3Icon className="w-6 h-6 text-white" />
            </Button>

            {/* Logo */}
            <div className="flex-shrink-0">
              <Logo />
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:block flex-1 max-w-md">
              <Search placeholder="Search for toys..." />
            </div>

            {/* Contact Info - Desktop Only */}
            <div className="hidden lg:block">
              <ContactInfo phone="+1-888-0000-000" showIcon={true} />
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-2">
              {/* Compare */}
              <IconButton
                icon={ArrowPathIcon}
                label="Compare"
                count={0}
                href="/compare"
                ariaLabel="Compare products (0 items)"
              />

              {/* Wishlist */}
              <IconButton
                icon={HeartIcon}
                label="Wishlist"
                count={0}
                href="/wishlist"
                ariaLabel="Wishlist (0 items)"
              />

              {/* Cart */}
              <div className="relative">
                <CartButton cart={cart} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search - Expandable */}
        <div className="lg:hidden mx-auto px-4 max-w-[1440px] pb-3">
          <Search placeholder="Search toys..." />
        </div>
      </header>

      {/* Row 2 - Navigation with White Background */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto px-4 max-w-[1440px]">
          <div className="flex items-center justify-between h-14">
            {/* Main Navigation */}
            <div className="hidden md:block">
              <MainNavigation />
            </div>

            {/* Super Deals Badge */}
            <div className="md:absolute md:right-6">
              <SuperDealsBadge href="/deals" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  )
}

export default Header
