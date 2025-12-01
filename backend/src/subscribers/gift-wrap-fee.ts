import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type {
  CartDTO,
  CartLineItemDTO,
  ICartModuleService,
} from "@medusajs/types"

type GiftWrapMetadata = {
  gift_wrap: true
  gift_wrap_fee: number
  gift_wrap_packages: number
}

type GiftWrapLineMetadata = {
  gift_wrap_line: true
  parent_line_id: string
}

const GIFT_WRAP_LINE_TITLE = "Gift Wrap"

const toPositiveInteger = (value: unknown, fallback = 1) => {
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.floor(parsed)
}

const clampPackages = (packages: number) => Math.max(1, packages)

const isGiftWrapMetadata = (
  metadata: unknown
): metadata is GiftWrapMetadata => {
  if (!metadata || typeof metadata !== "object") {
    return false
  }

  const data = metadata as Record<string, unknown>
  return (
    data.gift_wrap === true &&
    typeof data.gift_wrap_fee === "number" &&
    typeof data.gift_wrap_packages === "number"
  )
}

const isGiftWrapLineMetadata = (
  metadata: unknown
): metadata is GiftWrapLineMetadata => {
  if (!metadata || typeof metadata !== "object") {
    return false
  }

  const data = metadata as Record<string, unknown>
  return data.gift_wrap_line === true && typeof data.parent_line_id === "string"
}

const buildGiftWrapLinePayload = (
  cart: CartDTO,
  parentLineId: string,
  unitPrice: number,
  packages: number
) => ({
  title: GIFT_WRAP_LINE_TITLE,
  cart_id: cart.id,
  quantity: packages,
  unit_price: unitPrice,
  is_discountable: false,
  metadata: {
    gift_wrap_line: true,
    parent_line_id: parentLineId,
  },
})

async function syncGiftWrapLines({
  event,
  container,
}: SubscriberArgs<{ id?: string }>) {
  const cartId = event.data?.id

  if (!cartId) {
    return
  }

  const cartService = container.resolve<ICartModuleService>(Modules.CART)

  const cart = await cartService
    .retrieveCart(cartId, {
      relations: ["items"],
    })
    .catch(() => null)

  if (!cart?.items?.length) {
    return
  }

  const giftWrapLines = new Map<string, CartLineItemDTO>()

  for (const item of cart.items) {
    if (isGiftWrapLineMetadata(item.metadata)) {
      giftWrapLines.set(item.metadata.parent_line_id, item)
    }
  }

  const operations: Promise<unknown>[] = []

  for (const item of cart.items) {
    if (!isGiftWrapMetadata(item.metadata)) {
      continue
    }

    const existingWrapLine = giftWrapLines.get(item.id)

    const wrapQuantity = clampPackages(
      existingWrapLine
        ? toPositiveInteger(existingWrapLine.quantity, 1)
        : toPositiveInteger(item.metadata.gift_wrap_packages, 1)
    )

    const fee = item.metadata.gift_wrap_fee

    if (!existingWrapLine) {
      operations.push(
        cartService.addLineItems(cart.id, [
          buildGiftWrapLinePayload(cart, item.id, fee, wrapQuantity),
        ])
      )

      if (item.metadata.gift_wrap_packages !== wrapQuantity) {
        operations.push(
          cartService.updateLineItems(item.id, {
            metadata: {
              ...(item.metadata ?? {}),
              gift_wrap_packages: wrapQuantity,
            },
          })
        )
      }

      continue
    }

    giftWrapLines.delete(item.id)

    const currentQuantity = toPositiveInteger(existingWrapLine.quantity, wrapQuantity)
    const currentUnitPrice = Number(existingWrapLine.unit_price)
    const needsUpdate =
      currentQuantity !== wrapQuantity || currentUnitPrice !== fee

    if (needsUpdate) {
      operations.push(
        cartService.updateLineItems(existingWrapLine.id, {
          quantity: wrapQuantity,
          unit_price: fee,
          metadata: {
            ...(existingWrapLine.metadata ?? {}),
            gift_wrap_line: true,
            parent_line_id: item.id,
          },
        })
      )
    }

    if (item.metadata.gift_wrap_packages !== wrapQuantity) {
      operations.push(
        cartService.updateLineItems(item.id, {
          metadata: {
            ...(item.metadata ?? {}),
            gift_wrap_packages: wrapQuantity,
          },
        })
      )
    }
  }

  const orphanedWrapLineIds = Array.from(giftWrapLines.values())
    .map((line) => line.id)
    .filter((id): id is string => Boolean(id))

  if (orphanedWrapLineIds.length) {
    operations.push(cartService.deleteLineItems(orphanedWrapLineIds))
  }

  if (operations.length) {
    await Promise.allSettled(operations)
  }
}

export default syncGiftWrapLines

export const config: SubscriberConfig = {
  event: "cart.updated",
  context: {
    subscriberId: "gift-wrap-fee-subscriber",
  },
}
