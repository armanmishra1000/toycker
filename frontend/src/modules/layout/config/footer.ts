export type FooterContactType = "address" | "phone" | "email" | "fax"

export interface FooterContactItem {
  id: string
  label: string
  value: string
  href?: string
  type: FooterContactType
}

export interface FooterLinkItem {
  id: string
  label: string
  href: string
}

export interface FooterLinkGroup {
  id: string
  title: string
  links: FooterLinkItem[]
}

export interface FooterSocialLink {
  id: string
  label: string
  href: string
}

export interface FooterBadgeGroup {
  id: string
  title: string
  badges: { id: string; label: string; helper?: string }[]
}

export const footerDescription =
  "Welcome to Toycker Collections, your #1 source for A–Z products with the best discounts 🎁"

export const footerContactItems: FooterContactItem[] = [
  {
    id: "address",
    label: "GROUND FLOOR, PLOT NO. 76, NILAMNAGAR SOCIETTY-2, PUNA SIMADA ROAD, PUNAGAM, Surat, Gujarat, 395010",
    value: "GROUND FLOOR, PLOT NO. 76, NILAMNAGAR SOCIETTY-2, PUNA SIMADA ROAD, PUNAGAM, Surat, Gujarat, 395010",
    type: "address",
  },
  {
    id: "phone",
    label: "+91 9925819694",
    value: "+91 9925819694",
    href: "tel:9925819694",
    type: "phone",
  },
  {
    id: "email",
    label: "customercare@toycker.com",
    value: "customercare@toycker.com",
    href: "mailto:customercare@toycker.com",
    type: "email",
  }
]

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    id: "categories",
    title: "Categories",
    links: [
      { id: "action-figures", label: "Action Figures", href: "/categories/action-figures" },
      { id: "sport-toys", label: "Sport Toys", href: "/categories/sport-toys" },
      { id: "educational-toy", label: "Educational Toy", href: "/categories/educational-toy" },
      { id: "drone", label: "Drone", href: "/categories/drone" },
      { id: "role-play-set", label: "Role Play Set", href: "/categories/role-play-set" },
      { id: "electric-ride-ons", label: "Electric Ride Ons", href: "/categories/electric-ride-ons" },
    ],
  },
  {
    id: "customer-support",
    title: "Customer Support",
    links: [
      { id: "about-us", label: "About Us", href: "/about" },
      { id: "contact-us", label: "Contact Us", href: "/contact" },
      { id: "membership", label: "Membership", href: "/membership" },
      { id: "return-refund", label: "Return & Refund", href: "/policies/returns" },
      { id: "shipping-policy", label: "Shipping Policy", href: "/policies/shipping" },
      { id: "terms", label: "Terms & Condition", href: "/policies/terms" },
    ],
  },
]

export const footerSocialLinks: FooterSocialLink[] = [
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/toyckerofficial" },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/toyckerofficial" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@toyckerofficial" },
]

export const footerBadgeGroups: FooterBadgeGroup[] = [
  {
    id: "partners",
    title: "Trusted playful partners",
    badges: [
      { id: "playverse", label: "PlayVerse" },
      { id: "kiddo", label: "KiddoLab" },
      { id: "maker", label: "MakerHub" },
      { id: "astro", label: "AstroToys" },
    ],
  },
  {
    id: "payments",
    title: "Payments we accept",
    badges: [
      { id: "visa", label: "Visa" },
      { id: "mastercard", label: "Mastercard" },
      { id: "paypal", label: "PayPal" },
      { id: "stripe", label: "Stripe" },
    ],
  },
]

export const newsletterCopy = {
  title: "Subscribe & Save 50% 🔥",
  description: "Get your Exclusive Coupon code in seconds and Enjoy 50% OFF on Every Product with Free Delivery, only for New Subscribers!",
  placeholder: "Enter your email...",
  cta: "Send",
}
