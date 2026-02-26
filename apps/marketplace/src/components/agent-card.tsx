import { Star } from "lucide-react"
import { AgentInitial, type AgentListItem } from "@/lib/agents"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

export function RatingStars({ rating, count, size = "sm" }: { rating: number | null; count: number; size?: "sm" | "md" }) {
  if (!rating || count === 0) {
    return <Badge variant="secondary" className="text-[10px]">New</Badge>
  }

  const starSize = size === "sm" ? "h-3 w-3" : "h-4 w-4"

  return (
    <span className="flex items-center gap-1.5">
      <span className="flex gap-px">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted-foreground/20 text-muted-foreground/20"
            }`}
          />
        ))}
      </span>
      <span className={`text-muted-foreground ${size === "sm" ? "text-xs" : "text-sm"}`}>
        {size === "md" && `${rating.toFixed(1)} · `}{formatCount(count)}{size === "md" && " reviews"}
      </span>
    </span>
  )
}

/**
 * Large App Store-style card. Clicking opens the detail sheet.
 */
export function AgentCardLarge({
  agent,
  onSelect,
}: {
  agent: AgentListItem
  onSelect: (agent: AgentListItem) => void
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect(agent)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(agent) }}
      className="group border-0 gap-0 py-0 transition-all duration-300 ease-out hover:bg-accent hover:scale-[1.01] cursor-pointer select-none"
    >
      {/* Header row: icon + info + CTA */}
      <CardContent className="flex items-center gap-4 p-5 pb-4">
        <AgentInitial name={agent.name} category={agent.category} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold leading-tight text-foreground truncate">
            {agent.name}
          </h3>
          <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
            {agent.tagline}
          </p>
          <div className="mt-1.5">
            <RatingStars rating={agent.avg_rating} count={agent.total_reviews} />
          </div>
        </div>
        <Badge className="shrink-0 px-4 py-1.5 text-sm font-semibold transition-colors duration-200 group-hover:bg-primary/90">
          View
        </Badge>
      </CardContent>

      {/* Feature tags */}
      <CardContent className="flex gap-2 px-5 pb-5 overflow-x-auto no-scrollbar">
        {agent.pricing_model === "free" ? (
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-0">
            Free
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
            {agent.credits_per_session} credits
          </Badge>
        )}
        <Badge variant="secondary">{agent.category}</Badge>
        {agent.total_hires > 0 && (
          <Badge variant="secondary">{formatCount(agent.total_hires)} hires</Badge>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact card for use in the discover dialog overlay.
 */
export function AgentCard({ agent }: { agent: AgentListItem }) {
  return (
    <Card
      className="group border-0 gap-0 py-0 transition-all duration-200 hover:bg-accent"
    >
      <a href={`/agents/${agent.slug}`} className="flex items-center gap-3 p-3">
        <AgentInitial name={agent.name} category={agent.category} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug truncate">{agent.name}</p>
          <p className="text-xs text-muted-foreground truncate">{agent.tagline}</p>
        </div>
      </a>
    </Card>
  )
}
