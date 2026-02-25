import Link from "next/link"
import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AgentInitial, CATEGORY_COLORS, type AgentListItem } from "@/lib/agents"

function RatingStars({ rating, count }: { rating: number | null; count: number }) {
  if (!rating || count === 0) return <span className="text-xs text-muted-foreground">No reviews yet</span>

  return (
    <span className="flex items-center gap-1">
      <span className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </span>
  )
}

export function AgentCard({ agent }: { agent: AgentListItem }) {
  const price =
    agent.pricing_model === "free" || !agent.credits_per_session
      ? "Free"
      : `${agent.credits_per_session} credits/session`

  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-4 hover:border-foreground/20 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <AgentInitial name={agent.name} category={agent.category} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-snug">{agent.name}</p>
          <RatingStars rating={agent.avg_rating} count={agent.total_reviews} />
          <Badge
            variant="secondary"
            className={`mt-1 text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[agent.category] ?? ""}`}
          >
            {agent.category}
          </Badge>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {agent.tagline}
      </p>

      <div className="mt-auto flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{price}</span>
        <span className="rounded-lg bg-foreground px-3 py-1 text-xs font-medium text-background opacity-0 group-hover:opacity-100 transition-opacity">
          Hire
        </span>
      </div>
    </Link>
  )
}
