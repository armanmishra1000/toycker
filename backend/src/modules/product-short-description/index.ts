import { Module } from "@medusajs/framework/utils"

import ShortDescriptionService from "./service"

export const PRODUCT_SHORT_DESCRIPTION_MODULE = "productShortDescriptionModule"

export default Module(PRODUCT_SHORT_DESCRIPTION_MODULE, {
  service: ShortDescriptionService,
})
