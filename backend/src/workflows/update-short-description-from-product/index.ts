import { Modules } from "@medusajs/framework/utils"
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import {
  createWorkflow,
  when,
  WorkflowResponse,
} from "@medusajs/workflows-sdk"
import { ProductDTO } from "@medusajs/types"

import { PRODUCT_SHORT_DESCRIPTION_MODULE } from "../../modules/product-short-description"
import { createShortDescriptionStep } from "../create-short-description-from-product/steps/create-short-description"
import { deleteShortDescriptionStep } from "./steps/delete-short-description"
import { updateShortDescriptionStep } from "./steps/update-short-description"

export type UpdateShortDescriptionFromProductInput = {
  product: ProductDTO
  additional_data?: {
    short_description?: string | null
  }
}

export const updateShortDescriptionFromProductWorkflow = createWorkflow(
  "update-short-description-from-product",
  (input: UpdateShortDescriptionFromProductInput) => {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["short_description.*"],
      filters: {
        id: input.product.id,
      },
    })

    const existing = products?.[0]?.short_description as
      | { id: string; value: string | null }
      | undefined

    const createNeeded = when(
      "create-product-short-description",
      { input, existing },
      ({ input, existing }) =>
        !existing && Boolean(input.additional_data?.short_description?.trim())
    ).then(() => {
      const created = createShortDescriptionStep({
        value: input.additional_data?.short_description ?? undefined,
      })

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

      return created
    })

    const deleteNeeded = when(
      "delete-product-short-description",
      { input, existing },
      ({ input, existing }) =>
        Boolean(existing) &&
        (input.additional_data?.short_description === null ||
          input.additional_data?.short_description === "")
    ).then(() => {
      if (!existing) {
        return undefined
      }

      deleteShortDescriptionStep({ id: existing.id })
      dismissRemoteLinkStep({
        [PRODUCT_SHORT_DESCRIPTION_MODULE]: {
          short_description_id: existing.id,
        },
      })

      return existing.id
    })

    const updateNeeded = when(
      "update-product-short-description",
      { input, existing },
      ({ input, existing }) =>
        Boolean(existing) && Boolean(input.additional_data?.short_description?.trim())
    ).then(() => {
      if (!existing || !input.additional_data?.short_description) {
        return undefined
      }

      return updateShortDescriptionStep({
        id: existing.id,
        value: input.additional_data.short_description,
      })
    })

    return new WorkflowResponse({ createNeeded, updateNeeded, deleteNeeded })
  }
)
