import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PayUWebhookPayload } from "../../../modules/payment-payu/types"
import { verifyPayUWebhash } from "../../../modules/payment-payu/utils"
import { PAYU_STATUS_MAP } from "../../../modules/payment-payu/constants"
import { parse as queryParse } from "querystring"

// Disable authentication for PayU webhook (server-to-server)
// PayU sends webhooks without x-publishable-api-key header
export const AUTHENTICATE = false

/**
 * PayU Webhook Endpoint
 *
 * Receives server-to-server webhooks from PayU after payment completion.
 * This ensures reliable payment status updates even if browser redirect fails.
 *
 * PayU sends form data (application/x-www-form-urlencoded) with transaction details.
 *
 * IMPORTANT: This route requires preserveRawBody middleware configuration.
 * Add to src/api/middlewares.ts:
 * {
 *   method: ["POST"],
 *   bodyParser: { preserveRawBody: true },
 *   matcher: "/store/payu-webhook",
 * }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    // Parse form data from raw body (PayU sends application/x-www-form-urlencoded)
    const parsedBody = queryParse(req.rawBody || "")
    // Convert ParsedUrlQuery to Record<string, string> (PayU sends single values)
    const webhookData: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsedBody)) {
      const stringValue = Array.isArray(value) ? value[0] : value
      if (stringValue !== undefined) {
        webhookData[key] = stringValue
      }
    }

    logger.info(`[PayU Webhook] Received webhook: txnid=${webhookData.txnid}, status=${webhookData.status}, amount=${webhookData.amount}`)

    // Get PayU provider options to access merchant key and salt
    // Provider is registered with key "pp_payu" (pp_ + identifier)
    const payuProvider = req.scope.resolve("pp_payu") as { options_: { merchantKey: string; merchantSalt: string } }
    const merchantKey = payuProvider.options_.merchantKey
    const merchantSalt = payuProvider.options_.merchantSalt

    // Create PayUWebhookPayload for hash verification
    // Note: key is added from merchant options (not in webhook data)
    const webhookPayload: PayUWebhookPayload = {
      key: merchantKey,
      txnid: webhookData.txnid || "",
      mihpayid: webhookData.mihpayid || "",
      status: webhookData.status || "",
      amount: webhookData.amount || "",
      hash: webhookData.hash || "",
      productinfo: webhookData.productinfo || "",
      firstname: webhookData.firstname || "",
      email: webhookData.email || "",
      phone: webhookData.phone || "",
      udf1: webhookData.udf1,
      udf2: webhookData.udf2,
      udf3: webhookData.udf3,
      udf4: webhookData.udf4,
      udf5: webhookData.udf5,
    }

    // Verify webhook hash for security
    const isValid = verifyPayUWebhash(webhookPayload, merchantSalt)

    if (!isValid) {
      logger.error("[PayU Webhook] Invalid webhook signature")
      return res.status(401).json({ message: "Invalid webhook signature" })
    }

    // Map PayU status to Medusa payment status
    const medusaStatus = PAYU_STATUS_MAP[webhookData.status] || "pending"

    logger.info(`[PayU Webhook] Status mapped: ${webhookData.status} -> ${medusaStatus}`)

    // Find the payment session by transaction ID (txnid stored in data)
    const paymentSessions = await query.graph({
      entity: "payment_session",
      fields: ["id", "data", "cart"],
      filters: {
        data: {
          transactionId: webhookData.txnid,
        },
      },
    })

    if (!paymentSessions.data || paymentSessions.data.length === 0) {
      logger.error(`[PayU Webhook] Payment session not found for txnid: ${webhookData.txnid}`)
      return res.status(404).json({ message: "Payment session not found" })
    }

    const paymentSession = paymentSessions.data[0] as unknown as {
      id: string
      data: Record<string, unknown>
      cart: { id: string }
    }

    // Get payment module service
    const paymentModuleService = req.scope.resolve("paymentModuleService") as {
      updatePaymentSession(data: {
        id: string
        data: Record<string, unknown>
      }): Promise<{ id: string }>
    }

    // Update payment session data with PayU response
    const updatedData = {
      ...paymentSession.data,
      status: medusaStatus,
      mihpayid: webhookData.mihpayid,
      payuStatus: webhookData.status,
    }

    await paymentModuleService.updatePaymentSession({
      id: paymentSession.id,
      data: updatedData,
    })

    logger.info(`[PayU Webhook] Payment session updated: sessionId=${paymentSession.id}, cartId=${paymentSession.cart.id}, status=${medusaStatus}`)

    return res.status(200).json({ message: "Webhook received" })
  } catch (error) {
    logger.error(`[PayU Webhook] Error processing webhook: ${error}`)
    return res.status(500).json({ message: "Internal server error" })
  }
}

/**
 * GET endpoint for webhook verification
 * PayU may send a GET request to verify the webhook URL
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.status(200).json({ status: "webhook_active" })
}
