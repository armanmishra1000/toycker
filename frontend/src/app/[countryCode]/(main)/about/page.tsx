import { Metadata } from "next"

import AboutPage from "@modules/about/templates/about-page"

export const metadata: Metadata = {
  title: "About Toycker",
  description: "Discover Toycker’s mission, safety standards, sustainability promises, and the team crafting joyful play.",
}

type AboutRouteProps = {
  params: Promise<{ countryCode: string }>
}

export default async function AboutRoute({ params }: AboutRouteProps) {
  const { countryCode } = await params

  return <AboutPage countryCode={countryCode} />
}
