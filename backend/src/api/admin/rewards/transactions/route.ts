import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "zod"
import type { ICustomerModuleService } from "@medusajs/types"

import RewardService from "../../../../modules/rewards/service"
import { REWARDS_MODULE } from "../../../../modules/rewards"

const querySchema = z.object({
  limit: z.preprocess((v) => Number(v), z.number().int().positive().max(100)).default(25),
  offset: z.preprocess((v) => Number(v), z.number().int().nonnegative()).default(0),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parsed = querySchema.safeParse(req.query ?? {})
  const pagination = parsed.success ? parsed.data : { limit: 25, offset: 0 }

  const rewardService = req.scope.resolve<RewardService>(REWARDS_MODULE)
  const customerService = req.scope.resolve<ICustomerModuleService>(Modules.CUSTOMER)

  const transactions = await rewardService.listRewardTransactions(
    {},
    {
      order: {
        created_at: "DESC",
      },
      take: pagination.limit,
      skip: pagination.offset,
    },
  )

  const customerIds = Array.from(
    new Set(
      transactions
        .map((tx) => tx.customer_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  )
  const customers = customerIds.length
    ? await customerService.listCustomers({ id: customerIds }, { select: ["id", "email", "first_name", "last_name"] })
    : []

  const customerMap = new Map(customers.map((customer) => [customer.id, customer]))

  const enriched = transactions.map((tx) => ({
    ...tx,
    customer: customerMap.get(tx.customer_id) ?? null,
  }))

  res.json({ transactions: enriched })
}
