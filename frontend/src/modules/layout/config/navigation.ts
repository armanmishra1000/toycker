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
  { id: "0-12-months", label: "0-12 Months", href: "/categories/0-12-months" },
  { id: "1-2-years", label: "1-2 Years", href: "/categories/1-2-years" },
  { id: "2-3-years", label: "2-3 Years", href: "/categories/2-3-years" },
  { id: "3-5-years", label: "3-5 Years", href: "/categories/3-5-years" },
  { id: "5-8-years", label: "5-8 Years", href: "/categories/5-8-years" },
  { id: "8-12-years", label: "8-12 Years", href: "/categories/8-12-years" },
  { id: "12-plus", label: "12+ Years", href: "/categories/12-plus" },
]

export const shopMenuSections: ShopMenuSection[] = [
  {
    id: "brands",
    title: "Shop By Brand",
    items: [
      { id: "giggles", label: "Giggles", href: "/collections/giggles" },
      { id: "fundough", label: "Fundough", href: "/collections/fundough" },
      { id: "games", label: "Games", href: "/collections/games" },
      { id: "handycrafts", label: "Handycrafts", href: "/collections/handycrafts" },
      { id: "play-learn", label: "Play & Learn", href: "/collections/play-and-learn" },
      { id: "other-brands", label: "Other Brands", href: "/collections" },
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
