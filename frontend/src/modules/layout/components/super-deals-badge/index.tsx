"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface SuperDealsBadgeProps {
  href?: string
}

const SuperDealsBadge = ({ href = "/deals" }: SuperDealsBadgeProps) => {
  return (
    <LocalizedClientLink
      href={href}
      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors group"
      aria-label="Super Deals Product"
    >
      <span className="text-xl">🔥</span>
      <span className="text-sm font-semibold text-primary group-hover:opacity-80 transition-opacity">
        Super Deals Product
      </span>
    </LocalizedClientLink>
  )
}

export default SuperDealsBadge
