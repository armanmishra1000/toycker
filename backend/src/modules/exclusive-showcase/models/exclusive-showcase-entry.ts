import { model } from "@medusajs/framework/utils"

const ExclusiveShowcaseEntry = model
  .define("exclusive_showcase_entry", {
    id: model.text().primaryKey(),
    product_id: model
      .text()
      .index("IDX_exclusive_showcase_product_id")
      .unique("UQ_exclusive_showcase_product_id"),
    video_url: model.text(),
    video_key: model.text(),
    poster_url: model.text().nullable(),
    sort_order: model.number().default(0).index("IDX_exclusive_showcase_sort_order"),
    is_active: model.boolean().default(true).index("IDX_exclusive_showcase_is_active"),
  })
  .indexes([
    {
      on: ["product_id", "is_active"],
      name: "IDX_exclusive_showcase_product_active",
    },
  ])

export default ExclusiveShowcaseEntry
