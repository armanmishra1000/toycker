import { Module } from "@medusajs/framework/utils"

import HomeHeroBannerService from "./service"

export const HOME_HERO_BANNER_MODULE = "homeHeroBannerModule"

export default Module(HOME_HERO_BANNER_MODULE, {
  service: HomeHeroBannerService,
})
