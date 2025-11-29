import HeroSection from "@modules/about/components/hero-section"
import HighlightsSection from "@modules/about/components/highlights-section"
import StorySections from "@modules/about/components/story-sections"
import { heroContent } from "@modules/about/constants"

type AboutPageProps = {
  countryCode: string
}

const AboutPage = ({ countryCode }: AboutPageProps) => {
  return (
    <div className="space-y-4 bg-white">
      <HeroSection content={heroContent} countryCode={countryCode} />
      <HighlightsSection />
      <StorySections />
    </div>
  )
}

export default AboutPage
