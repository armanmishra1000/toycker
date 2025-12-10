import { createStep, StepResponse } from "@medusajs/workflows-sdk"

import ShortDescriptionService from "../../../modules/product-short-description/service"
import { PRODUCT_SHORT_DESCRIPTION_MODULE } from "../../../modules/product-short-description"

type CreateShortDescriptionInput = {
  value?: string | null
}

export const createShortDescriptionStep = createStep(
  "create-short-description",
  async (data: CreateShortDescriptionInput, { container }) => {
    const normalized = data.value?.trim()

    if (!normalized) {
      return
    }

    const service: ShortDescriptionService = container.resolve(
      PRODUCT_SHORT_DESCRIPTION_MODULE
    )

    const created = await service.createShortDescriptions({ value: normalized })

    return new StepResponse(created, created)
  },
  async (created, { container }) => {
    if (!created) {
      return
    }

    const service: ShortDescriptionService = container.resolve(
      PRODUCT_SHORT_DESCRIPTION_MODULE
    )

    await service.deleteShortDescriptions(created.id)
  }
)
