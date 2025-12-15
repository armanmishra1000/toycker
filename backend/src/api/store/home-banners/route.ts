import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import HomeHeroBannerService from "../../../modules/home-hero/service"
import { HOME_HERO_BANNER_MODULE } from "../../../modules/home-hero"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bannerService = req.scope.resolve<HomeHeroBannerService>(HOME_HERO_BANNER_MODULE)

  const banners = await bannerService.listActive({
    order: {
      sort_order: "ASC",
      created_at: "ASC",
    },
  })

  const payload = banners.map((banner) => ({
    id: banner.id,
    image_url: banner.image_url,
    alt_text: banner.alt_text ?? null,
    sort_order: banner.sort_order,
    starts_at: banner.starts_at ?? null,
    ends_at: banner.ends_at ?? null,
  }))

  res.json({ banners: payload })
}
