import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ShortDescriptionModule from "../modules/product-short-description"

export default defineLink(
  ProductModule.linkable.product,
  ShortDescriptionModule.linkable.shortDescription
)
