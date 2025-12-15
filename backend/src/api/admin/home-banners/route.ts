import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"
import { z } from "zod"

import HomeHeroBannerService, {
  type HomeHeroBannerCreateInput,
  type HomeHeroBannerUpdateInput,
} from "../../../modules/home-hero/service"
import { HOME_HERO_BANNER_MODULE } from "../../../modules/home-hero"

const KEY_PREFIX = "uploads/home-banners/"

const baseSchema = z.object({
  image_url: z.string({ required_error: "Image URL is required" }).url("Image URL must be valid"),
  image_key: z
    .string({ required_error: "Image key is required" })
    .min(1, "Image key is required"),
  alt_text: z.string().trim().optional().or(z.literal("")),
  sort_order: z.union([z.number(), z.nan()]).optional(),
  is_visible: z.boolean().optional(),
  starts_at: z.coerce.date().optional().nullable(),
  ends_at: z.coerce.date().optional().nullable(),
})

const createSchema = baseSchema
const updateSchema = baseSchema.partial().extend({
  id: z.string({ required_error: "Banner id is required" }).min(1, "Banner id is required"),
})

const deleteSchema = z.object({
  id: z.string({ required_error: "Banner id is required" }).min(1, "Banner id is required"),
})

const validateKeyPrefix = (key: string) => {
  if (!key.startsWith(KEY_PREFIX)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Image key must be stored under ${KEY_PREFIX}`,
    )
  }
}

const ensureScheduleOrder = (startsAt?: Date | null, endsAt?: Date | null) => {
  if (startsAt && endsAt && endsAt.getTime() < startsAt.getTime()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "End date/time must be after start date/time",
    )
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bannerService = req.scope.resolve<HomeHeroBannerService>(HOME_HERO_BANNER_MODULE)

  const banners = await bannerService.listHomeHeroBanners(
    {},
    {
      order: {
        sort_order: "ASC",
        created_at: "ASC",
      },
    },
  )

  res.json({ banners })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues })
    return
  }

  const data = parsed.data as HomeHeroBannerCreateInput
  const startsAt = data.starts_at ? new Date(data.starts_at) : null
  const endsAt = data.ends_at ? new Date(data.ends_at) : null

  validateKeyPrefix(data.image_key)
  ensureScheduleOrder(startsAt, endsAt)

  const bannerService = req.scope.resolve<HomeHeroBannerService>(HOME_HERO_BANNER_MODULE)
  const banner = await bannerService.createBanner({
    ...data,
    starts_at: startsAt,
    ends_at: endsAt,
  })

  res.status(201).json({ banner })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues })
    return
  }

  const data = parsed.data as HomeHeroBannerUpdateInput
  const startsAt = data.starts_at ? new Date(data.starts_at) : null
  const endsAt = data.ends_at ? new Date(data.ends_at) : null

  if (data.image_key) {
    validateKeyPrefix(data.image_key)
  }
  ensureScheduleOrder(startsAt, endsAt)

  const bannerService = req.scope.resolve<HomeHeroBannerService>(HOME_HERO_BANNER_MODULE)
  const banner = await bannerService.updateBanner({
    ...data,
    starts_at: startsAt,
    ends_at: endsAt,
  })

  res.json({ banner })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const parsed = deleteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues })
    return
  }

  const bannerService = req.scope.resolve<HomeHeroBannerService>(HOME_HERO_BANNER_MODULE)
  await bannerService.deleteBanner(parsed.data.id)

  res.status(204).send()
}
