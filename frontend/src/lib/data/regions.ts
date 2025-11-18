"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listRegions = async () => {
  const next = {
    ...(await getCacheOptions("regions")),
  }

  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ regions }) => regions)
    .catch(medusaError)
}

export const retrieveRegion = async (id: string) => {
  const next = {
    ...(await getCacheOptions(["regions", id].join("-"))),
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

const regionMap = new Map<string, HttpTypes.StoreRegion>()

const normalizeCountryCode = (countryCode?: string) =>
  (countryCode ?? "").toLowerCase()

const hydrateRegionCache = async () => {
  const regions = await listRegions()

  if (!regions) {
    return
  }

  regionMap.clear()
  regions.forEach((region) => {
    region.countries?.forEach((country) => {
      if (country?.iso_2) {
        regionMap.set(country.iso_2.toLowerCase(), region)
      }
    })
  })
}

type GetRegionOptions = {
  forceRefresh?: boolean
}

export const getRegion = async (
  countryCode: string,
  options?: GetRegionOptions
) => {
  try {
    const normalizedCode = normalizeCountryCode(countryCode)

    if (!normalizedCode) {
      return null
    }

    if (options?.forceRefresh) {
      regionMap.clear()
    }

    if (!regionMap.size || !regionMap.has(normalizedCode)) {
      await hydrateRegionCache()
    }

    if (!regionMap.has(normalizedCode) && !options?.forceRefresh) {
      await hydrateRegionCache()
    }

    return regionMap.get(normalizedCode) ?? null
  } catch (error) {
    return null
  }
}
