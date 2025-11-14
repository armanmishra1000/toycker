"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface IconButtonProps {
  icon: React.ForwardRefExoticComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >
  label: string
  count: number
  href: string
  ariaLabel?: string
}

const IconButton = ({
  icon: Icon,
  label,
  count,
  href,
  ariaLabel,
}: IconButtonProps) => {
  return (
    <LocalizedClientLink href={href} className="group relative">
      <div
        className="p-2 bg-foreground rounded-full transition-colors relative"
        aria-label={ariaLabel || label}
      >
        <Icon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </div>
    </LocalizedClientLink>
  )
}

export default IconButton
