import { Modules } from "@medusajs/framework/utils"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import {
  createWorkflow,
  when,
  transform,
  WorkflowResponse,
} from "@medusajs/workflows-sdk"
import { ProductDTO } from "@medusajs/types"

import { PRODUCT_SHORT_DESCRIPTION_MODULE } from "../../modules/product-short-description"
import { createShortDescriptionStep } from "./steps/create-short-description"

export type CreateShortDescriptionFromProductInput = {
  product: ProductDTO
  additional_data?: {
    short_description?: string
  }
}

export const createShortDescriptionFromProductWorkflow = createWorkflow(
  "create-short-description-from-product",
  (input: CreateShortDescriptionFromProductInput) => {
    const shortDescription = transform({ input }, (data) =>
      data.input.additional_data?.short_description ?? ""
    )

    const created = createShortDescriptionStep({ value: shortDescription })

    when({ created }, ({ created }) => Boolean(created)).then(() => {
      createRemoteLinkStep([
        {
          [Modules.PRODUCT]: {
            product_id: input.product.id,
          },
          [PRODUCT_SHORT_DESCRIPTION_MODULE]: {
            short_description_id: created.id,
          },
        },
      ])
    })

    return new WorkflowResponse({ created })
  }
)
