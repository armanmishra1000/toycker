import HeroSection from "@modules/about/components/hero-section"
import AboutContent from "@modules/about/components/about-content"
import { heroContent } from "@modules/about/constants"

type AboutPageProps = {
  countryCode: string
}

const AboutPage = ({ countryCode }: AboutPageProps) => {
  return (
    <div className="space-y-4 bg-white">
      <HeroSection content={heroContent} countryCode={countryCode} />
      <AboutContent />
    </div>
  )
}

export default AboutPage
