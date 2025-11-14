"use client"

import { useState, useEffect } from "react"
import { 
  XMarkIcon, 
  TruckIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  UserIcon, 
  QuestionMarkCircleIcon 
} from "@heroicons/react/24/outline"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface AnnouncementItem {
  id: string
  text: string
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement> & { title?: string }>
  href?: string
  ariaLabel: string
}

const AnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(true)

  // Left section items - Delivery and Contact Info
  const leftItems: AnnouncementItem[] = [
    { 
      id: "delivery", 
      text: "Get free home delivery (Order More than $300)",
      icon: TruckIcon,
      ariaLabel: "Free home delivery offer"
    },
    { 
      id: "email", 
      text: "info@gmail.com",
      icon: EnvelopeIcon,
      ariaLabel: "Contact email"
    }
  ]

  // Right section items - Location, Login, Help
  const rightItems: AnnouncementItem[] = [
    { 
      id: "location", 
      text: "Surat, Gujarat",
      icon: MapPinIcon,
      ariaLabel: "Current location"
    },
    { 
      id: "login", 
      text: "Login",
      icon: UserIcon,
      href: "/account",
      ariaLabel: "Login to account"
    },
    { 
      id: "help", 
      text: "Help",
      icon: QuestionMarkCircleIcon,
      href: "/help",
      ariaLabel: "Get help"
    }
  ]

  useEffect(() => {
    // Check if user has previously closed the announcement
    const closed = localStorage.getItem('announcement-closed')
    if (closed) {
      setIsVisible(false)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('announcement-closed', 'true')
  }

  if (!isVisible) {
    return null
  }

  const renderItem = (item: AnnouncementItem) => {
    const Icon = item.icon
    const content = (
      <div 
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 transition-all duration-200 cursor-pointer group"
        aria-label={item.ariaLabel}
      >
        <Icon className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
        <span className="whitespace-nowrap text-xs md:text-sm font-medium">
          {item.text}
        </span>
      </div>
    )

    if (item.href) {
      return (
        <LocalizedClientLink key={item.id} href={item.href}>
          {content}
        </LocalizedClientLink>
      )
    }

    return (
      <div key={item.id}>
        {content}
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label="Announcement bar"
      aria-live="polite"
      className="bg-primary text-white py-2 md:py-3 animate-slide-down relative"
    >
      <div className="content-container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-6 pr-8">
          {/* Left section - Delivery and Contact */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
            {leftItems.map((item) => renderItem(item))}
          </div>

          {/* Right section - Location, Login, Help */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto md:justify-end">
            {rightItems.map((item) => renderItem(item))}
          </div>
        </div>

        {/* Close button - positioned absolutely */}
        <button
          onClick={handleClose}
          className="absolute top-1/2 right-4 md:right-6 transform -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-110"
          aria-label="Close announcement"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default AnnouncementBar