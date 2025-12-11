import { Module } from "@medusajs/framework/utils"

import RewardService from "./service"

export const REWARDS_MODULE = "rewardsModule"

export default Module(REWARDS_MODULE, {
  service: RewardService,
})
