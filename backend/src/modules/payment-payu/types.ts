import { BigNumberInput, PaymentSessionStatus } from "@medusajs/framework/types"

// Provider configuration options
export type PayUOptions = {
  merchantKey: string
  merchantSalt: string
  environment: "test" | "production"
  webhookSecret?: string
}

// PayU transaction data stored in payment session
export type PayUTransactionData = {
  transactionId: string
  payment_url?: string
  hash?: string
  params?: Record<string, string>
  status?: PaymentSessionStatus
  mihpayid?: string      // PayU payment ID from webhook response
  payuStatus?: string    // Original PayU status (success/failure/pending)
}

// PayU API request types
export type PayUPaymentRequest = {
  key: string
  txnid: string
  amount: string
  productinfo: string
  firstname: string
  email: string
  phone: string
  surl: string
  furl: string
  hash: string
  udf1?: string
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
}

// PayU API response types
export type PayUAPIResponse = {
  status: number
  message: string
  mihpayid?: string
  txnid?: string
  amount?: string
  bankcode?: string
}

// PayU webhook payload type
export type PayUWebhookPayload = {
  key: string         // Merchant key (not in webhook, added from options)
  txnid: string
  mihpayid: string
  status: string
  amount: string
  hash: string
  productinfo: string
  firstname: string
  email: string
  phone: string
  udf1?: string
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
}
