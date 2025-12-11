"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button, Input, Label, Text, toast } from "@medusajs/ui"

import { convertToLocale } from "@lib/util/money"
import { applyRewardPoints } from "@lib/data/rewards"

type RewardRedeemerProps = {
  currencyCode: string
  available: number
  appliedPoints: number
}

const RewardRedeemer = ({ currencyCode, available, appliedPoints }: RewardRedeemerProps) => {
  const router = useRouter()
  const initial = appliedPoints > 0 ? appliedPoints : Math.max(0, Math.floor(available))
  const [points, setPoints] = useState<number>(initial)
  const [isSubmitting, startTransition] = useTransition()

  const handleApply = async () => {
    const normalized = Math.max(0, Math.floor(points || 0))
    startTransition(async () => {
      try {
        await applyRewardPoints(normalized)
        toast.success(normalized > 0 ? "Rewards applied" : "Rewards removed")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to apply rewards")
      }
    })
  }

  const remainingAfterApply = Math.max(available - appliedPoints, 0)

  return (
    <div className="rounded-2xl border border-ui-border-subtle bg-ui-bg-base p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold text-ui-fg-base">Rewards</Label>
            <Text size="small" className="text-ui-fg-subtle">
              Apply your points to lower this order total.
            </Text>
          </div>
          <div className="text-right">
            <Text className="text-sm font-semibold">Available</Text>
            <div className="text-sm text-ui-fg-subtle">
              {convertToLocale({ amount: available, currency_code: currencyCode })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="number"
            min={0}
            value={Number.isFinite(points) ? points : 0}
            onChange={(event) => setPoints(Math.max(0, Math.floor(Number(event.target.value))))}
            className="sm:max-w-[180px]"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              type="button"
              onClick={() => setPoints(Math.max(0, Math.floor(available)))}
              disabled={isSubmitting || available <= 0}
            >
              Use max
            </Button>
            <Button size="small" type="button" onClick={handleApply} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Apply"}
            </Button>
          </div>
        </div>

        {appliedPoints > 0 && (
          <Text size="small" className="text-ui-fg-subtle">
            Currently applied: {convertToLocale({ amount: appliedPoints, currency_code: currencyCode })}
          </Text>
        )}
        {remainingAfterApply > 0 && (
          <Text size="small" className="text-ui-fg-subtle">
            Remaining after apply: {convertToLocale({ amount: remainingAfterApply, currency_code: currencyCode })}
          </Text>
        )}
      </div>
    </div>
  )
}

export default RewardRedeemer
