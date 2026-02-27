'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  Power,
  RotateCcw,
  Clock,
  MessagesSquare,
  CalendarDays,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AgentAvatar } from '@/lib/agents'
import { STATUS_CONFIG } from '../agent-home'

// ── Types ────────────────────────────────────────────────────────────────

interface ActivityItem {
  sessionId: string
  startedAt: string
  endedAt: string | null
  preview: string
  messageCount: number
  durationMinutes: number
}

interface StatsData {
  relationship: {
    totalConversations: number
    totalMessages: number
    totalMinutes: number
    longestSessionMinutes: number
    skillsCount: number
    memoriesCount: number
  }
  recentActivity: ActivityItem[]
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks}w ago`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTotalTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ── Component ────────────────────────────────────────────────────────────

interface OverviewSectionProps {
  instanceId: string
  status: string
  currentName: string
  agentName: string
  agentSlug: string
  agentCategory: string
  agentTagline: string | null
  agentIconUrl: string | null
  createdAt: string
  onNameChange: (name: string) => void
}

export function OverviewSection({
  instanceId,
  status,
  currentName,
  agentName,
  agentCategory,
  agentTagline,
  agentIconUrl,
  createdAt,
}: OverviewSectionProps) {
  const router = useRouter()
  const [waking, setWaking] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    dot: 'bg-zinc-400',
    bg: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
  }
  const isRunning = status === 'running'
  const canWake = status === 'suspended' || status === 'stopped'

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/agent/stats?instanceId=${instanceId}`)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch {
        // Stats are non-critical — fail silently
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [instanceId])

  async function handleWake() {
    setWaking(true)
    try {
      await fetch('/api/agent/wake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentInstanceId: instanceId }),
      })
    } catch {
      // polling will pick up
    } finally {
      setWaking(false)
    }
  }

  async function handleRestart() {
    setRestarting(true)
    try {
      await fetch('/api/agent/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId }),
      })
    } catch {
      // polling will pick up
    } finally {
      setRestarting(false)
    }
  }

  const hiredDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="space-y-8">
      {/* Agent identity */}
      <div className="flex items-start gap-5">
        <AgentAvatar
          name={agentName}
          category={agentCategory}
          iconUrl={agentIconUrl}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight truncate">
            {currentName}
          </h1>
          {agentTagline && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {agentTagline}
              <span className="mx-1.5 text-border">·</span>
              <span className="capitalize">{agentCategory}</span>
            </p>
          )}
          {!agentTagline && (
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">{agentCategory}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.bg}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {isRunning && (
              <Button
                size="sm"
                onClick={() => router.push(`/workspace/agent/${instanceId}/chat`)}
              >
                <MessageSquare className="size-3.5 mr-1.5" />
                Open Chat
              </Button>
            )}
            {canWake && (
              <Button size="sm" onClick={handleWake} disabled={waking}>
                <Power className="size-3.5 mr-1.5" />
                {waking ? 'Starting...' : status === 'stopped' ? 'Start Up' : 'Wake Up'}
              </Button>
            )}
            {isRunning && (
              <Button size="sm" variant="outline" onClick={handleRestart} disabled={restarting}>
                <RotateCcw className="size-3.5 mr-1.5" />
                {restarting ? 'Restarting...' : 'Restart'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Relationship stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/40 bg-card/50 px-4 py-4">
              <Skeleton className="h-7 w-12 mb-1.5" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={MessagesSquare}
            value={stats ? String(stats.relationship.totalConversations) : '0'}
            label="Conversations"
          />
          <StatCard
            icon={Clock}
            value={stats ? formatTotalTime(stats.relationship.totalMinutes) : '0m'}
            label="Together"
          />
          <StatCard
            icon={Zap}
            value={stats ? String(stats.relationship.totalMessages) : '0'}
            label="Messages"
          />
          <StatCard
            icon={CalendarDays}
            value={hiredDate}
            label="Hired"
          />
        </div>
      )}

      {/* Activity feed */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-4">Recent Activity</h2>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-2 w-2 rounded-full mt-2 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-4 w-full max-w-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : stats && stats.recentActivity.length > 0 ? (
          <div className="space-y-1">
            {stats.recentActivity.map((item) => (
              <ActivityEntry key={item.sessionId} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 bg-card/50 px-6 py-10 text-center">
            <MessageSquare className="size-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No conversations yet.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Start chatting to see your activity here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Subcomponents ────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock
  value: string
  label: string
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 px-4 py-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="size-3.5 text-muted-foreground/60" />
        <span className="text-2xl font-bold tracking-tight leading-none">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function ActivityEntry({ item }: { item: ActivityItem }) {
  return (
    <button
      className="flex items-start gap-3 w-full text-left rounded-lg px-3 py-2.5 -mx-3 transition-colors hover:bg-accent/50 group"
      onClick={() => {
        // Future: navigate to session
      }}
    >
      <span className="relative mt-[7px] shrink-0">
        <span className="block h-2 w-2 rounded-full bg-foreground/20 group-hover:bg-foreground/40 transition-colors" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatRelativeTime(item.startedAt)}</span>
          <span className="text-border">·</span>
          <span>{formatDuration(item.durationMinutes)}</span>
          <span className="text-border">·</span>
          <span>{item.messageCount} messages</span>
        </div>
        <p className="text-sm mt-0.5 truncate text-foreground/80">
          &ldquo;{item.preview}&rdquo;
        </p>
      </div>
    </button>
  )
}
