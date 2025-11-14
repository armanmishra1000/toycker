"use client"

import { PhoneIcon } from "@heroicons/react/24/outline"

interface ContactInfoProps {
  phone?: string
  showIcon?: boolean
}

const ContactInfo = ({ 
  phone = "+1-888-0000-000", 
  showIcon = true 
}: ContactInfoProps) => {
  return (
    <a
      href={`tel:${phone.replace(/\D/g, "")}`}
      className="hidden lg:flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
      aria-label="Contact phone number"
    >
      {showIcon && (
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <PhoneIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-xs opacity-75">24/7 Support:</span>
        <span className="text-sm font-medium">{phone}</span>
      </div>
    </a>
  )
}

export default ContactInfo
