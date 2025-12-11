import { model } from "@medusajs/framework/utils"

const RewardSetting = model.define("reward_setting", {
  id: model.id().primaryKey(),
  earn_rate_bps: model.number().default(500),
  updated_by: model.text().nullable(),
})

export default RewardSetting
