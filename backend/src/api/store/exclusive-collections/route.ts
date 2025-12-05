import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import ExclusiveShowcaseService from "../../../modules/exclusive-showcase/service"
import { EXCLUSIVE_SHOWCASE_MODULE } from "../../../modules/exclusive-showcase"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const showcaseService = req.scope.resolve<ExclusiveShowcaseService>(EXCLUSIVE_SHOWCASE_MODULE)

  const entries = await showcaseService.listExclusiveShowcaseEntries(
    {
      is_active: true,
    },
    {
      order: {
        sort_order: "ASC",
        created_at: "ASC",
      },
    },
  )

  const payload = entries.map((entry) => ({
    id: entry.id,
    product_id: entry.product_id,
    video_url: entry.video_url,
    poster_url: entry.poster_url ?? null,
    sort_order: entry.sort_order,
  }))

  res.json({ entries: payload })
}
