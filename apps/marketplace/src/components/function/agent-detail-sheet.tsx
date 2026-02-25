"use client"

import { Star, Rocket, Users, Zap, X } from "lucide-react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { AgentInitial, CATEGORY_COLORS, type AgentListItem } from "@/lib/agents"

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

function RatingStarsLarge({ rating, count }: { rating: number | null; count: number }) {
  if (!rating || count === 0) {
    return <span className="text-sm text-muted-foreground">No reviews yet</span>
  }

  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted-foreground/20 text-muted-foreground/20"
            }`}
          />
        ))}
      </span>
      <span className="text-sm text-muted-foreground">
        {rating.toFixed(1)} ({formatCount(count)} reviews)
      </span>
    </span>
  )
}

interface AgentDetailSheetProps {
  agent: AgentListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgentDetailSheet({ agent, open, onOpenChange }: AgentDetailSheetProps) {
  if (!agent) return null

  const price =
    agent.pricing_model === "free" || !agent.credits_per_session
      ? "Free"
      : `${agent.credits_per_session} credits per session`

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!w-[540px] !max-w-[90vw] !sm:max-w-none bg-sidebar border-l border-border/40 overflow-y-auto">
        {/* Close button */}
        <DrawerClose className="absolute top-5 right-5 z-10 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-card transition-colors">
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </DrawerClose>

        {/* Header with icon + name */}
        <DrawerHeader className="p-8 pb-0">
          <div className="flex items-start gap-5">
            <AgentInitial name={agent.name} category={agent.category} size="lg" />
            <div className="flex-1 min-w-0 pt-0.5">
              <DrawerTitle className="text-2xl font-bold leading-tight">
                {agent.name}
              </DrawerTitle>
              <DrawerDescription className="mt-1.5 text-[15px]">
                {agent.tagline}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        {/* Stats row */}
        <div className="px-8 py-6">
          <div className="flex gap-8">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-2xl font-bold">{formatCount(agent.total_hires)}</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Hires</span>
            </div>
            <div className="w-px bg-border/40" />
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-2xl font-bold">{agent.avg_rating?.toFixed(1) ?? "—"}</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Rating</span>
            </div>
            <div className="w-px bg-border/40" />
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-2xl font-bold">{price === "Free" ? "Free" : `${agent.credits_per_session}`}</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{price === "Free" ? "Price" : "Credits"}</span>
            </div>
          </div>
        </div>

        {/* Rating stars */}
        <div className="px-8 pb-5">
          <RatingStarsLarge rating={agent.avg_rating} count={agent.total_reviews} />
        </div>

        {/* Category + tags */}
        <div className="flex gap-2 px-8 pb-6 flex-wrap">
          <span className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${CATEGORY_COLORS[agent.category] ?? "bg-secondary text-secondary-foreground"}`}>
            {agent.category}
          </span>
          {agent.pricing_model === "free" ? (
            <span className="rounded-full bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400">
              Free
            </span>
          ) : (
            <span className="rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary">
              {price}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="mx-8 border-t border-border/40" />

        {/* Description */}
        <div className="px-8 py-6">
          <h3 className="text-sm font-semibold mb-3 text-foreground">About</h3>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {agent.description}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-8 border-t border-border/40" />

        {/* Capabilities */}
        <div className="px-8 py-6">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Capabilities</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-[14px] text-muted-foreground">
              <Zap className="size-4 text-amber-400 shrink-0" />
              Fast responses
            </div>
            <div className="flex items-center gap-3 text-[14px] text-muted-foreground">
              <Users className="size-4 text-primary shrink-0" />
              Team compatible
            </div>
            <div className="flex items-center gap-3 text-[14px] text-muted-foreground">
              <Rocket className="size-4 text-emerald-400 shrink-0" />
              Always available
            </div>
          </div>
        </div>

        {/* Deploy CTA */}
        <DrawerFooter className="sticky bottom-0 bg-sidebar/95 backdrop-blur-sm border-t border-border/40 p-8">
          <Button
            size="lg"
            className="w-full rounded-xl bg-primary text-primary-foreground font-semibold text-base h-13 hover:bg-primary/90 transition-colors duration-200"
            asChild
          >
            <a href={`/workspace/home?hire=${encodeURIComponent(agent.slug)}`}>
              <Rocket className="size-4 mr-2" />
              Deploy this Assistant
            </a>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
