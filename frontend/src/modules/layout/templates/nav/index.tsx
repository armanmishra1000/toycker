import { HttpTypes } from "@medusajs/types"
import Header from "@modules/layout/components/header"

export default function Nav({ cart }: { cart?: HttpTypes.StoreCart | null }) {
  return <Header cart={cart} />
}
