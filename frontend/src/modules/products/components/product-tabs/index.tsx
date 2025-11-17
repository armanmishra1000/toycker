"use client"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Description",
      component: <DescriptionTab description={product.description} />,
    },
    {
      label: "Shipping & Returns",
      component: <ShippingReturnsTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const DescriptionTab = ({ description }: { description?: string }) => (
  <div className="py-6 text-sm text-ui-fg-subtle whitespace-pre-line">
    {description || "Product description will be updated shortly."}
  </div>
)

const ShippingReturnsTab = () => (
  <div className="space-y-4 py-6 text-sm text-ui-fg-base">
    <div>
      <p className="font-semibold">Order Now and Get it Delivered.</p>
      <p className="text-ui-fg-subtle">
        We dispatch within 24 hours and deliver across India via express partners.
      </p>
    </div>
    <div>
      <p className="font-semibold">Cash On Delivery is Available</p>
      <p className="text-ui-fg-subtle">
        Choose COD at checkout for a worry-free purchase experience.
      </p>
    </div>
    <div>
      <p className="font-semibold">
        Easy Returns / Exchanges Policy (Wrong/Damaged items Only)
      </p>
      <p className="text-ui-fg-subtle">
        Share unboxing photos within 48 hours and we will arrange a free exchange.
      </p>
    </div>
  </div>
)

export default ProductTabs
