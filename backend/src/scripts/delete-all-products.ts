import { ExecArgs } from "@medusajs/framework/types"

const DEFAULT_BATCH_SIZE = Number(process.env.DELETE_PRODUCTS_BATCH_SIZE) || 100

export default async function deleteAllProducts({
  container,
  args = [],
}: ExecArgs) {
  const productModuleService = container.resolve("product")
  const dryRun = args?.includes("--dry-run") || args?.includes("-d")
  const batchSize = Math.max(1, DEFAULT_BATCH_SIZE)

  let offset = 0
  let totalDeleted = 0

  console.log(
    dryRun
      ? "[delete-products] Running in dry-run mode. No products will be deleted."
      : "[delete-products] Deleting products in batches..."
  )

  while (true) {
    const [products, count] = await productModuleService.listAndCountProducts(
      {},
      {
        select: ["id", "handle", "title"],
        skip: offset,
        take: batchSize,
        order: { created_at: "ASC" },
      }
    )

    if (!products.length) {
      break
    }

    const ids = products.map((product) => product.id)

    if (!dryRun) {
      await productModuleService.deleteProducts(ids)
    }

    offset += ids.length
    totalDeleted += ids.length

    console.log(
      `[delete-products] ${dryRun ? "Would delete" : "Deleted"} ${totalDeleted}/${count} products...`
    )
  }

  if (totalDeleted === 0) {
    console.log("[delete-products] No products found.")
    return
  }

  console.log(
    dryRun
      ? `[delete-products] Dry run complete. ${totalDeleted} product(s) would be deleted.`
      : `[delete-products] Finished deleting ${totalDeleted} product(s).`
  )
}
