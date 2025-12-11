import { model } from "@medusajs/framework/utils"

export type RewardTransactionType = "earn" | "redeem" | "adjust"

const RewardTransaction = model
  .define("reward_transaction", {
    id: model.id().primaryKey(),
    customer_id: model.text().index("IDX_reward_tx_customer"),
    order_id: model.text().index("IDX_reward_tx_order").nullable(),
    cart_id: model.text().index("IDX_reward_tx_cart").nullable(),
    points: model.number(),
    type: model.text().index("IDX_reward_tx_type"),
    is_confirmed: model.boolean().default(false).index("IDX_reward_tx_confirmed"),
    description: model.text().nullable(),
  })
  .indexes([
    {
      name: "IDX_reward_tx_customer_confirmed",
      on: ["customer_id", "is_confirmed"],
    },
    {
      name: "IDX_reward_tx_customer_type",
      on: ["customer_id", "type"],
    },
    {
      name: "IDX_reward_tx_deleted_at",
      on: ["deleted_at"],
    },
  ])

export default RewardTransaction
