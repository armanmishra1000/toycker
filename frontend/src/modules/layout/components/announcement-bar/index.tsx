"use client"

import { 
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

  const renderItem = (item: AnnouncementItem) => {
    const Icon = item.icon
    const content = (
      <div 
        className="flex items-center gap-2"
        aria-label={item.ariaLabel}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="whitespace-nowrap text-base font-medium">
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
      className="hidden lg:block bg-primary text-white py-3"
    >
      <div className="mx-auto px-4 max-w-[1440px]">
        <div className="flex flex-row justify-between items-center gap-6">
          {/* Left section - Delivery and Contact */}
          <div className="flex items-center gap-4">
            {leftItems.map((item) => renderItem(item))}
          </div>

          {/* Right section - Location, Login, Help */}
          <div className="flex items-center gap-4">
            {rightItems.map((item) => renderItem(item))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnnouncementBar