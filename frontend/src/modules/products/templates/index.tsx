import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"
import CustomerReviews from "@modules/products/components/customer-reviews"
import OrderInformation from "@modules/products/components/order-information"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div className="content-container py-8" data-testid="product-container">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,_55%)_minmax(320px,_1fr)]">
          <div className="flex flex-col gap-10">
            <ImageGallery images={images} />
            <ProductTabs product={product} />
            <CustomerReviews />
          </div>
          <div className="flex flex-col gap-6">
            <Suspense
              fallback={<ProductActions disabled={true} product={product} />}
            >
              <ProductActionsWrapper
                id={product.id}
                region={region}
                countryCode={countryCode}
              />
            </Suspense>
            <OrderInformation />
          </div>
        </div>
      </div>
      <div className="content-container my-16" data-testid="related-products-container">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
