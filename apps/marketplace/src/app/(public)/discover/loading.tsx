import { Skeleton } from '@/components/ui/skeleton'

export default function DiscoverLoading() {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar skeleton */}
      <div className="hidden w-56 shrink-0 border-r border-border/40 p-4 lg:block space-y-2">
        <Skeleton className="h-5 w-20 mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Search bar */}
        <Skeleton className="h-10 w-full max-w-md rounded-lg mb-6" />

        {/* Card grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/40 bg-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-[14px]" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
