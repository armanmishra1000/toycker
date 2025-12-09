import { NextResponse } from "next/server"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [customer, cart] = await Promise.all([retrieveCustomer(), retrieveCart()])

    let shippingOptions: Awaited<ReturnType<typeof listCartOptions>>["shipping_options"] = []
    if (cart) {
      const { shipping_options } = await listCartOptions()
      shippingOptions = shipping_options
    }

    const response = NextResponse.json({ customer, cart, shippingOptions })
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, max-age=0, must-revalidate"
    )
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load layout state"
    return NextResponse.json({ message }, { status: 500 })
  }
}
