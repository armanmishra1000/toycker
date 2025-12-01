import { type LucideIcon, Award, RotateCcw, Tag, Truck } from "lucide-react"

type BenefitCard = {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

const BENEFITS: BenefitCard[] = [
  {
    id: "national-delivery",
    title: "National Delivery",
    description: "We deliver to all states in India within 3-5 days of order",
    icon: Truck,
  },
  {
    id: "best-quality",
    title: "Best Quality",
    description: "We provide the best quality products in the market at the best price",
    icon: Award,
  },
  {
    id: "best-offers",
    title: "Best Offers",
    description: "We provide the best offers on all products compared to others",
    icon: Tag,
  },
  {
    id: "easy-returns",
    title: "Easy Returns",
    description: "We provide easy returns on all products within 7 days",
    icon: RotateCcw,
  },
]

const WhyChooseUs = () => {
  return (
    <section
      className="w-full bg-[#f1f8ff]"
      aria-labelledby="why-choose-us-heading"
      data-testid="why-choose-us-section"
    >
      <div className="mx-auto max-w-screen-2xl px-4 py-16 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#1d6bea]">
            Why Choose Us
          </p>
          <h2 id="why-choose-us-heading" className="mt-3 text-3xl font-bold text-[#1b2240] md:text-4xl">
            Trusted by parents across India
          </h2>
          <p className="mt-4 text-base text-[#5f5d5d] md:text-lg">
            Four simple promises that keep every Toycker order smooth, transparent, and worry-free.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon

            return (
              <li key={benefit.id}>
                <article
                  className="group h-full rounded-2xl border border-[#dbe8ff] bg-white p-6 shadow-[0_18px_45px_rgba(27,34,64,0.08)] transition-transform duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1d6bea] hover:-translate-y-1"
                  aria-labelledby={`${benefit.id}-title`}
                  tabIndex={0}
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5efff] text-[#1d6bea]">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 id={`${benefit.id}-title`} className="mt-6 text-xl font-semibold text-[#1b2240]">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-base text-[#5f5d5d]">{benefit.description}</p>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default WhyChooseUs
