import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

type EventPayload = Record<string, unknown>

type LoggerLike = {
  debug?: (message: string, meta?: Record<string, unknown>) => void
  info?: (message: string, meta?: Record<string, unknown>) => void
  warn: (message: string, meta?: Record<string, unknown>) => void
  error: (message: string | Error, meta?: Record<string, unknown>) => void
}

const EVENT_TAG_MAP: Record<string, string[]> = {
  "product.created": ["products"],
  "product.updated": ["products"],
  "product.deleted": ["products"],
  "product-variant.created": ["products", "variants"],
  "product-variant.updated": ["products", "variants"],
  "product-variant.deleted": ["products", "variants"],
  "inventory-item.updated": ["products"],
  "collection.created": ["collections", "products"],
  "collection.updated": ["collections", "products"],
  "collection.deleted": ["collections", "products"],
  "region.created": ["regions"],
  "region.updated": ["regions"],
  "region.deleted": ["regions"],
}

const DYNAMIC_TAG_RESOLVERS: Record<string, (payload: EventPayload) => string[]> = {
  "product.created": (payload) => resolveEntityTags("product", payload),
  "product.updated": (payload) => resolveEntityTags("product", payload),
  "product.deleted": (payload) => resolveEntityTags("product", payload),
  "product-variant.updated": (payload) => resolveEntityTags("product-variant", payload),
  "product-variant.deleted": (payload) => resolveEntityTags("product-variant", payload),
  "collection.updated": (payload) => resolveEntityTags("collection", payload),
  "collection.deleted": (payload) => resolveEntityTags("collection", payload),
  "region.updated": (payload) => resolveEntityTags("region", payload),
}

const GLOBAL_PATHS_BY_TAG: Record<string, string[]> = {
  regions: ["/"],
}

const MAX_RETRY_ATTEMPTS = 2

const resolveEntityTags = (entity: string, payload: EventPayload): string[] => {
  const identifiers = extractIdentifiers(payload)
  return identifiers.map((identifier) => `${entity}-${identifier}`)
}

const extractIdentifiers = (payload: EventPayload): string[] => {
  const candidates = [
    "id",
    "product_id",
    "productId",
    "variant_id",
    "variantId",
    "collection_id",
    "collectionId",
    "region_id",
    "regionId",
  ]

  const identifiers = new Set<string>()

  for (const key of candidates) {
    const value = payload[key]
    if (typeof value === "string" && value.trim().length > 0) {
      identifiers.add(value.trim())
    }
  }

  return Array.from(identifiers)
}

const buildPayload = (eventName: string, data: EventPayload): {
  tags: string[]
  paths?: string[]
} | null => {
  const baseTags = EVENT_TAG_MAP[eventName] ?? []
  const dynamicTags = DYNAMIC_TAG_RESOLVERS[eventName]?.(data) ?? []
  const tags = new Set<string>([...baseTags, ...dynamicTags])

  if (!tags.size) {
    return null
  }

  const payload: { tags: string[]; paths?: string[] } = {
    tags: Array.from(tags),
  }

  const paths = new Set<string>()
  for (const tag of tags) {
    const derivedPaths = GLOBAL_PATHS_BY_TAG[tag]
    if (derivedPaths) {
      derivedPaths.forEach((path) => paths.add(path))
    }
  }

  if (paths.size) {
    payload.paths = Array.from(paths)
  }

  return payload
}

const sendWithRetry = async (
  url: string,
  secret: string,
  payload: { tags: string[]; paths?: string[] },
  logger: LoggerLike
): Promise<void> => {
  let attempt = 0
  let lastError: unknown

  while (attempt < MAX_RETRY_ATTEMPTS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-medusa-revalidate-secret": secret,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`)
      }

      return
    } catch (error) {
      lastError = error
      attempt += 1
    }
  }

  logger.error("Failed to propagate cache revalidation", {
    payload,
    error: lastError instanceof Error ? lastError.message : lastError,
  })
}

export default async function cacheRevalidateSubscriber({
  event,
  container,
}: SubscriberArgs<EventPayload>) {
  const targetUrl = process.env.STOREFRONT_REVALIDATE_URL
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET

  const logger = (container.resolve("logger") ?? {
    warn: () => undefined,
    error: () => undefined,
  }) as LoggerLike

  if (!targetUrl || !secret) {
    logger.warn("Skipping cache revalidation because storefront endpoint is not configured", {
      targetUrlProvided: Boolean(targetUrl),
      secretProvided: Boolean(secret),
    })
    return
  }

  const payload = buildPayload(event.name, event.data ?? {})

  if (!payload) {
    return
  }

  logger.info?.("Propagating cache revalidation", {
    event: event.name,
    tags: payload.tags,
    paths: payload.paths,
  })

  await sendWithRetry(targetUrl, secret, payload, logger)
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product.deleted",
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted",
    "inventory-item.updated",
    "collection.created",
    "collection.updated",
    "collection.deleted",
    "region.created",
    "region.updated",
    "region.deleted",
  ],
  context: {
    subscriberId: "cache-revalidate-subscriber",
  },
}
