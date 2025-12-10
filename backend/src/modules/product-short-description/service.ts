import { MedusaService } from "@medusajs/framework/utils"

import ShortDescription from "./models/short-description"

class ShortDescriptionService extends MedusaService({
  ShortDescription,
}) {}

export default ShortDescriptionService
