import { createStep, StepResponse } from "@medusajs/workflows-sdk"

import ShortDescriptionService from "../../../modules/product-short-description/service"
import { PRODUCT_SHORT_DESCRIPTION_MODULE } from "../../../modules/product-short-description"

type UpdateShortDescriptionInput = {
  id: string
  value: string
}

export const updateShortDescriptionStep = createStep(
  "update-short-description",
  async ({ id, value }: UpdateShortDescriptionInput, { container }) => {
    const normalized = value.trim()
    const service: ShortDescriptionService = container.resolve(
      PRODUCT_SHORT_DESCRIPTION_MODULE
    )

    const previous = await service.retrieveShortDescription(id)
    const updated = await service.updateShortDescriptions({ id, value: normalized })

    return new StepResponse(updated, previous)
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const service: ShortDescriptionService = container.resolve(
      PRODUCT_SHORT_DESCRIPTION_MODULE
    )

    await service.updateShortDescriptions(previous)
  }
)
