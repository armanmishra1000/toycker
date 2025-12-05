import { MedusaService } from "@medusajs/framework/utils"
import type { FindConfig } from "@medusajs/types"

import ExclusiveShowcaseEntry from "./models/exclusive-showcase-entry"
import crypto from "node:crypto"

export type ExclusiveShowcaseEntryDTO = Awaited<
  ReturnType<ExclusiveShowcaseService["retrieveExclusiveShowcaseEntry"]>
>

export type ExclusiveShowcaseEntryInput = {
  id?: string
  product_id: string
  video_url: string
  video_key: string
  poster_url?: string | null
  sort_order?: number
  is_active?: boolean
}

export type ExclusiveShowcaseEntryUpdateInput = {
  id: string
  product_id?: string
  video_url?: string
  video_key?: string
  poster_url?: string | null
  sort_order?: number
  is_active?: boolean
}

class ExclusiveShowcaseService extends MedusaService({
  ExclusiveShowcaseEntry,
}) {
  async listActive(config?: FindConfig<ExclusiveShowcaseEntryDTO>) {
    return await this.listExclusiveShowcaseEntries(
      {
        is_active: true,
      },
      {
        order: {
          sort_order: "ASC",
          created_at: "ASC",
        },
        ...config,
      },
    )
  }

  async createEntry(data: ExclusiveShowcaseEntryInput) {
    const normalizedSort =
      typeof data.sort_order === "number"
        ? data.sort_order
        : Math.floor(Date.now() / 1000)
    const generatedId = crypto.randomUUID ? crypto.randomUUID() : `exsc_${Date.now()}`
    const trimmedPoster = data.poster_url?.trim() || null

    return await this.createExclusiveShowcaseEntries({
      ...data,
      id: data.id ?? generatedId,
      sort_order: normalizedSort,
      poster_url: trimmedPoster,
    })
  }

  async updateEntry(data: ExclusiveShowcaseEntryUpdateInput) {
    const { id, ...rest } = data
    if (!id) {
      throw new Error("Entry id is required")
    }

    const payload = {
      ...rest,
    }

    if (Object.prototype.hasOwnProperty.call(rest, "poster_url")) {
      payload.poster_url = typeof rest.poster_url === "string" ? rest.poster_url.trim() : null
    }

    return await this.updateExclusiveShowcaseEntries({
      id,
      ...payload,
    })
  }

  async deleteEntry(id: string) {
    await this.deleteExclusiveShowcaseEntries(id)
  }

  async reorderEntries(entries: { id: string; sort_order: number }[]) {
    if (!entries.length) {
      return []
    }

    const updates = entries.map((entry) => ({
      id: entry.id,
      sort_order: entry.sort_order,
    }))

    return await this.updateExclusiveShowcaseEntries(updates)
  }
}

export default ExclusiveShowcaseService
