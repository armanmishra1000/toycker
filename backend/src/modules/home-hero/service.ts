import { MedusaService } from "@medusajs/framework/utils"
import type { FindConfig } from "@medusajs/types"

import HomeHeroBanner from "./models/home-hero-banner"

export type HomeHeroBannerDTO = Awaited<
  ReturnType<HomeHeroBannerService["retrieveHomeHeroBanner"]>
>

export type HomeHeroBannerCreateInput = {
  id?: string
  image_url: string
  image_key: string
  alt_text?: string | null
  sort_order?: number
  is_visible?: boolean
  starts_at?: Date | string | null
  ends_at?: Date | string | null
}

export type HomeHeroBannerUpdateInput = {
  id: string
  image_url?: string
  image_key?: string
  alt_text?: string | null
  sort_order?: number
  is_visible?: boolean
  starts_at?: Date | string | null
  ends_at?: Date | string | null
}

class HomeHeroBannerService extends MedusaService({
  HomeHeroBanner,
}) {
  async listActive(config?: FindConfig<HomeHeroBannerDTO>) {
    const now = new Date()

    const banners = await this.listHomeHeroBanners(
      {
        is_visible: true,
      },
      {
        order: {
          sort_order: "ASC",
          created_at: "ASC",
        },
        ...config,
      },
    )

    return banners.filter((banner) => {
      const startsAt = banner.starts_at ? new Date(banner.starts_at) : null
      const endsAt = banner.ends_at ? new Date(banner.ends_at) : null

      const hasStarted = !startsAt || startsAt <= now
      const notEnded = !endsAt || endsAt >= now

      return hasStarted && notEnded
    })
  }

  async createBanner(data: HomeHeroBannerCreateInput) {
    const normalizedAlt = typeof data.alt_text === "string" ? data.alt_text.trim() : null
    const normalizedSort =
      typeof data.sort_order === "number"
        ? data.sort_order
        : Math.floor(Date.now() / 1000)

    const startsAt = data.starts_at ? new Date(data.starts_at) : null
    const endsAt = data.ends_at ? new Date(data.ends_at) : null

    return await this.createHomeHeroBanners({
      ...data,
      alt_text: normalizedAlt,
      sort_order: normalizedSort,
      starts_at: startsAt,
      ends_at: endsAt,
    })
  }

  async updateBanner(data: HomeHeroBannerUpdateInput) {
    const payload: Record<string, unknown> = { id: data.id }

    if (Object.prototype.hasOwnProperty.call(data, "image_url")) {
      payload.image_url = data.image_url
    }
    if (Object.prototype.hasOwnProperty.call(data, "image_key")) {
      payload.image_key = data.image_key
    }
    if (Object.prototype.hasOwnProperty.call(data, "alt_text")) {
      payload.alt_text =
        typeof data.alt_text === "string" ? data.alt_text.trim() : data.alt_text ?? null
    }
    if (Object.prototype.hasOwnProperty.call(data, "sort_order")) {
      payload.sort_order = data.sort_order
    }
    if (Object.prototype.hasOwnProperty.call(data, "is_visible")) {
      payload.is_visible = data.is_visible
    }
    if (Object.prototype.hasOwnProperty.call(data, "starts_at")) {
      payload.starts_at = data.starts_at ? new Date(data.starts_at) : null
    }
    if (Object.prototype.hasOwnProperty.call(data, "ends_at")) {
      payload.ends_at = data.ends_at ? new Date(data.ends_at) : null
    }

    return await this.updateHomeHeroBanners(payload)
  }

  async deleteBanner(id: string) {
    await this.deleteHomeHeroBanners(id)
  }
}

export default HomeHeroBannerService
