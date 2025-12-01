import { Metadata } from "next"

import ExclusiveCollections from "@modules/home/components/exclusive-collections"
import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import PopularToySet from "@modules/home/components/popular-toy-set"
import BestSelling from "@modules/home/components/best-selling"
import ShopByAge from "@modules/home/components/shop-by-age"
import WhyChooseUs from "@modules/home/components/why-choose-us"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description:
    "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const [region, collectionsResult, customer] = await Promise.all([
    getRegion(countryCode),
    listCollections({
      fields: "id, handle, title",
    }),
    retrieveCustomer(),
  ])

  const collections = collectionsResult?.collections
  const isCustomerLoggedIn = Boolean(customer)

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <ShopByAge />
      <PopularToySet
        regionId={region.id}
        countryCode={countryCode}
        isCustomerLoggedIn={isCustomerLoggedIn}
      />
      <ExclusiveCollections />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          {/* <FeaturedProducts collections={collections} region={region} /> */}
        </ul>
      </div>
      <BestSelling
        regionId={region.id}
        countryCode={countryCode}
        isCustomerLoggedIn={isCustomerLoggedIn}
      />
      <WhyChooseUs />
    </>
  )
}
