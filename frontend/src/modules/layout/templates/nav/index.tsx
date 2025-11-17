import { HttpTypes } from "@medusajs/types"
import { getNavigationConfig } from "@lib/data/navigation"
import Header from "@modules/layout/components/header"

export default async function Nav({ cart }: { cart?: HttpTypes.StoreCart | null }) {
  const navigationConfig = await getNavigationConfig()

  return (
    <Header
      cart={cart}
      navLinks={navigationConfig.navLinks}
      ageCategories={navigationConfig.ageCategories}
    />
  )
}
