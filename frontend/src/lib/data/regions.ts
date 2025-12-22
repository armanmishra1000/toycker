"use server"

import { sdk } from "@lib/config"
import { DEFAULT_COUNTRY_CODE, DEFAULT_REGION_ID } from "@lib/constants/region"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

let cachedRegion: HttpTypes.StoreRegion | null = null

export const retrieveRegion = async (id: string) => {
  const next = {
    ...(await getCacheOptions(["regions", id].join("-"), { globalTag: "regions" })),
  }

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ region }) => region)
    .catch(medusaError)
}

const loadDefaultRegion = async (forceRefresh?: boolean) => {
  if (cachedRegion && !forceRefresh) {
    return cachedRegion
  }

  if (DEFAULT_REGION_ID) {
    cachedRegion = await retrieveRegion(DEFAULT_REGION_ID)
    return cachedRegion
  }

  try {
    const next = {
      ...(await getCacheOptions("regions")),
    }

    const fallbackRegion = await sdk.client
      .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
        method: "GET",
        cache: "force-cache",
        next,
      })
      .then(({ regions }) => regions?.[0])
      .catch(medusaError)

    if (!fallbackRegion) {
      throw new Error("No regions available to use as default in backend response.")
    }

    cachedRegion = fallbackRegion
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "NEXT_PUBLIC_DEFAULT_REGION_ID not set. Falling back to the first available region."
      )
    }
    return cachedRegion
  } catch (error: any) {
    console.error("Critical: Failed to load default region.", error.message)
    throw new Error(
      `Failed to load region data: ${error.message}. Please check NEXT_PUBLIC_MEDUSA_BACKEND_URL and your backend regions configuration.`
    )
  }
}

export const listRegions = async () => {
  const region = await loadDefaultRegion()
  return region ? [region] : []
}

type GetRegionOptions = {
  forceRefresh?: boolean
}

export const getRegion = async (_countryCode?: string, options?: GetRegionOptions) => {
  try {
    return await loadDefaultRegion(options?.forceRefresh)
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load default region", error)
    }
    return null
  }
}

