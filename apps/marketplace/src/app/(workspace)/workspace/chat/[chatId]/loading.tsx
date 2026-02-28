import { Skeleton } from '@/components/ui/skeleton'

export default function ChatLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border/40 px-4">
        <Skeleton className="h-6 w-6" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16 ml-2" />
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-1 flex-col p-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-3/4" />
                {i % 2 === 0 && <Skeleton className="h-4 w-1/2" />}
              </div>
            </div>
          ))}
        </div>

        {/* Member panel skeleton */}
        <div className="w-64 shrink-0 border-l border-border/40 p-3 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
