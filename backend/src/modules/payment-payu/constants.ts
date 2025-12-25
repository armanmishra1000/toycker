// PayU API endpoints for India
export const PAYU_API_ENDPOINTS = {
  test: "https://test.payu.in/_payment",
  production: "https://payu.in/_payment",
} as const

// PayU status codes to Medusa payment status mapping
export const PAYU_STATUS_MAP: Record<
  string,
  "pending" | "authorized" | "captured" | "canceled" | "refunded"
> = {
  pending: "pending",
  in_progress: "pending",
  success: "captured",
  failure: "canceled",
  pending_billing: "authorized",
  user_intervention: "pending",
}

// Webhook action mappings
export const PAYU_WEBHOOK_ACTIONS: Record<
  string,
  "authorized" | "captured" | "canceled" | "failed"
> = {
  success: "captured",
  failure: "canceled",
  pending: "authorized",
}
