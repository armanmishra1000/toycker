"use client"

import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import type { Swiper as SwiperInstance } from "swiper/types"
import { FreeMode, Navigation, Thumbs } from "swiper/modules"
import { ChevronLeft, ChevronRight } from "lucide-react"

import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/navigation"
import "swiper/css/thumbs"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperInstance | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const safeThumbs = useMemo(() => {
    if (!thumbsSwiper || thumbsSwiper.destroyed) {
      return null
    }
    return thumbsSwiper
  }, [thumbsSwiper])

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
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <div className="hidden w-[120px] lg:block">
        <Swiper
          direction="vertical"
          modules={[FreeMode, Thumbs]}
          spaceBetween={12}
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
                className="group relative flex h-24 w-full items-center justify-center overflow-hidden rounded-2xl border border-transparent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
              >
                <ImageThumb image={image} index={index} />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-3xl">
        <Swiper
          modules={[Navigation, Thumbs]}
          navigation={{
            nextEl: ".product-gallery-next",
            prevEl: ".product-gallery-prev",
          }}
          spaceBetween={24}
          thumbs={{ swiper: safeThumbs }}
          className="product-main-swiper"
        >
          {images.map((image, index) => (
            <SwiperSlide key={image.id ?? index}>
              <Container className="relative aspect-[5/6] w-full overflow-hidden bg-ui-bg-subtle">
                {image.url ? (
                  <Image
                    src={image.url}
                    alt={`Product image ${index + 1}`}
                    fill
                    priority={index === 0}
                    sizes="(min-width: 1024px) 540px, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-ui-bg-subtle" />
                )}
              </Container>
            </SwiperSlide>
          ))}
        </Swiper>

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
              <div className="relative h-20 w-full overflow-hidden rounded-2xl">
                <ImageThumb image={image} index={index} />
              </div>
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
