export type PopularToy = {
  id: string
  category: string
  title: string
  description: string
  rating: number
  priceLabel: string
  imageSrc: string
  ctaLabel?: string
}

export const popularToyItems: PopularToy[] = [
  {
    id: "indoor-play-eggs",
    category: "Indoor Play",
    title: "Galore: Rev Up the Playtime Excitement!",
    description:
      "Chunky surprise capsules with matching bots keep little hands busy and imaginations buzzing.",
    rating: 5,
    priceLabel: "$56.00",
    imageSrc: "/assets/images/51eBXKW5gRL._SL1500.jpg",
    ctaLabel: "Select Options",
  },
  {
    id: "outdoor-adventure-park",
    category: "Games and Puzzle",
    title: "Galore: Rev Up the Playtime Excitement!",
    description:
      "A backyard-ready obstacle course that mixes slides, swings, and STEM-friendly challenges.",
    rating: 4,
    priceLabel: "$63.00",
    imageSrc: "/assets/images/H9b572778112d43ce886ad0cc030523e4N.jpg",
    ctaLabel: "Select Options",
  },
  {
    id: "vehicles-galore",
    category: "Games and Puzzle",
    title: "Vehicles Galore: Rev Up the Playtime Excitement!",
    description:
      "Modular cars and cubes snap together so kids can invent their own garage-worthy fleet.",
    rating: 5,
    priceLabel: "$54.00",
    imageSrc: "/assets/images/H373b3e2614344291824ff29116a86506M.jpg",
    ctaLabel: "Select Options",
  },
  {
    id: "educational-chef-set",
    category: "Educational Toy",
    title: "Chef’s Quest: Chop, Learn, and Share!",
    description:
      "Soft-cut fruits, wooden tools, and pretend recipes spark collaborative kitchen stories.",
    rating: 4,
    priceLabel: "$37.00 – $71.00",
    imageSrc: "/assets/images/Hdba07b027a41.jpg",
    ctaLabel: "Select Options",
  },
  {
    id: "creative-garden-play",
    category: "Sensory Play",
    title: "Garden Quest: Mix, Mold, and Imagine!",
    description:
      "Textured veggies, tools, and story starters make pretend picnics feel wonderfully real.",
    rating: 5,
    priceLabel: "$42.00",
    imageSrc: "/assets/images/Hee58b635f526431faa4076d3a0750afeD.jpg",
    ctaLabel: "Select Options",
  },
]
