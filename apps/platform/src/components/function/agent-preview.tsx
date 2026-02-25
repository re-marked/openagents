'use client'

import { useMemo } from 'react'
import YAML from 'yaml'
import { AlertCircle, Bot, Star, Users, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentPreviewProps {
  yamlContent: string
}

const CATEGORY_COLORS: Record<string, string> = {
  productivity: 'bg-blue-500/10 text-blue-400',
  research: 'bg-emerald-500/10 text-emerald-400',
  writing: 'bg-purple-500/10 text-purple-400',
  coding: 'bg-amber-500/10 text-amber-400',
  business: 'bg-cyan-500/10 text-cyan-400',
  creative: 'bg-pink-500/10 text-pink-400',
  personal: 'bg-orange-500/10 text-orange-400',
}

export function AgentPreview({ yamlContent }: AgentPreviewProps) {
  const { parsed, error } = useMemo(() => {
    try {
      const data = YAML.parse(yamlContent)
      return { parsed: data, error: null }
    } catch (e) {
      return { parsed: null, error: (e as Error).message }
    }
  }, [yamlContent])

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Invalid YAML</p>
            <p className="mt-1 text-xs text-muted-foreground font-mono">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!parsed) return null

  const name = parsed.name ?? 'Untitled Agent'
  const tagline = parsed.tagline ?? ''
  const description = parsed.description ?? ''
  const category = parsed.category ?? 'productivity'
  const capabilities = parsed.capabilities ?? []
  const tags = parsed.tags ?? []
  const pricing = parsed.pricing ?? {}
  const models = parsed.models ?? {}
  const version = parsed.version ?? '0.0.0'

  const categoryColor = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.productivity

  return (
    <div className="space-y-6">
      {/* Agent card preview */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-lg font-bold">
            {name[0]?.toUpperCase() ?? 'A'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{name}</h2>
              <span className="text-xs text-muted-foreground">v{version}</span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{tagline}</p>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', categoryColor)}>
                {category}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                {pricing.model === 'free' ? 'Free' : `${pricing.credits ?? 0} credits/session`}
              </span>
              {models.primary && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground capitalize">
                  {models.primary}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>
        )}

        {/* Capabilities */}
        {capabilities.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Capabilities
            </h3>
            <div className="space-y-1.5">
              {capabilities.map((cap: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Zap className="size-3 text-primary" />
                  <span>{cap}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag: string, i: number) => (
                <span key={i} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mock marketplace stats */}
        <div className="mt-4 border-t pt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="size-3" />
            <span>0 hires</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="size-3" />
            <span>No reviews yet</span>
          </div>
          <div className="flex items-center gap-1">
            <Bot className="size-3" />
            <span>New</span>
          </div>
        </div>
      </div>

      {/* Compact card preview (discover page style) */}
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Discover page card
        </h3>
        <div className="max-w-xs rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
              {name[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{name}</p>
              <p className="text-xs text-muted-foreground truncate">{tagline}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', categoryColor)}>
                  {category}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {pricing.model === 'free' ? 'Free' : `${pricing.credits ?? 0}c`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
