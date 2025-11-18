import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import sql from "../../sql"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    await sql`select 1` // ensures database connectivity before reporting healthy

    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unhealthy"

    res.status(503).json({
      status: "error",
      message,
    })
  }
}
