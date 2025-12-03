import { model } from "@medusajs/framework/utils"

const ProductMultiCollection = model
  .define("product_multi_collection", {
    id: model.id().primaryKey(),
    product_id: model.text().index("IDX_product_multi_collection_product_id"),
    collection_id: model.text().index("IDX_product_multi_collection_collection_id"),
  })
  .indexes([
    {
      on: ["product_id", "collection_id"],
      unique: true,
      name: "UQ_product_multi_collection_unique_pair",
    },
  ])

export default ProductMultiCollection
