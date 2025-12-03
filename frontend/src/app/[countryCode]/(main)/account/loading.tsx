export default function AccountLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-12">
      <div className="h-10 w-64 animate-pulse rounded-2xl bg-neutral-200" />
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <div key={`account-card-${index}`} className="space-y-3 rounded-2xl border border-neutral-200 p-4">
            <div className="h-4 w-32 animate-pulse rounded-full bg-neutral-200" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-100" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-neutral-100" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-3xl border border-neutral-100 bg-neutral-50/60 p-6">
        {[...Array(5)].map((_, lineIndex) => (
          <div key={`account-detail-${lineIndex}`} className="h-4 w-full animate-pulse rounded-full bg-neutral-200" />
        ))}
      </div>
    </div>
  )
}
