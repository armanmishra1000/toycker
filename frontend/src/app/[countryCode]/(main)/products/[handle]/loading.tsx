export default function ProductLoading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-2">
      <div className="aspect-square w-full animate-pulse rounded-3xl bg-neutral-200" />
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-4 w-24 animate-pulse rounded-full bg-neutral-200" />
          <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-neutral-200" />
          <div className="h-6 w-1/2 animate-pulse rounded-full bg-neutral-100" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div key={`description-line-${index}`} className="h-3 w-full animate-pulse rounded-full bg-neutral-100" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, tileIndex) => (
            <div key={`spec-${tileIndex}`} className="h-20 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
        <div className="h-12 w-full animate-pulse rounded-full bg-neutral-900/10" />
      </div>
    </div>
  )
}
