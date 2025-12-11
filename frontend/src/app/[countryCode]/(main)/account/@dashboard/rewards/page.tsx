import { redirect } from "next/navigation"
import { Badge, Heading, Table, Text } from "@medusajs/ui"

import { retrieveCustomer } from "@lib/data/customer"
import { getRewardBalance, getRewardHistory, type RewardHistoryEntry } from "@lib/data/rewards"
import { convertToLocale } from "@lib/util/money"

const RewardsPage = async () => {
  const customer = await retrieveCustomer()

  if (!customer) {
    redirect("/account/login")
  }

  const [balanceResponse, history] = await Promise.all([
    getRewardBalance(),
    getRewardHistory(),
  ])

  const balance = balanceResponse?.balance ?? null
  const available = balance?.available ?? 0
  const pendingForCart = balance?.pending_for_cart ?? 0
  const totalBalance = balance?.balance ?? 0
  const currencyCode = customer?.orders?.[0]?.currency_code ?? "usd"

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-ui-border-subtle bg-white p-6 shadow-sm">
        <Heading level="h1" className="text-2xl">
          Rewards
        </Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Earn points on each order and redeem them on your next purchase.
        </Text>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Available"
            value={convertToLocale({ amount: available, currency_code: currencyCode })}
          />
          <SummaryCard
            label="Total balance"
            value={convertToLocale({ amount: totalBalance, currency_code: currencyCode })}
          />
          <SummaryCard
            label="Pending on this cart"
            value={convertToLocale({ amount: pendingForCart, currency_code: currencyCode })}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-ui-border-subtle bg-white p-6 shadow-sm">
        <Heading level="h2" className="text-lg">
          History
        </Heading>
        {history.length ? (
          <Table className="mt-4">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Points</Table.HeaderCell>
                <Table.HeaderCell>Order</Table.HeaderCell>
                <Table.HeaderCell>Cart</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {history.map((entry: RewardHistoryEntry) => {
                const created = entry.created_at ? new Date(entry.created_at).toLocaleString() : ""
                const points = Number(entry.points ?? 0)
                return (
                  <Table.Row key={entry.id}>
                    <Table.Cell>
                      <Badge color={entry.type === "earn" ? "green" : "orange"}>{entry.type}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={entry.is_confirmed ? "green" : "orange"}>
                        {entry.is_confirmed ? "Confirmed" : "Pending"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-right font-semibold">{points}</Table.Cell>
                    <Table.Cell>{entry.order_id ?? "—"}</Table.Cell>
                    <Table.Cell>{entry.cart_id ?? "—"}</Table.Cell>
                    <Table.Cell>{created}</Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        ) : (
          <Text size="small" className="mt-4 text-ui-fg-subtle">
            No reward activity yet.
          </Text>
        )}
      </div>
    </div>
  )
}

const SummaryCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-xl border border-ui-border-subtle bg-ui-bg-base p-4">
      <Text size="small" className="text-ui-fg-subtle">
        {label}
      </Text>
      <Text className="text-lg font-semibold">{value}</Text>
    </div>
  )
}

export default RewardsPage
