export type HeroContent = {
  eyebrow: string
  title: string
  subtitle: string
  description: string
  primaryCta: {
    label: string
    href: string
  }
  secondaryCta: {
    label: string
    href: string
  }
  image: {
    src: string
    alt: string
  }
}

export type AboutStat = {
  id: string
  label: string
  value: string
  description: string
}

export type ValueCard = {
  id: string
  title: string
  description: string
  accent: string
}

export type MissionContent = {
  title: string
  description: string
  values: ValueCard[]
}

export type TimelineEvent = {
  id: string
  year: string
  title: string
  description: string
}

export type StoryContent = {
  title: string
  description: string
  narrative: string
  image: {
    src: string
    alt: string
  }
  milestones: TimelineEvent[]
}

export type TeamMember = {
  id: string
  name: string
  role: string
  bio: string
  image: {
    src: string
    alt: string
  }
}

export type SafetyHighlight = {
  id: string
  title: string
  description: string
  badge: string
}

export type Testimonial = {
  id: string
  quote: string
  name: string
  role: string
}

export type FAQItem = {
  id: string
  question: string
  answer: string
}

export type CTAContent = {
  title: string
  description: string
  primaryCta: {
    label: string
    href: string
  }
  secondaryCta: {
    label: string
    href: string
  }
}

export const heroContent: HeroContent = {
  eyebrow: "Play starts here",
  title: "Premium toys. Honest prices. Endless imagination.",
  subtitle: "Discover carefully curated toys that blend fun, learning, and lasting quality.",
  description:
    "From newborn essentials to advanced playsets, Toycker.com handpicks toys for safety, craftsmanship, and pure joy—so you can shop with confidence and let kids play without limits.",
  primaryCta: {
    label: "Shop toys",
    href: "/store",
  },
  secondaryCta: {
    label: "Contact us",
    href: "/contact",
  },
  image: {
    src: "/assets/images/about-page.png",
    alt: "Kids laughing while playing with colorful toys",
  },
}

export const ctaContent: CTAContent = {
  title: "Thank you for choosing Toycker.com",
  description:
    "Explore our ever-growing collection and experience how thoughtful design, quality craftsmanship, and a love for play can transform your home.",
  primaryCta: {
    label: "Browse collections",
    href: "/collections",
  },
  secondaryCta: {
    label: "Talk to us",
    href: "/contact",
  },
}
