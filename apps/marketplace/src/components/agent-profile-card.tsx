'use client'

import Link from 'next/link'
import { MessageCircle, Settings2 } from 'lucide-react'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { AgentAvatar, CATEGORY_COLORS } from '@/lib/agents'

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  running: { text: 'Online', color: 'bg-emerald-500' },
  suspended: { text: 'Idle', color: 'bg-amber-400' },
  stopped: { text: 'Offline', color: 'bg-zinc-500' },
  provisioning: { text: 'Starting...', color: 'bg-blue-400 animate-pulse' },
  error: { text: 'Error', color: 'bg-red-500' },
}

interface AgentProfileCardProps {
  instanceId: string
  name: string
  category: string
  status: string
  iconUrl?: string | null
  tagline?: string | null
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

export function AgentProfileCard({
  instanceId,
  name,
  category,
  status,
  iconUrl,
  tagline,
  children,
  side = 'right',
  align = 'start',
}: AgentProfileCardProps) {
  const statusInfo = STATUS_LABEL[status] ?? STATUS_LABEL.stopped
  const categoryColor = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.general

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align={align}
        className="w-64 p-0 overflow-hidden border-border/60"
      >
        {/* Banner — category-tinted gradient strip */}
        <div className={`h-14 bg-gradient-to-r ${categoryGradient(category)}`} />

        {/* Avatar — overlapping the banner */}
        <div className="px-3 -mt-7">
          <div className="relative inline-block">
            <div className="rounded-2xl border-[3px] border-popover">
              <AgentAvatar
                name={name}
                category={category}
                iconUrl={iconUrl}
                size="lg"
              />
            </div>
            {/* Status dot */}
            <span
              className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-[3px] border-popover ${statusInfo.color}`}
            />
          </div>
        </div>

        {/* Info */}
        <div className="px-3 pt-1.5 pb-3 space-y-2.5">
          <div>
            <h4 className="text-sm font-bold leading-tight">{name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full ${categoryColor}`}>
                {category}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {statusInfo.text}
              </span>
            </div>
            {tagline && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {tagline}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Action links */}
          <div className="flex gap-1.5">
            <Link
              href={`/workspace/dm/${instanceId}`}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium py-1.5 transition-colors"
            >
              <MessageCircle className="size-3.5" />
              Message
            </Link>
            <Link
              href={`/workspace/agent/${instanceId}`}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-medium py-1.5 transition-colors"
            >
              <Settings2 className="size-3.5" />
              Config
            </Link>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function categoryGradient(category: string): string {
  const gradients: Record<string, string> = {
    productivity: 'from-blue-600/80 to-blue-500/60',
    research: 'from-emerald-600/80 to-emerald-500/60',
    writing: 'from-purple-600/80 to-purple-500/60',
    coding: 'from-amber-600/80 to-amber-500/60',
    business: 'from-rose-600/80 to-rose-500/60',
    creative: 'from-pink-600/80 to-pink-500/60',
    personal: 'from-cyan-600/80 to-cyan-500/60',
  }
  return gradients[category] ?? 'from-indigo-600/80 to-indigo-500/60'
}
