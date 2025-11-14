"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface LogoProps {
  variant?: "light" | "dark"
}

const Logo = ({ variant = "light" }: LogoProps) => {
  return (
    <LocalizedClientLink href="/" className="flex items-center flex-shrink-0">
      <div className="relative w-auto h-12">
        <Image
          src="/assets/images/toycker.png"
          alt="Toycker Logo"
          width={150}
          height={50}
          priority
          className="h-full w-auto"
        />
      </div>
    </LocalizedClientLink>
  )
}

export default Logo
