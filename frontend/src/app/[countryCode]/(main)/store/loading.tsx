import ProductGridSkeleton from "@modules/store/components/product-grid-section/product-grid-skeleton"

export default function StoreLoading() {
  return (
    <div className="mx-auto max-w-[1440px] p-4 pb-10">
      <div className="mb-6 h-4 w-24 animate-pulse rounded-full bg-slate-100" aria-hidden />
      <div className="mb-4 h-10 w-64 animate-pulse rounded-full bg-slate-00" aria-hidden />
      <div className="mb-8 flex flex-wrap items-center gap-3">
        {[...Array(3)].map((_, index) => (
          <span key={index} className="h-9 w-28 animate-pulse rounded-full bg-slate-200" aria-hidden />
        ))}
      </div>
      <ProductGridSkeleton />
    </div>
  )
}
