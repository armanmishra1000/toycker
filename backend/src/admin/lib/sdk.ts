import Medusa from "@medusajs/js-sdk"

declare const __BACKEND_URL__: string | undefined

const DEFAULT_BACKEND_URL = "http://localhost:9000"

const fallbackUrl =
  typeof window !== "undefined" && window.location ? window.location.origin : DEFAULT_BACKEND_URL

const sanitizeBaseUrl = (value?: string) => {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return undefined
  }

  const normalized = trimmed.replace(/\/+$/, "")
  if (/^https?:\/\//i.test(normalized)) {
    return normalized
  }

  if (normalized.startsWith("//")) {
    return `http:${normalized}`
  }

  return `http://${normalized}`
}

const envBaseUrl = sanitizeBaseUrl(import.meta.env.VITE_MEDUSA_BACKEND_URL)
const injectedBaseUrl = sanitizeBaseUrl(
  typeof __BACKEND_URL__ !== "undefined" ? __BACKEND_URL__ : undefined,
)

export const backendBaseUrl = envBaseUrl ?? injectedBaseUrl ?? fallbackUrl

export const sdk = new Medusa({
  baseUrl: backendBaseUrl,
  debug: import.meta.env.DEV,
  auth: {
    type: "session",
  },
})
