"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import type { Swiper as SwiperInstance } from "swiper/types"
import { FreeMode, Navigation, Thumbs } from "swiper/modules"
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"

import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/navigation"
import "swiper/css/thumbs"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperInstance | null>(null)
  const [mainSwiper, setMainSwiper] = useState<SwiperInstance | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setActiveIndex(0)
    if (mainSwiper) {
      mainSwiper.slideTo(0)
    }
  }, [images, mainSwiper])

  const safeThumbs = useMemo(() => {
    if (!thumbsSwiper || thumbsSwiper.destroyed) {
      return null
    }
    return thumbsSwiper
  }, [thumbsSwiper])

  const currentImage = images[activeIndex]

  const handleZoom = () => {
    if (!currentImage?.url) return
    if (typeof window === "undefined") return
    window.open(currentImage.url, "_blank")
  }

  if (!images?.length) {
    return (
      <div className="flex w-full flex-col gap-y-4">
        <div className="h-[420px] w-full animate-pulse rounded-2xl bg-ui-bg-subtle" />
        <div className="h-20 w-full animate-pulse rounded-2xl bg-ui-bg-subtle" />
      </div>
    )
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-[420px] w-full animate-pulse rounded-3xl bg-ui-bg-subtle" />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="hidden w-[80px] flex-col lg:flex">
        <div className="bg-white/90">
        <Swiper
          direction="vertical"
          modules={[FreeMode, Thumbs]}
          spaceBetween={0}
          slidesPerView={Math.min(images.length, 5)}
          freeMode
          slideToClickedSlide
          watchSlidesProgress
          onSwiper={(swiperInstance) => setThumbsSwiper(swiperInstance)}
          className="product-thumb-swiper"
        >
          {images.map((image, index) => (
            <SwiperSlide key={image.id ?? index} className="!h-24">
              <button
                type="button"
                onClick={() => mainSwiper?.slideTo(index)}
                className={`group relative flex h-[80px] w-full items-center justify-center overflow-hidden rounded-xl border bg-[#FBFBFB] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7353A]/60 ${
                  activeIndex === index
                    ? "border-[#E7353A]"
                    : "border-transparent"
                }`}
              >
                <ImageThumb image={image} index={index} />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-xl">
        <Swiper
          modules={[Navigation, Thumbs]}
          navigation={{
            nextEl: ".product-gallery-next",
            prevEl: ".product-gallery-prev",
          }}
          spaceBetween={24}
          thumbs={{ swiper: safeThumbs }}
          className="product-main-swiper"
          onSwiper={(swiperInstance) => setMainSwiper(swiperInstance)}
          onSlideChange={(swiperInstance) =>
            setActiveIndex(swiperInstance.activeIndex ?? 0)
          }
        >
          {images.map((image, index) => (
            <SwiperSlide key={image.id ?? index}>
              <div className="relative aspect-[4/4.4] w-full overflow-hidden rounded-xl bg-white">
                {image.url ? (
                  <Image
                    src={image.url}
                    alt={`Product image ${index + 1}`}
                    fill
                    priority={index === 0}
                    sizes="(min-width: 1024px) 620px, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-ui-bg-subtle" />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          type="button"
          onClick={handleZoom}
          className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ui-fg-base shadow-md transition hover:scale-105"
          aria-label="Open image in new tab"
        >
          <Maximize2 className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="product-gallery-prev absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-ui-fg-base shadow-sm transition hover:bg-ui-bg-subtle"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="product-gallery-next absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-ui-fg-base shadow-sm transition hover:bg-ui-bg-subtle"
          aria-label="Next image"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="block w-full lg:hidden">
        <Swiper
          modules={[FreeMode, Thumbs]}
          spaceBetween={12}
          slidesPerView={4.2}
          freeMode
          className="product-thumb-swiper-mobile"
        >
          {images.map((image, index) => (
            <SwiperSlide key={(image.id ?? index) + "-mobile"}>
              <button
                type="button"
                onClick={() => mainSwiper?.slideTo(index)}
                className={`relative h-20 w-full overflow-hidden rounded-2xl border ${
                  activeIndex === index ? "border-[#E7353A]" : "border-transparent"
                }`}
                aria-label={`Show image ${index + 1}`}
              >
                <ImageThumb image={image} index={index} />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

const ImageThumb = ({
  image,
  index,
}: {
  image: HttpTypes.StoreProductImage
  index: number
}) => {
  return (
    <>
      {image.url ? (
        <Image
          src={image.url}
          alt={`Thumbnail ${index + 1}`}
          fill
          sizes="120px"
          className="object-cover"
        />
      ) : (
        <div className="h-full w-full bg-ui-bg-subtle" />
      )}
    </>
  )
}

export default ImageGallery
