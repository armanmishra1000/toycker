import { Metadata } from "next"
import dynamic from "next/dynamic"

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

const CustomerSay = dynamic(() => import("@modules/home/components/customer-say"), {
  loading: () => (
    <section className="w-full bg-[#fff8eb]">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 px-4 py-16">
        <div className="h-5 w-48 animate-pulse rounded-full bg-[#f2d2a0]" />
        <div className="h-72 w-full animate-pulse rounded-3xl bg-white/70" />
      </div>
    </section>
  ),
})

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
      {/* <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div> */}
      <BestSelling
        regionId={region.id}
        countryCode={countryCode}
        isCustomerLoggedIn={isCustomerLoggedIn}
      />
      <CustomerSay />
      <WhyChooseUs />
    </>
  )
}
