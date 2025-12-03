import { NextResponse } from "next/server"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [customer, cart] = await Promise.all([retrieveCustomer(), retrieveCart()])

    let shippingOptions = []
    if (cart) {
      const { shipping_options } = await listCartOptions()
      shippingOptions = shipping_options
    }

    return NextResponse.json({ customer, cart, shippingOptions })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load layout state"
    return NextResponse.json({ message }, { status: 500 })
  }
}
