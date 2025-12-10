import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

import {
  CreateShortDescriptionFromProductInput,
  createShortDescriptionFromProductWorkflow,
} from "../create-short-description-from-product"

createProductsWorkflow.hooks.productsCreated(async ({ products, additional_data }, { container }) => {
  const workflow = createShortDescriptionFromProductWorkflow(container)

  for (const product of products) {
    await workflow.run({
      input: {
        product,
        additional_data,
      } as CreateShortDescriptionFromProductInput,
    })
  }
})
