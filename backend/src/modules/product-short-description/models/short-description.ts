import { model } from "@medusajs/framework/utils"

const ShortDescription = model.define("short_description", {
  id: model.id().primaryKey(),
  value: model.text().nullable(),
})

export default ShortDescription
