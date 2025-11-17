import { ShieldCheck, Truck, Wallet } from "lucide-react"

const ORDER_MESSAGES = [
  {
    icon: Truck,
    title: "Order Now and Get it Delivered.",
    subtitle: "Speedy dispatch within 24 hours on all prepaid orders.",
  },
  {
    icon: Wallet,
    title: "Cash On Delivery is Available",
    subtitle: "Pay securely at your doorstep across 18,000+ pin codes.",
  },
  {
    icon: ShieldCheck,
    title: "Easy Returns / Exchanges Policy (Wrong/Damaged items Only)",
    subtitle: "Initiate a request within 7 days for a no-hassle exchange.",
  },
]

const OrderInformation = () => {
  return (
    <div className="space-y-4 rounded-3xl border border-ui-border-base bg-ui-bg-base/60 p-5">
      {ORDER_MESSAGES.map(({ icon: Icon, title, subtitle }) => (
        <div key={title} className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Icon className="h-5 w-5 text-ui-fg-interactive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ui-fg-base">{title}</p>
            <p className="text-xs text-ui-fg-muted">{subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default OrderInformation
