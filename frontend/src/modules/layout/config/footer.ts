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
  "Lorem ipsum dolor sit amet consectetur. Id fames there are many vulputate eget dolor."

export const footerContactItems: FooterContactItem[] = [
  {
    id: "address",
    label: "6391 Elgin St. Celina, Delaware 10299",
    value: "6391 Elgin St. Celina, Delaware 10299",
    type: "address",
  },
  {
    id: "phone",
    label: "+000-1234-456789",
    value: "+000-1234-456789",
    href: "tel:+0001234456789",
    type: "phone",
  },
  {
    id: "email",
    label: "toyup@gmail.com",
    value: "toyup@gmail.com",
    href: "mailto:toyup@gmail.com",
    type: "email",
  },
  {
    id: "fax",
    label: "+000-1234-55000",
    value: "+000-1234-55000",
    type: "fax",
  },
]

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    id: "services",
    title: "Services",
    links: [
      { id: "service-offerings", label: "Service Offerings", href: "/services/offerings" },
      { id: "how-it-works", label: "How It Works", href: "/services/how-it-works" },
      { id: "pricing-table", label: "Pricing Table", href: "/pricing" },
      { id: "service-areas", label: "Service Areas", href: "/services/areas" },
      { id: "service-faqs", label: "Service FAQs", href: "/services/faqs" },
      { id: "contact-information", label: "Contact Information", href: "/contact" },
    ],
  },
  {
    id: "customer-support",
    title: "Customer Support",
    links: [
      { id: "contact-us", label: "Contact Us", href: "/contact" },
      { id: "store-list", label: "Store List", href: "/stores" },
      { id: "opening-hours", label: "Opening Hours", href: "/stores/opening-hours" },
      { id: "returns", label: "Returns & Exchanges", href: "/support/returns" },
      { id: "refund", label: "Refund and Returns", href: "/support/refund" },
      { id: "privacy", label: "Privacy Policy", href: "/policies/privacy" },
    ],
  },
]

export const footerSocialLinks: FooterSocialLink[] = [
  { id: "facebook", label: "Facebook", href: "https://facebook.com" },
  { id: "x", label: "X", href: "https://x.com" },
  { id: "linkedin", label: "LinkedIn", href: "https://linkedin.com" },
  { id: "instagram", label: "Instagram", href: "https://instagram.com" },
  { id: "tiktok", label: "TikTok", href: "https://tiktok.com" },
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
  title: "Subscribe Our Newsletter",
  description: "With our newsletter, you'll never miss an important update.",
  placeholder: "Email Address",
  cta: "Send",
}
