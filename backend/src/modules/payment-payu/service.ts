import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  PaymentSessionStatus,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { Logger } from "@medusajs/framework/types"

import { PAYU_API_ENDPOINTS, PAYU_WEBHOOK_ACTIONS } from "./constants"
import { formatAmount, generatePayUHash, verifyPayUWebhash } from "./utils"
import { PayUOptions, PayUTransactionData, PayUWebhookPayload } from "./types"

type InjectedDependencies = {
  logger: Logger
}

class PayUProviderService extends AbstractPaymentProvider<PayUOptions> {
  static identifier = "payu"
  protected logger_: Logger
  protected options_: PayUOptions

  constructor(container: InjectedDependencies, options: PayUOptions) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.merchantKey) {
      throw new Error("PayU merchantKey is required")
    }
    if (!options.merchantSalt) {
      throw new Error("PayU merchantSalt is required")
    }
    if (options.environment !== "test" && options.environment !== "production") {
      throw new Error("PayU environment must be 'test' or 'production'")
    }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const data = input.data as PayUTransactionData

    // For PayU hosted checkout, status comes from webhook
    // Default to pending if not yet authorized
    return {
      status: data.status || "pending",
      data,
    }
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, context, data: inputData } = input

    this.logger_.info(`[PayU] ========================================`)
    this.logger_.info(`[PayU] initiatePayment called`)
    this.logger_.info(`[PayU] Amount: ${amount}`)
    this.logger_.info(`[PayU] Has customer: ${!!context?.customer}`)
    this.logger_.info(`[PayU] Has input data: ${!!inputData}`)

    if (!context) {
      throw new Error("Payment context is required")
    }

    // Extract customer information from customer object
    const customer = context.customer
    let email = customer?.email || ""
    let firstName = customer?.first_name || "Guest"
    let phone = customer?.phone || ""

    // Check if additional data is provided (from frontend for guest checkout)
    let cartId = ""
    if (inputData && typeof inputData === "object") {
      const dataRecord = inputData as Record<string, unknown>
      const dataEmail = dataRecord.email as string | undefined
      const dataPhone = dataRecord.phone as string | undefined
      const dataFirstName = dataRecord.first_name as string | undefined
      const dataCartId = dataRecord.cart_id as string | undefined

      if (dataEmail) email = dataEmail
      if (dataFirstName) firstName = dataFirstName
      if (dataPhone) phone = dataPhone
      cartId = dataCartId || ""
    }

    this.logger_.info(`[PayU] Customer info - Email: ${email}, Firstname: ${firstName}, Phone: ${phone}`)

    // For test environment, provide default values if not set
    if (!email) {
      this.logger_.warn("[PayU] Email not provided, using test email")
      email = "test@example.com"
    }
    if (!phone) {
      this.logger_.warn("[PayU] Phone not provided, using test phone")
      phone = "9999999999"
    }

    // Generate unique transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`

    this.logger_.info(`[PayU] Generated transaction ID: ${transactionId}`)

    // Build payment params for hash generation (excluding URL-only params)
    const hashParams = {
      key: this.options_.merchantKey,
      txnid: transactionId,
      amount: formatAmount(amount),
      productinfo: `Order payment`,
      firstname: firstName,
      email: email,
      udf1: cartId,
    }

    // Generate hash using official PayU format
    const hash = generatePayUHash(hashParams, this.options_.merchantSalt, this.logger_)

    // Build full payment params for URL (includes phone, surl, furl, hash)
    const urlParams = {
      ...hashParams,
      phone: phone,
      surl: `${process.env.STORE_URL}/api/payu/callback`,
      furl: `${process.env.STORE_URL}/api/payu/callback`,
      hash: hash,
    }

    // Return payment session data with params for form submission (POST required)
    // PayU Hosted Checkout requires POST request, not GET redirect
    return {
      id: transactionId,
      data: {
        transactionId,
        payment_url: PAYU_API_ENDPOINTS[this.options_.environment],
        params: urlParams,
      } as PayUTransactionData,
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    // For PayU, authorization happens via webhook after redirect
    // Return authorized if webhook has confirmed payment
    const data = input.data as PayUTransactionData

    if (data.status === "captured") {
      return { data, status: "captured" }
    }

    // Still pending customer completion
    return { data, status: "pending" }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    // PayU auto-captures on successful payment
    // This is mainly for consistency with the interface
    return { data: input.data }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    // For basic prototype, just mark as refunded
    // In production, would call PayU refund API
    return { data: input.data }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    // For basic prototype, just mark as canceled
    // In production, would call PayU cancel API if supported
    return { data: input.data }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    // For PayU, we return the stored data since hosted checkout
    // doesn't have a retrieve API in the basic integration
    return { data: input.data as PayUTransactionData }
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    // Re-initiate with new amount
    return this.initiatePayment(input)
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const { rawData } = payload

    // Safely cast rawData to PayUWebhookPayload
    const webhookData =
      typeof rawData === "string"
        ? (JSON.parse(rawData) as PayUWebhookPayload)
        : (rawData as unknown as PayUWebhookPayload)

    // Verify webhook hash (add merchant key to payload for verification)
    if (this.options_.webhookSecret) {
      const payloadWithKey: PayUWebhookPayload = {
        ...webhookData,
        key: this.options_.merchantKey,
      }
      const isValid = verifyPayUWebhash(payloadWithKey, this.options_.merchantSalt)
      if (!isValid) {
        throw new Error("Invalid webhook signature")
      }
    }

    const action = PAYU_WEBHOOK_ACTIONS[webhookData.status] || "not_supported"

    return {
      action,
      data: {
        session_id: webhookData.txnid,
        amount: webhookData.amount,
      },
    }
  }
}

export default PayUProviderService
