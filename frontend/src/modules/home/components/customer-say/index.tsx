"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay } from "swiper/modules"
import type { Swiper as SwiperInstance } from "swiper/types"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

import "swiper/css"

type Testimonial = {
  id: string
  quote: string
  author: string
  role: string
  location: string
  avatarSrc?: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "testimonial-a",
    quote:
      "Toycker delivers within three days every single time. I no longer do gift panic—my twins count on those weekend surprise boxes!",
    author: "Rucha Patel",
    role: "Product designer",
    location: "Pune",
    avatarSrc: "/assets/images/H9b572778112d43ce886ad0cc030523e4N.jpg",
  },
  {
    id: "testimonial-b",
    quote:
      "The builds feel sturdy and premium. Even our therapy sessions include Toycker kits now because the colors and textures keep the kids curious for hours.",
    author: "Krishna Rao",
    role: "Child therapist",
    location: "Hyderabad",
    avatarSrc: "/assets/images/Hee58b635f526431faa4076d3a0750afeD.jpg",
  },
  {
    id: "testimonial-c",
    quote:
      "Customer care swapped a missing brick within 24 hours. That kind of follow-up makes it easy to recommend Toycker to every parent in my circle.",
    author: "Neha Kulkarni",
    role: "Community moderator",
    location: "Ahmedabad",
    avatarSrc: "/assets/images/Hdba07b027a41.jpg",
  },
]

const CustomerSay = () => {
  const swiperRef = useRef<SwiperInstance | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <section
      className="w-full bg-[#fff8eb]"
      aria-labelledby="customer-say-heading"
      data-testid="customer-say-section"
    >
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-10 px-4 py-16 sm:gap-16 sm:py-20 md:flex-row md:items-center">
        <div className="w-full md:max-w-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c45700]">
            Customer say
          </p>
          <h2 id="customer-say-heading" className="mt-3 text-4xl font-extrabold text-[#1f1405]">
            From our community.
          </h2>
          <p className="mt-4 text-base text-[#5f4630]">
            Here’s what Toycker parents and educators share after unboxing their latest builds.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#f0d2b0] text-[#2c1a0e] transition hover:bg-[#fff2df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45700]"
              aria-label="Previous testimonial"
              onClick={() => swiperRef.current?.slidePrev()}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#f0d2b0] text-[#2c1a0e] transition hover:bg-[#fff2df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45700]"
              aria-label="Next testimonial"
              onClick={() => swiperRef.current?.slideNext()}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="relative w-full overflow-hidden">
          <Swiper
            modules={[Autoplay]}
            slidesPerView={1}
            loop
            speed={500}
            autoplay={{
              delay: 6000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper
            }}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.realIndex)
            }}
            className="customer-say-swiper"
            aria-roledescription="Customer testimonials slider"
          >
            {TESTIMONIALS.map((testimonial) => (
              <SwiperSlide key={testimonial.id} className="!h-auto">
                <article className="rounded-3xl border border-[#f6e1c8] bg-white p-8">
                  <Quote className="h-8 w-8 text-[#c45700]" aria-hidden="true" />
                  <blockquote className="mt-6 text-2xl font-semibold leading-snug text-[#2c1a0e]">
                    “{testimonial.quote}”
                  </blockquote>
                  <div className="mt-8 flex items-center gap-4">
                    {testimonial.avatarSrc ? (
                      <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[#dbe8ff]">
                        <Image
                          src={testimonial.avatarSrc}
                          alt={testimonial.author}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e5efff] text-lg font-semibold text-[#1d6bea]">
                        {testimonial.author
                          .split(" ")
                          .map((chunk) => chunk[0])
                          .join("")}
                      </span>
                    )}
                    <div>
                      <p className="text-base font-semibold text-[#2c1a0e]">{testimonial.author}</p>
                      <p className="text-sm text-[#5f4630]">
                        {testimonial.role}, {testimonial.location}
                      </p>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
          <p className="sr-only" aria-live="polite">
            Testimonial {activeIndex + 1} of {TESTIMONIALS.length}
          </p>
        </div>
      </div>
    </section>
  )
}

export default CustomerSay
