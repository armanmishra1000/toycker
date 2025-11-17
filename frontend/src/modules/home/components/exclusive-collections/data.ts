export type ExclusiveCollectionItem = {
  id: number
  name: string
  videoSrc: string
  posterSrc: string
  productImageSrc: string
  priceLabel: string
}

export const exclusiveCollectionItems: readonly ExclusiveCollectionItem[] = [
  {
    id: 1,
    name: "Radiant Harmony Katan Silk Saree",
    videoSrc: "/assets/videos/exclusive-1.mp4",
    posterSrc: "/assets/images/slider_1.png",
    productImageSrc: "/assets/images/slider_1.png",
    priceLabel: "₹9,999",
  },
  {
    id: 2,
    name: "Chianti Rangoli Silk Saree",
    videoSrc: "/assets/videos/exclusive-2.mp4",
    posterSrc: "/assets/images/slider_2.png",
    productImageSrc: "/assets/images/slider_2.png",
    priceLabel: "₹8,499",
  },
  {
    id: 3,
    name: "Premium Kanchi Rettepetta Sarees",
    videoSrc: "/assets/videos/exclusive-3.mp4",
    posterSrc: "/assets/images/slider_3.png",
    productImageSrc: "/assets/images/slider_3.png",
    priceLabel: "₹11,200",
  },
  {
    id: 4,
    name: "Pink Banarasi Silk Gadwal Pattu Saree",
    videoSrc: "/assets/videos/exclusive-4.mp4",
    posterSrc: "/assets/images/slider_1.png",
    productImageSrc: "/assets/images/slider_1.png",
    priceLabel: "₹10,999",
  },
  {
    id: 5,
    name: "Exclusive Gold Zari Katan Silk Saree",
    videoSrc: "/assets/videos/exclusive-5.mp4",
    posterSrc: "/assets/images/slider_2.png",
    productImageSrc: "/assets/images/slider_2.png",
    priceLabel: "₹12,450",
  },
  {
    id: 6,
    name: "Mustard Diamond Work Saree",
    videoSrc: "/assets/videos/exclusive-6.mp4",
    posterSrc: "/assets/images/slider_3.png",
    productImageSrc: "/assets/images/slider_3.png",
    priceLabel: "₹7,650",
  },
  {
    id: 7,
    name: "Pastel Patola Heritage Saree",
    videoSrc: "/assets/videos/exclusive-7.mp4",
    posterSrc: "/assets/images/slider_1.png",
    productImageSrc: "/assets/images/slider_1.png",
    priceLabel: "₹13,250",
  },
  {
    id: 8,
    name: "Lotus Pink Tussar Silk Saree",
    videoSrc: "/assets/videos/exclusive-8.mp4",
    posterSrc: "/assets/images/slider_2.png",
    productImageSrc: "/assets/images/slider_2.png",
    priceLabel: "₹9,199",
  },
  {
    id: 9,
    name: "Peony Handloom Shikargah",
    videoSrc: "/assets/videos/exclusive-9.mp4",
    posterSrc: "/assets/images/slider_3.png",
    productImageSrc: "/assets/images/slider_3.png",
    priceLabel: "₹14,050",
  },
  {
    id: 10,
    name: "Royal Indigo Soft Silk Saree",
    videoSrc: "/assets/videos/exclusive-10.mp4",
    posterSrc: "/assets/images/slider_1.png",
    productImageSrc: "/assets/images/slider_1.png",
    priceLabel: "₹8,899",
  },
] as const
