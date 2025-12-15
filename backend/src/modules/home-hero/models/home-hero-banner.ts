import { model } from "@medusajs/framework/utils"

const HomeHeroBanner = model
  .define("home_hero_banner", {
    id: model.id().primaryKey(),
    image_url: model.text(),
    image_key: model.text(),
    alt_text: model.text().nullable(),
    sort_order: model.number().default(0).index("IDX_home_hero_banner_sort_order"),
    is_visible: model.boolean().default(true).index("IDX_home_hero_banner_is_visible"),
    starts_at: model.dateTime().nullable(),
    ends_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      name: "IDX_home_hero_banner_visibility_window",
      on: ["is_visible", "starts_at", "ends_at"],
    },
    {
      name: "IDX_home_hero_banner_starts_at",
      on: ["starts_at"],
    },
    {
      name: "IDX_home_hero_banner_ends_at",
      on: ["ends_at"],
    },
  ])

export default HomeHeroBanner
