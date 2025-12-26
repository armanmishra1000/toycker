import { defineMiddlewares } from "@medusajs/framework/http"
import { z } from "zod"

export default defineMiddlewares({
  routes: [
    {
      method: "POST",
      matcher: "/admin/products",
      additionalDataValidator: {
        short_description: z.string().optional(),
      },
    },
    {
      method: "POST",
      matcher: "/admin/products/:id",
      additionalDataValidator: {
        short_description: z.string().nullish(),
      },
    },
    {
      method: ["POST"],
      matcher: "/store/payu-webhook",
      bodyParser: { preserveRawBody: true },
    },
  ],
})
