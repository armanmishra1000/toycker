import { Module } from "@medusajs/framework/utils"

import ExclusiveShowcaseService from "./service"

export const EXCLUSIVE_SHOWCASE_MODULE = "exclusiveShowcaseModule"

export default Module(EXCLUSIVE_SHOWCASE_MODULE, {
  service: ExclusiveShowcaseService,
})
