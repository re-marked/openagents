import Link from "next/link"
import { Star } from "lucide-react"
import { AgentInitial, type AgentListItem } from "@/lib/agents"

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

function RatingStars({ rating, count }: { rating: number | null; count: number }) {
  if (!rating || count === 0) {
    return <span className="text-xs text-muted-foreground/60">New</span>
  }

  return (
    <span className="flex items-center gap-1.5">
      <span className="flex gap-px">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted-foreground/20 text-muted-foreground/20"
            }`}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground">{formatCount(count)}</span>
    </span>
  )
}

/**
 * Large App Store-style card used on the Discover page.
 * No borders — uses subtle background elevation and hover lift.
 */
export function AgentCardLarge({ agent }: { agent: AgentListItem }) {
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group block rounded-2xl bg-card transition-all duration-300 ease-out hover:bg-[hsl(220,13%,17%)] hover:scale-[1.01]"
    >
      {/* Header row: icon + info + CTA */}
      <div className="flex items-center gap-4 p-5 pb-4">
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
        <button
          className="shrink-0 rounded-full bg-primary/15 px-5 py-1.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/25"
          onClick={(e) => {
            // Let the link handle navigation; this is just visual
            e.stopPropagation()
          }}
        >
          View
        </button>
      </div>

      {/* Feature tags — horizontal scroll, styled like screenshot previews area */}
      <div className="flex gap-2 px-5 pb-5 overflow-x-auto no-scrollbar">
        {agent.pricing_model === "free" ? (
          <span className="shrink-0 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
            Free
          </span>
        ) : (
          <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            {agent.credits_per_session} credits
          </span>
        )}
        <span className="shrink-0 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
          {agent.category}
        </span>
        {agent.total_hires > 0 && (
          <span className="shrink-0 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
            {formatCount(agent.total_hires)} hires
          </span>
        )}
      </div>
    </Link>
  )
}

/**
 * Compact card for use in the discover dialog overlay.
 */
export function AgentCard({ agent }: { agent: AgentListItem }) {
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group flex items-center gap-3 rounded-xl bg-card p-3 transition-all duration-200 hover:bg-[hsl(220,13%,17%)]"
    >
      <AgentInitial name={agent.name} category={agent.category} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug truncate">{agent.name}</p>
        <p className="text-xs text-muted-foreground truncate">{agent.tagline}</p>
      </div>
    </Link>
  )
}
