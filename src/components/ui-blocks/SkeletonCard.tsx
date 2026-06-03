export function SkeletonStatCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl glass p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded-full bg-white/8" />
          <div className="h-8 w-16 animate-pulse rounded-lg bg-white/10" />
        </div>
        <div className="h-10 w-10 animate-pulse rounded-xl bg-white/8" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-b border-white/5 px-5 py-3.5">
      <div className="h-8 w-8 animate-pulse rounded-lg bg-white/8" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-32 animate-pulse rounded-full bg-white/10" />
        <div className="h-2.5 w-20 animate-pulse rounded-full bg-white/6" />
      </div>
      <div className="h-3 w-14 animate-pulse rounded-full bg-white/6" />
      <div className="h-3 w-14 animate-pulse rounded-full bg-white/6" />
      <div className="h-6 w-16 animate-pulse rounded-md bg-white/6" />
      <div className="flex gap-1">
        <div className="h-8 w-16 animate-pulse rounded-lg bg-white/6" />
        <div className="h-8 w-8 animate-pulse rounded-lg bg-white/6" />
        <div className="h-8 w-8 animate-pulse rounded-lg bg-white/6" />
      </div>
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl glass p-6">
      <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-white/8" />
            <div className="flex-1 space-y-1.5">
              <div className={`h-3 animate-pulse rounded-full bg-white/10 ${i % 2 === 0 ? "w-40" : "w-28"}`} />
              <div className="h-2.5 w-24 animate-pulse rounded-full bg-white/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCabinCard() {
  return (
    <div className="overflow-hidden rounded-2xl glass p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="h-2.5 w-10 animate-pulse rounded-full bg-white/6" />
          <div className="h-7 w-8 animate-pulse rounded-lg bg-white/10" />
        </div>
        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="mt-3 h-5 w-16 animate-pulse rounded-md bg-white/8" />
      <div className="mt-3 space-y-1">
        <div className="h-3 w-24 animate-pulse rounded-full bg-white/8" />
        <div className="h-2.5 w-16 animate-pulse rounded-full bg-white/6" />
      </div>
      <div className="mt-3 h-7 w-full animate-pulse rounded-lg bg-white/6" />
    </div>
  );
}
