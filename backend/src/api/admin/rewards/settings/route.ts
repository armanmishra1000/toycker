import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

import RewardService from "../../../../modules/rewards/service"
import { REWARDS_MODULE } from "../../../../modules/rewards"

const updateSchema = z.object({
  earn_percentage: z.number().nonnegative().max(100),
})

const percentageToBps = (value: number) => Math.round(value * 100)

type AuthContext = {
  actor_id?: string
}

const resolveActorId = (req: MedusaRequest): string | undefined => {
  const auth = (req as MedusaRequest & { auth?: AuthContext }).auth
  return auth?.actor_id
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const rewardService = req.scope.resolve<RewardService>(REWARDS_MODULE)
  const settings = await rewardService.getSettings()

  res.json({
    settings,
    earn_percentage: settings.earn_rate_bps / 100,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues })
    return
  }

  const rewardService = req.scope.resolve<RewardService>(REWARDS_MODULE)
  const updated = await rewardService.updateSettings(
    percentageToBps(parsed.data.earn_percentage),
    resolveActorId(req),
  )

  res.json({
    settings: updated,
    earn_percentage: updated.earn_rate_bps / 100,
  })
}
