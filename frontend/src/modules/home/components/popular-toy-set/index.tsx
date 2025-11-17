import Image from "next/image"
import { Heart, Star } from "lucide-react"

import { popularToyItems } from "./data"

const PopularToySet = () => {
  return (
    <section
      className="w-full bg-primary/10"
      aria-labelledby="popular-toy-set-heading"
      data-testid="popular-toy-set"
    >
      <div className="mx-auto max-w-screen-2xl px-4 py-16 md:py-20">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c5996f]">
            Explore
          </p>
          <h2
            id="popular-toy-set-heading"
            className="mt-2 text-3xl font-bold text-[#1b2240] md:text-4xl"
          >
            Explore Popular Toy Set
          </h2>
          <p className="mt-3 text-base text-[#6b5b53] md:text-lg">
            Discover parent-approved sets that balance sensory fun, imaginative stories, and
            learning moments—all ready to ship.
          </p>
        </header>

        <div className="mt-12">
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {popularToyItems.map((toy) => (
              <li key={toy.id}>
                <article className="relative flex h-full flex-col rounded-[1.75rem] border border-[#f7d7c3] bg-white p-4 shadow-[0px_25px_60px_rgba(240,200,173,0.45)]">
                  <div className="relative mb-5 flex items-center justify-center ">
                    <Image
                      src={toy.imageSrc}
                      alt={toy.title}
                      width={260}
                      height={200}
                      className="h-60 w-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#f0c9ae] bg-white text-primary shadow-md transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <Heart className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Save {toy.title}</span>
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#9d877c]">
                      {toy.category}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold leading-snug text-[#1c1e2d]">
                      {toy.title}
                    </h3>

                    <div className="mt-4 flex items-center" aria-label={`Rated ${toy.rating} out of 5`}>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => {
                          const filled = index + 1 <= Math.round(toy.rating)
                          return (
                            <Star
                              key={`${toy.id}-star-${index}`}
                              className={`h-4 w-4 ${filled ? "text-[#ffb341]" : "text-[#e7d6cb]"}`}
                              strokeWidth={2}
                              fill={filled ? "currentColor" : "none"}
                              aria-hidden="true"
                            />
                          )
                        })}
                      </div>
                      <span className="ml-2 text-sm font-semibold text-[#3c2f2a]">
                        ({toy.rating.toFixed(2)})
                      </span>
                    </div>

                    <p className="mt-4 text-2xl font-bold text-primary">{toy.priceLabel}</p>
                    {toy.ctaLabel ? (
                      <button
                        type="button"
                        className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-foreground  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00c48c]"
                      >
                        {toy.ctaLabel}
                      </button>
                    ) : (
                      <div className="mt-5" aria-hidden="true" />
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default PopularToySet
