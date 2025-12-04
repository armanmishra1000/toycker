import { Metadata } from "next"
import { cookies } from "next/headers"

import ExclusiveCollections from "@modules/home/components/exclusive-collections"
import Hero from "@modules/home/components/hero"
import PopularToySet from "@modules/home/components/popular-toy-set"
import BestSelling from "@modules/home/components/best-selling"
import ShopByAge from "@modules/home/components/shop-by-age"
import ReviewMediaHub from "@modules/home/components/review-media-hub"
import WhyChooseUs from "@modules/home/components/why-choose-us"
import CategoryMarquee from "@modules/home/components/category-marquee"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

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

  const [region, collectionsResult] = await Promise.all([
    getRegion(countryCode),
    listCollections({
      fields: "id, handle, title",
    }),
  ])

  const cookieStore = await cookies()

  const collections = collectionsResult?.collections
  const isCustomerLoggedIn = Boolean(cookieStore.get("_medusa_jwt"))

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <CategoryMarquee />
      <PopularToySet
        regionId={region.id}
        countryCode={countryCode}
        isCustomerLoggedIn={isCustomerLoggedIn}
      />
      <ShopByAge />
      <ExclusiveCollections />
      <BestSelling
        regionId={region.id}
        countryCode={countryCode}
        isCustomerLoggedIn={isCustomerLoggedIn}
      />
      <ReviewMediaHub />
      <WhyChooseUs />
    </>
  )
}
