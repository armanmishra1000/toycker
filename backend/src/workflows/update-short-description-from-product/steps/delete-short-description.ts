import { createStep, StepResponse } from "@medusajs/workflows-sdk"

import ShortDescriptionService from "../../../modules/product-short-description/service"
import { PRODUCT_SHORT_DESCRIPTION_MODULE } from "../../../modules/product-short-description"

type DeleteShortDescriptionInput = {
  id: string
}

export const deleteShortDescriptionStep = createStep(
  "delete-short-description",
  async ({ id }: DeleteShortDescriptionInput, { container }) => {
    const service: ShortDescriptionService = container.resolve(
      PRODUCT_SHORT_DESCRIPTION_MODULE
    )

    const existing = await service.retrieveShortDescription(id)
    await service.deleteShortDescriptions(id)

    return new StepResponse(existing, existing)
  },
  async (existing, { container }) => {
    if (!existing) {
      return
    }

    const service: ShortDescriptionService = container.resolve(
      PRODUCT_SHORT_DESCRIPTION_MODULE
    )

    await service.createShortDescriptions(existing)
  }
)
