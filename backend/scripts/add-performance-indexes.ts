import { loadEnv } from "@medusajs/framework/utils"
import postgres from "postgres"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = postgres(connectionString)

const statements: Array<{ table: string; sql: string }> = [
  // Cart and line items
  { table: "line_item", sql: "CREATE INDEX IF NOT EXISTS idx_line_item_cart_id ON line_item (cart_id)" },
  { table: "line_item", sql: "CREATE INDEX IF NOT EXISTS idx_line_item_variant_id ON line_item (variant_id)" },

  // Products and variants
  { table: "product", sql: "CREATE INDEX IF NOT EXISTS idx_product_handle ON product (handle)" },
  { table: "product", sql: "CREATE INDEX IF NOT EXISTS idx_product_collection_id ON product (collection_id)" },
  { table: "product_variant", sql: "CREATE INDEX IF NOT EXISTS idx_product_variant_product_id ON product_variant (product_id)" },

  // Money amounts (pricing lookups by variant and currency)
  {
    table: "money_amount",
    sql: "CREATE INDEX IF NOT EXISTS idx_money_amount_variant_currency ON money_amount (variant_id, currency_code)",
  },

  // Collections to products mapping
  {
    table: "product_collection_product",
    sql: "CREATE INDEX IF NOT EXISTS idx_product_collection_product_collection_id ON product_collection_product (product_collection_id)",
  },
  {
    table: "product_collection_product",
    sql: "CREATE INDEX IF NOT EXISTS idx_product_collection_product_product_id ON product_collection_product (product_id)",
  },
]

async function main() {
  for (const entry of statements) {
    const exists = await sql<{ exists: string | null }[]>`SELECT to_regclass(${"public." + entry.table}) as exists`;
    if (!exists[0]?.exists) {
      // eslint-disable-next-line no-console
      console.warn(`Skipping index creation for missing table: ${entry.table}`)
      continue
    }

    await sql.unsafe(entry.sql)
  }

  await sql.end({ timeout: 5 })
  // eslint-disable-next-line no-console
  console.log("Performance indexes ensured.")
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to create performance indexes", error)
  process.exit(1)
})
