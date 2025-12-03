import { Modules } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/types"

const toNumber = (value: unknown, fallback: number, options?: { min?: number; max?: number }) => {
  const parsed = typeof value === "string" ? Number(value) : Number(value)
  let resolved = Number.isFinite(parsed) ? parsed : fallback

  if (typeof options?.min === "number") {
    resolved = Math.max(options.min, resolved)
  }

  if (typeof options?.max === "number") {
    resolved = Math.min(options.max, resolved)
  }

  return resolved
}

const normalizeQueryValue = (value: unknown) => {
  if (typeof value === "string") {
    return value.trim()
  }

  if (Array.isArray(value)) {
    return value[0]?.toString().trim() ?? ""
  }

  return ""
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)

  const limit = toNumber(req.query?.limit, 50, { min: 1, max: 200 })
  const offset = toNumber(req.query?.offset, 0, { min: 0 })
  const q = normalizeQueryValue(req.query?.q)

  const filters: Record<string, unknown> = {}

  if (q) {
    filters.q = q
  }

  const [collections, count] = await productService.listAndCountProductCollections(filters, {
    take: limit,
    skip: offset,
    order: {
      created_at: "DESC",
    },
  })

  res.json({
    product_collections: collections,
    count,
    limit,
    offset,
  })
}
