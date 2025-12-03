export default function CheckoutLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-12">
      <div className="h-8 w-48 animate-pulse rounded-full bg-neutral-200" />
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, columnIndex) => (
          <div key={`checkout-skeleton-${columnIndex}`} className="space-y-4 rounded-2xl border border-neutral-200 p-6">
            {[...Array(4)].map((__, rowIndex) => (
              <div key={`checkout-row-${columnIndex}-${rowIndex}`} className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded-full bg-neutral-200" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-neutral-100" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
