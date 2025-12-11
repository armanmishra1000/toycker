"use client"

import { useMemo } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { SparklesSolid } from "@medusajs/icons"
import { Badge, Button, Heading, Input, Label, Table, Text, toast } from "@medusajs/ui"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { backendBaseUrl } from "../../lib/sdk"

const buildAdminUrl = (path: string) => {
  if (typeof window !== "undefined") {
    const currentOrigin = window.location.origin
    if (!backendBaseUrl) {
      return path
    }

    try {
      const baseUrl = new URL(backendBaseUrl)

      // If the backend shares origin or would cause mixed-content (https page -> http API), prefer relative path.
      if (baseUrl.origin === currentOrigin || (window.location.protocol === "https:" && baseUrl.protocol === "http:")) {
        return path
      }

      return `${baseUrl.origin}${path}`
    } catch (e) {
      return path
    }
  }

  return backendBaseUrl ? `${backendBaseUrl}${path}` : path
}

type RewardSettingsResponse = {
  settings: {
    id: string
    earn_rate_bps: number
  }
  earn_percentage: number
}

type RewardTransactionResponse = {
  transactions: Array<{
    id: string
    customer_id: string
    order_id?: string | null
    cart_id?: string | null
    points: number
    type: string
    is_confirmed: boolean
    created_at?: string | Date
    customer?: {
      id: string
      email?: string | null
      first_name?: string | null
      last_name?: string | null
    } | null
  }>
}

const fetchSettings = async (): Promise<RewardSettingsResponse> => {
  const response = await fetch(buildAdminUrl(`/admin/rewards/settings`), {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Unable to load rewards settings")
  }

  return await response.json()
}

const fetchTransactions = async (): Promise<RewardTransactionResponse> => {
  const response = await fetch(buildAdminUrl(`/admin/rewards/transactions?limit=25`), {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Unable to load transactions")
  }

  return await response.json()
}

const formSchema = z.object({
  earn_percentage: z
    .number({ required_error: "Required" })
    .min(0, "Must be at least 0%")
    .max(100, "Cannot exceed 100%"),
})

type FormValues = z.infer<typeof formSchema>

const RewardsPage = () => {
  const queryClient = useQueryClient()

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["rewards", "settings"],
    queryFn: fetchSettings,
  })

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["rewards", "transactions"],
    queryFn: fetchTransactions,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      earn_percentage: settingsData?.earn_percentage ?? 5,
    },
    values: {
      earn_percentage: settingsData?.earn_percentage ?? 5,
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: FormValues) => {
      const response = await fetch(buildAdminUrl(`/admin/rewards/settings`), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unable to save" }))
        throw new Error(error.message || "Unable to save")
      }

      return (await response.json()) as RewardSettingsResponse
    },
    onSuccess: (data) => {
      toast.success("Rewards settings updated")
      form.reset({ earn_percentage: data.earn_percentage })
      queryClient.invalidateQueries({ queryKey: ["rewards", "settings"] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save settings")
    },
  })

  const transactions = useMemo(() => txData?.transactions ?? [], [txData?.transactions])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Heading level="h1">Rewards</Heading>
          <Text className="text-ui-fg-subtle">Configure earn rate and review recent reward activity.</Text>
        </div>
      </div>

      <section className="rounded-2xl border border-ui-border-subtle bg-ui-bg-base p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Heading level="h2" className="text-lg">
              Earn percentage
            </Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Customers earn reward points based on this percentage of their order amount.
            </Text>
          </div>
        </div>
        <form
          className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end"
          onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}
        >
          <div className="flex-1">
            <Label htmlFor="earn_percentage">Earn percentage (%)</Label>
            <Input
              id="earn_percentage"
              type="number"
              step="0.01"
              min={0}
              max={100}
              {...form.register("earn_percentage", { valueAsNumber: true })}
              disabled={settingsLoading || updateMutation.isPending}
            />
            {form.formState.errors.earn_percentage?.message && (
              <Text size="small" className="text-ui-fg-error">
                {form.formState.errors.earn_percentage?.message}
              </Text>
            )}
          </div>
          <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto">
            {updateMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-ui-border-subtle bg-ui-bg-base p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <Heading level="h2" className="text-lg">
            Recent transactions
          </Heading>
        </div>
        {txLoading ? (
          <Text size="small" className="mt-4 text-ui-fg-subtle">
            Loading transactions…
          </Text>
        ) : transactions.length ? (
          <Table className="mt-4">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Points</Table.HeaderCell>
                <Table.HeaderCell>Order</Table.HeaderCell>
                <Table.HeaderCell>Cart</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {transactions.map((tx) => {
                const customerName = tx.customer
                  ? [tx.customer.first_name, tx.customer.last_name].filter(Boolean).join(" ") || tx.customer.email
                  : tx.customer_id
                const createdAt = tx.created_at ? new Date(tx.created_at).toLocaleString() : ""
                return (
                  <Table.Row key={tx.id}>
                    <Table.Cell>
                      <div className="flex flex-col">
                        <Text>{customerName}</Text>
                        {tx.customer?.email && (
                          <Text size="small" className="text-ui-fg-subtle">
                            {tx.customer.email}
                          </Text>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={tx.type === "earn" ? "green" : "orange"}>
                        {tx.type}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={tx.is_confirmed ? "green" : "orange"}>
                        {tx.is_confirmed ? "Confirmed" : "Pending"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-right font-semibold">{tx.points}</Table.Cell>
                    <Table.Cell>{tx.order_id ?? "—"}</Table.Cell>
                    <Table.Cell>{tx.cart_id ?? "—"}</Table.Cell>
                    <Table.Cell>{createdAt}</Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        ) : (
          <Text size="small" className="mt-4 text-ui-fg-subtle">
            No transactions yet.
          </Text>
        )}
      </section>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Rewards",
  icon: SparklesSolid,
})

export default RewardsPage
