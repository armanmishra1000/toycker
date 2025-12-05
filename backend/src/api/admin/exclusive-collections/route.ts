import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/types"
import { MedusaError } from "@medusajs/utils"
import { z } from "zod"

import ExclusiveShowcaseService, {
  ExclusiveShowcaseEntryDTO,
  ExclusiveShowcaseEntryInput,
  ExclusiveShowcaseEntryUpdateInput,
} from "../../../modules/exclusive-showcase/service"
import { EXCLUSIVE_SHOWCASE_MODULE } from "../../../modules/exclusive-showcase"

const entryBaseSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  video_key: z.string().min(1, "Upload is required"),
  video_url: z.string().url("Video URL must be valid"),
  poster_url: z.string().url().optional().or(z.literal("")).or(z.null()),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
})

const createSchema = entryBaseSchema
const updateSchema = entryBaseSchema.partial().extend({
  id: z.string().min(1, "Entry id is required"),
})

const deleteSchema = z.object({
  id: z.string().min(1, "Entry id is required"),
})

const attachProducts = async (
  entries: ExclusiveShowcaseEntryDTO[],
  productService: IProductModuleService,
) => {
  if (!entries.length) {
    return []
  }

  const productIds = Array.from(new Set(entries.map((entry) => entry.product_id)))
  const products = await productService.listProducts({ id: productIds })
  const productMap = new Map(products.map((product) => [product.id, product]))

  return entries.map((entry) => ({
    ...entry,
    product: productMap.get(entry.product_id) ?? null,
  }))
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const showcaseService = req.scope.resolve<ExclusiveShowcaseService>(EXCLUSIVE_SHOWCASE_MODULE)
  const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)

  const entries = await showcaseService.listExclusiveShowcaseEntries(
    {},
    {
      order: {
        sort_order: "ASC",
        created_at: "ASC",
      },
    },
  )

  const payload = await attachProducts(entries, productService)

  res.json({ entries: payload })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues })
    return
  }

  const data = parsed.data as ExclusiveShowcaseEntryInput

  const showcaseService = req.scope.resolve<ExclusiveShowcaseService>(EXCLUSIVE_SHOWCASE_MODULE)
  const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)

  await productService.retrieveProduct(data.product_id)

  const existing = await showcaseService.listExclusiveShowcaseEntries({
    product_id: data.product_id,
  })

  if (existing.length) {
    throw new MedusaError(
      MedusaError.Types.DUPLICATE_ERROR,
      "This product already has an exclusive collection entry.",
    )
  }

  const entry = await showcaseService.createEntry(data)
  const [payload] = await attachProducts([entry], productService)

  res.status(201).json({ entry: payload })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues })
    return
  }

  const data = parsed.data as ExclusiveShowcaseEntryUpdateInput
  const showcaseService = req.scope.resolve<ExclusiveShowcaseService>(EXCLUSIVE_SHOWCASE_MODULE)
  const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)

  if (data.product_id) {
    await productService.retrieveProduct(data.product_id)

    const duplicates = await showcaseService.listExclusiveShowcaseEntries({
      product_id: data.product_id,
    })

    if (duplicates.some((entry) => entry.id !== data.id)) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        "This product already has another exclusive collection entry.",
      )
    }
  }

  const entry = await showcaseService.updateEntry(data)
  const [payload] = await attachProducts([entry], productService)

  res.json({ entry: payload })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const parsed = deleteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues })
    return
  }

  const showcaseService = req.scope.resolve<ExclusiveShowcaseService>(EXCLUSIVE_SHOWCASE_MODULE)
  await showcaseService.deleteEntry(parsed.data.id)

  res.status(204).send()
}
