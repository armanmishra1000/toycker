import { Module } from "@medusajs/framework/utils"

import ProductMultiCollectionService from "./service"

export const PRODUCT_MULTI_COLLECTION_MODULE = "productMultiCollectionModule"

export default Module(PRODUCT_MULTI_COLLECTION_MODULE, {
  service: ProductMultiCollectionService,
})
