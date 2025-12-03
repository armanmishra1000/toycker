"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay } from "swiper/modules"
import type { Swiper as SwiperInstance } from "swiper/types"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"

import "swiper/css"

import { exclusiveCollectionItems } from "./data"

const STORE_BADGES = [
  {
    id: "app-store",
    label: "App Store",
  },
  {
    id: "google-play",
    label: "Google Play",
  },
]

const ExclusiveCollections = () => {
  const [isMounted, setIsMounted] = useState(false)
  const swiperRef = useRef<SwiperInstance | null>(null)
  const [isAutoplaying, setIsAutoplaying] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const toggleAutoplay = () => {
    if (!swiperRef.current?.autoplay) {
      return
    }

    if (isAutoplaying) {
      swiperRef.current.autoplay.stop()
      setIsAutoplaying(false)
    } else {
      swiperRef.current.autoplay.start()
      setIsAutoplaying(true)
    }
  }

  return (
    <section className="w-full bg-[#eeffd2]">
      <div className="mx-auto max-w-screen-2xl px-4 py-12 md:py-16">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b26f45]">
              Exclusive collections
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#4b2b1c] md:text-4xl">
              Shop from our founder
            </h2>
            <p className="mt-2 max-w-2xl text-base text-[#725747]">
              Watch the sarees live, get the search code, and place an order directly after
              seeing the drape in motion.
            </p>
          </div>
          {/* {isMounted && (
            <button
              type="button"
              className="inline-flex items-center gap-2 self-start rounded-full border border-[#d6b39c] bg-white px-4 py-2 text-sm font-semibold text-[#8b5e34] shadow-sm transition hover:bg-[#f8ede6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b39c]"
              aria-pressed={!isAutoplaying}
              aria-label={isAutoplaying ? "Pause autoplay" : "Play autoplay"}
              onClick={toggleAutoplay}
            >
              {isAutoplaying ? (
                <Pause className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              {isAutoplaying ? "Pause autoplay" : "Resume autoplay"}
            </button>
          )} */}
        </header>

        {!isMounted ? (
          <div className="h-[22rem] w-full rounded-xl bg-[#f8ede6]" />
        ) : (
          <div className="relative overflow-hidden rounded-xl">
            <Swiper
              modules={[Autoplay]}
              loop
              speed={600}
              spaceBetween={16}
              slidesPerView={1.05}
              breakpoints={{
                540: {
                  slidesPerView: 1.4,
                },
                768: {
                  slidesPerView: 2.75,
                },
                1024: {
                  slidesPerView: 4.75,
                },
                1280: {
                  slidesPerView: 5.25,
                },
              }}
              autoplay={{
                delay: 4500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper
              }}
              onSlideChange={(swiper) => {
                setActiveIndex(swiper.realIndex)
              }}
              className="exclusive-swiper pb-6"
              aria-roledescription="Exclusive collections slider"
            >
              {exclusiveCollectionItems.map((item, index) => (
                <SwiperSlide
                  key={item.id}
                  role="group"
                  aria-label={`Video ${index + 1} of ${exclusiveCollectionItems.length}`}
                >
                  <article className="flex h-full flex-col rounded-xl overflow-hidden">
                    <div className="relative overflow-hidden rounded-xl">
                      <video
                        className="h-full w-full object-cover d-block"
                        src={item.videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        poster={item.posterSrc}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="flex items-center gap-3 bg-[#dbfca7] p-3 text-[#3a5017] z-10">
                      <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/60">
                        <Image
                          src={item.productImageSrc}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex min-h-[3.5rem] flex-1 flex-col justify-center">
                        <p className="text-sm font-semibold leading-tight">{item.name}</p>
                        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                          {item.priceLabel}
                        </p>
                      </div>
                    </div>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
            <button
              type="button"
              className="exclusive-nav-button absolute left-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-ui-fg-base shadow-sm transition hover:bg-ui-bg-subtle"
              aria-label="Previous video"
              onClick={() => swiperRef.current?.slidePrev()}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="exclusive-nav-button absolute right-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-ui-fg-base shadow-sm transition hover:bg-ui-bg-subtle"
              aria-label="Next video"
              onClick={() => swiperRef.current?.slideNext()}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="sr-only" aria-live="polite">
              Slide {activeIndex + 1} of {exclusiveCollectionItems.length}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default ExclusiveCollections
