import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

import RewardService from "../../../../modules/rewards/service"
import { REWARDS_MODULE } from "../../../../modules/rewards"

type AuthContext = {
  actor_id?: string
  actor_type?: string
}

const resolveCustomerId = (req: MedusaRequest) => {
  const auth = (req as MedusaRequest & { auth?: AuthContext }).auth
  if (auth?.actor_type === "customer" && auth.actor_id) {
    return auth.actor_id
  }
  return null
}

const querySchema = z.object({
  limit: z.preprocess((v) => Number(v), z.number().int().positive().max(100)).default(20),
  offset: z.preprocess((v) => Number(v), z.number().int().nonnegative()).default(0),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = resolveCustomerId(req)

  if (!customerId) {
    res.status(401).json({ message: "Login required" })
    return
  }

  const parsed = querySchema.safeParse(req.query ?? {})
  const pagination = parsed.success ? parsed.data : { limit: 20, offset: 0 }

  const rewardService = req.scope.resolve<RewardService>(REWARDS_MODULE)
  const history = await rewardService.listHistory(customerId, {
    limit: pagination.limit,
    offset: pagination.offset,
  })

  res.json({ history })
}
