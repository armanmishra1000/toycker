import crypto from "crypto"
import { BigNumberInput } from "@medusajs/framework/types"
import { PayUWebhookPayload } from "./types"
import { Logger } from "@medusajs/framework/types"

/**
 * Generate SHA-512 hash for PayU payment requests.
 *
 * PayU Hash Format (VERIFIED via hash investigation):
 * sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||||||salt)
 *
 * IMPORTANT: Despite official documentation showing 10 empty fields after email,
 * actual PayU implementation requires 12 empty fields (5 UDFs + 7 additional).
 *
 * Reference: https://docs.payu.in/docs/generate-hash-merchant-hosted
 *
 * @param params - Payment parameters including key, txnid, amount, productinfo, firstname, email
 * @param salt - Merchant salt key
 * @param logger - Optional logger for debug output
 * @returns SHA-512 hex hash string (128 characters)
 */
export function generatePayUHash(
  params: Record<string, string>,
  salt: string,
  logger?: Logger
): string {
  // Extract UDF parameters (default to empty strings if not provided)
  const udf1 = params.udf1 || ""
  const udf2 = params.udf2 || ""
  const udf3 = params.udf3 || ""
  const udf4 = params.udf4 || ""
  const udf5 = params.udf5 || ""

  // Construct hash string with exact parameter sequence per PayU
  // Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||||||salt
  //
  // IMPORTANT: PayU requires 5 empty fields after UDF5 (udf6-udf10) if not used.
  // Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
  const hashString = [
    params.key,
    params.txnid,
    params.amount,
    params.productinfo,
    params.firstname,
    params.email,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    "", "", "", "", "", // 5 empty fields for udf6-udf10
    salt,
  ].join("|")

  // Log the FULL hash string before hashing for debugging
  // Note: Salt is masked in logs for security
  if (logger) {
    const maskedHashString = hashString.replace(salt, "****")
    logger.info(`[PayU] Hash string (PRE-HASH): ${maskedHashString}`)
  }

  // Generate SHA-512 hash
  const hash = crypto.createHash("sha512").update(hashString).digest("hex")

  // Verify hash length is 128 characters (SHA-512 = 64 bytes = 128 hex chars)
  if (hash.length !== 128) {
    throw new Error(`Invalid hash length: ${hash.length}. Expected 128.`)
  }

  if (logger) {
    logger.info(`[PayU] Generated SHA-512 hash: ${hash.substring(0, 20)}...${hash.substring(108)} (length: ${hash.length})`)
  }

  return hash
}

// Verify PayU webhook hash
export function verifyPayUWebhash(
  payload: PayUWebhookPayload,
  salt: string
): boolean {
  // Verify hash format: sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
  const hashString = [
    salt,
    payload.status,
    "", "", "", "", "", // empty fields
    "", "", "", "", "", // udf5-1 (reversed)
    payload.email,
    payload.firstname,
    payload.productinfo,
    payload.amount,
    payload.txnid,
  ].join("|")

  const calculatedHash = crypto
    .createHash("sha512")
    .update(hashString)
    .digest("hex")
  return calculatedHash === payload.hash
}

// Convert amount to PayU format (2 decimal places)
export function formatAmount(amount: BigNumberInput): string {
  return Number(amount).toFixed(2)
}
