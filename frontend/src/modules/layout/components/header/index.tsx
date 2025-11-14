"use client"

import { useState } from "react"
import { Bars3Icon, HeartIcon, ShoppingBagIcon, MagnifyingGlassIcon, UserIcon } from "@heroicons/react/24/outline"
import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AnnouncementBar from "@modules/layout/components/announcement-bar"
import Logo from "@modules/layout/components/logo"
import Search from "@modules/layout/components/search"
import ContactInfo from "@modules/layout/components/contact-info"
import IconButton from "@modules/layout/components/icon-button"
import MainNavigation from "@modules/layout/components/main-navigation"
import SuperDealsBadge from "@modules/layout/components/super-deals-badge"
import CartButton from "@modules/layout/components/cart-button"
import MobileMenu from "@modules/layout/components/mobile-menu"
import SearchModal from "@modules/layout/components/search-modal"

type HeaderProps = {
  regions?: Record<string, unknown>
  cart?: HttpTypes.StoreCart | null
}

const Header = ({ regions, cart }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  const cartItemCount = cart?.items?.length || 0

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-40 bg-primary text-white">
        {/* Row 1 - Main Header with Primary Background */}
        <div className="mx-auto px-4 max-w-[1440px]">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Menu Button & Logo - Left Side */}
            <div className="flex items-center gap-3 lg:gap-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 bg-foreground rounded-full transition-colors hover:bg-opacity-90"
                aria-label="Toggle mobile menu"
              >
                <Bars3Icon className="w-5 h-5 text-white" />
              </button>

              {/* Logo */}
              <div className="flex-shrink-0">
                <Logo />
              </div>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-xl">
              <Search placeholder="Search for toys..." />
            </div>

            {/* Contact Info - Desktop Only */}
            <div className="hidden lg:flex">
              <ContactInfo phone="+1-888-0000-000" showIcon={true} />
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-2">
              {/* Mobile Search Icon */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="lg:hidden p-2 bg-foreground rounded-full transition-colors group relative"
                aria-label="Open search"
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Login Button - Desktop Only */}
              <div className="hidden lg:block ">
                <LocalizedClientLink href="/account/login" className="group relative">
                  <button
                    className="p-2 bg-foreground rounded-full transition-colors relative"
                    aria-label="Login to account"
                  >
                    <UserIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  </button>
                </LocalizedClientLink>
              </div>

              {/* Wishlist - Desktop Only */}
              <div className="hidden lg:block">
                <IconButton
                  icon={HeartIcon}
                  label="Wishlist"
                  count={0}
                  href="/wishlist"
                  ariaLabel="Wishlist (0 items)"
                />
              </div>

              {/* Shopping Bag / Cart */}
              <IconButton
                icon={ShoppingBagIcon}
                label="Shopping Bag"
                count={cartItemCount}
                href="/cart"
                ariaLabel={`Shopping bag (${cartItemCount} items)`}
              />
            </div>
          </div>
        </div>

        {/* Mobile Search - Expandable */}
        <div className="lg:hidden hidden mx-auto px-4 max-w-[1440px] pb-3">
          <Search placeholder="Search toys..." />
        </div>
      </header>

      {/* Mobile Search Modal */}
      <SearchModal
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
      />

      {/* Row 2 - Navigation with White Background - Desktop Only */}
      <div className="hidden lg:block bg-white border-b border-gray-200">
        <div className="mx-auto px-4 max-w-[1440px]">
          <div className="flex items-center justify-between h-14">
            {/* Main Navigation */}
            <div>
              <MainNavigation />
            </div>

            {/* Super Deals Badge */}
            <div>
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
