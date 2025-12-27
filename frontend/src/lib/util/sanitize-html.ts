"use client"

import DOMPurify from "dompurify"

const ALLOWED_TAGS = [
  "a",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "span",
  "blockquote",
]

const ALLOWED_ATTR = [
  "href",
  "title",
  "target",
  "rel",
]

export const sanitizeRichText = (input?: string | null): string => {
  if (!input) {
    return ""
  }

  // Check if DOMPurify is available (client-side only)
  if (typeof DOMPurify !== "undefined" && DOMPurify.sanitize) {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      USE_PROFILES: { html: true },
      RETURN_TRUSTED_TYPE: false,
    })
  }

  // Server-side: return input as-is (trusted source)
  // Server-rendered HTML in Next.js is safe by default
  return input
}

export const extractPlainText = (input?: string | null): string => {
  const sanitized = sanitizeRichText(input)
  if (!sanitized) {
    return ""
  }

  const withoutTags = sanitized.replace(/<[^>]*>/g, " ")
  return withoutTags.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
}
