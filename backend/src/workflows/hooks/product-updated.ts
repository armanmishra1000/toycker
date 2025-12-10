import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

import {
  UpdateShortDescriptionFromProductInput,
  updateShortDescriptionFromProductWorkflow,
} from "../update-short-description-from-product"

updateProductsWorkflow.hooks.productsUpdated(async ({ products, additional_data }, { container }) => {
  const workflow = updateShortDescriptionFromProductWorkflow(container)

  for (const product of products) {
    await workflow.run({
      input: {
        product,
        additional_data,
      } as UpdateShortDescriptionFromProductInput,
    })
  }
})
