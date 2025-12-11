import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = resolveCustomerId(req)

  if (!customerId) {
    res.status(401).json({ message: "Login required" })
    return
  }

  const rewardService = req.scope.resolve<RewardService>(REWARDS_MODULE)
  const balance = await rewardService.getBalance(customerId)

  res.json({ balance })
}
