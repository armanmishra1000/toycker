export interface NavLink {
  id: string
  label: string
  href: string
  hasDropdown?: boolean
}

export interface AgeCategory {
  id: string
  label: string
  href: string
}

export interface ShopMenuLink {
  id: string
  label: string
  href: string
}

export interface ShopMenuSection {
  id: string
  title: string
  items: ShopMenuLink[]
  accent?: "muted" | "highlight"
}

export interface ShopMenuPromo {
  title: string
  links: ShopMenuLink[]
  image: {
    src: string
    alt: string
  }
}

export const navLinks: NavLink[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "shop", label: "Shop", href: "/shop-by-age", hasDropdown: true },
  { id: "about", label: "About Us", href: "/about" },
  { id: "contact", label: "Contact", href: "/contact" },
  { id: "metal-cars", label: "Metal Cars", href: "/metal-cars" },
]

export const ageCategories: AgeCategory[] = [
  { id: "0-18-months", label: "0-18 Month", href: "/collections/0-18-months" },
  { id: "18-36-months", label: "18-36 Month", href: "/collections/18-36-months" },
  { id: "3-5-years", label: "3-5 Year", href: "/collections/3-5-years" },
  { id: "5-7-years", label: "5-7 Year", href: "/collections/5-7-years" },
  { id: "7-9-years", label: "7-9 Years", href: "/collections/7-9-years" },
  { id: "9-12-years", label: "9-12 Year", href: "/collections/9-12-years" },
  { id: "12-14-years", label: "12-14 Year", href: "/collections/12-14-years" },
  { id: "14-plus-years", label: "14+ Year", href: "/collections/14-plus-years" },
]

export const shopMenuSections: ShopMenuSection[] = [
  {
    id: "brands",
    title: "Shop By Brand",
    items: [
      { id: "giggles", label: "Giggles", href: "/categories/giggles" },
      { id: "fundough", label: "Fundough", href: "/categories/fundough" },
      { id: "games", label: "Games", href: "/categories/games" },
      { id: "handycrafts", label: "Handycrafts", href: "/categories/handycrafts" },
      { id: "play-learn", label: "Play & Learn", href: "/categories/play-and-learn" },
      { id: "other-brands", label: "Other Brands", href: "/categories" },
    ],
  },
  {
    id: "age",
    title: "Shop by Age",
    accent: "muted",
    items: ageCategories.map((category) => ({
      id: category.id,
      label: category.label,
      href: category.href,
    })),
  },
]

export const shopMenuPromo: ShopMenuPromo = {
  title: "Shop All",
  links: [
    { id: "shop-all", label: "Shop All", href: "/store" },
    { id: "new-arrivals", label: "New Arrivals", href: "/categories/new-arrivals" },
    { id: "best-sellers", label: "Best Sellers", href: "/categories/best-sellers" },
  ],
  image: {
    src: "/assets/images/H373b3e2614344291824ff29116a86506M.jpg",
    alt: "Happy kid playing with toys",
  },
}
