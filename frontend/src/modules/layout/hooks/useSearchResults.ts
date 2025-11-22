"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import type { SearchResultsPayload } from "@lib/data/search"

type SearchStatus = "idle" | "loading" | "success" | "error"

type UseSearchResultsArgs = {
  countryCode?: string
  productLimit?: number
  taxonomyLimit?: number
}

export const useSearchResults = ({
  countryCode,
  productLimit = 6,
  taxonomyLimit = 5,
}: UseSearchResultsArgs) => {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [results, setResults] = useState<SearchResultsPayload | null>(null)
  const [status, setStatus] = useState<SearchStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [query])

  useEffect(() => {
    if (!debouncedQuery) {
      setResults(null)
      setStatus("idle")
      setError(null)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      return
    }

    if (!countryCode) {
      setError("Missing country context")
      setStatus("error")
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    setStatus("loading")
    setError(null)

    const params = new URLSearchParams({
      q: debouncedQuery,
      countryCode,
      productLimit: String(productLimit),
      taxonomyLimit: String(taxonomyLimit),
    })

    fetch(`/api/storefront/search?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            message?: string
          }
          throw new Error(payload.message || "Unable to fetch search results")
        }

        return response.json() as Promise<SearchResultsPayload>
      })
      .then((payload) => {
        setResults(payload)
        setStatus("success")
      })
      .catch((fetchError) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return
        }

        setError(fetchError instanceof Error ? fetchError.message : "Unexpected error")
        setStatus("error")
      })

    return () => {
      controller.abort()
    }
  }, [countryCode, debouncedQuery, productLimit, taxonomyLimit])

  const clear = () => {
    setQuery("")
    setResults(null)
    setStatus("idle")
    setError(null)
  }

  const isEmpty = useMemo(() => {
    if (!results) {
      return false
    }

    return (
      results.products.length === 0 &&
      results.categories.length === 0 &&
      results.collections.length === 0
    )
  }, [results])

  return {
    query,
    setQuery,
    clear,
    status,
    error,
    results,
    suggestions: results?.suggestions ?? [],
    hasTypedQuery: Boolean(query.trim()),
    isEmpty,
  }
}
