"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay } from "swiper/modules"
import type { Swiper as SwiperInstance } from "swiper/types"
import { ChevronLeft, ChevronRight } from "lucide-react"

import "swiper/css"
import "swiper/css/navigation"

type HeroSlide = {
  id: number
  imageSrc: string
  alt: string
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    imageSrc: "/assets/images/slider_1.png",
    alt: "Main hero promotion 1",
  },
  {
    id: 2,
    imageSrc: "/assets/images/slider_2.png",
    alt: "Main hero promotion 2",
  },
  {
    id: 3,
    imageSrc: "/assets/images/slider_3.png",
    alt: "Main hero promotion 3",
  },
  {
    id: 4,
    imageSrc: "/assets/images/slider_4.png",
    alt: "Main hero promotion 4",
  },
  {
    id: 5,
    imageSrc: "/assets/images/slider_5.png",
    alt: "Main hero promotion 5",
  },
  {
    id: 6,
    imageSrc: "/assets/images/slider_6.png",
    alt: "Main hero promotion 6",
  },
  {
    id: 7,
    imageSrc: "/assets/images/slider_7.png",
    alt: "Main hero promotion 7",
  },
  {
    id: 8,
    imageSrc: "/assets/images/slider_8.png",
    alt: "Main hero promotion 8",
  },
  {
    id: 9,
    imageSrc: "/assets/images/slider_9.png",
    alt: "Main hero promotion 9",
  },
  {
    id: 10,
    imageSrc: "/assets/images/slider_10.png",
    alt: "Main hero promotion 10",
  }

]

const HERO_SWIPER_OPTIONS = {
  modules: [Autoplay],
  loop: true,
  grabCursor: true,
  spaceBetween: 16,
  slidesPerView: 1,
  autoplay: {
    delay: 5000,
    disableOnInteraction: false,
  },
  breakpoints: {
    640: {
      slidesPerView: 1,
    },
    1024: {
      slidesPerView: 2,
    },
    1440: {
      slidesPerView: 2.50,
    },
  },
}

const Hero = () => {
  const [isMounted, setIsMounted] = useState(false)
  const swiperRef = useRef<SwiperInstance | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <section className="w-full">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-8">
          <div className="relative w-full overflow-hidden rounded-2xl bg-ui-bg-base aspect-[16/9]" />
        </div>
      </section>
    )
  }

  return (
    <section className="w-full">
      <div className="w-full md:px-4 md:py-8">
        <div className="relative overflow-hidden">
          <Swiper
            {...HERO_SWIPER_OPTIONS}
            onSwiper={(swiper) => {
              swiperRef.current = swiper
            }}
            className="hero-swiper"
          >
            {HERO_SLIDES.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="w-full">
                  <div className="relative w-full overflow-hidden md:rounded-2xl bg-ui-bg-base aspect-[16/9]">
                    <Image
                      src={slide.imageSrc}
                      alt={slide.alt}
                      fill
                      priority={slide.id === 1}
                      sizes="(min-width: 2024px) 33vw, (min-width: 1040px) 100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <button
            type="button"
            className="hero-swiper-prev absolute left-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-ui-fg-base shadow-sm transition hover:bg-ui-bg-subtle z-10"
            aria-label="Previous banner"
            onClick={() => swiperRef.current?.slidePrev()}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="hero-swiper-next absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-ui-fg-base shadow-sm transition hover:bg-ui-bg-subtle z-10"
            aria-label="Next banner"
            onClick={() => swiperRef.current?.slideNext()}
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero
