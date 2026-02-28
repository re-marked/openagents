'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  Power,
  RotateCcw,
  Clock,
  CalendarDays,
  Zap,
  DollarSign,
  Brain,
  BarChart3,
} from 'lucide-react'
import { Bar, BarChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AgentAvatar } from '@/lib/agents'
import { STATUS_CONFIG } from '../agent-home'
import { KnowledgeGraph } from './knowledge-graph'

// ── Types ────────────────────────────────────────────────────────────────

interface TimeSeriesEntry {
  date: string
  messages: number
  minutes: number
  cost: number
}

interface StatsData {
  relationship: {
    totalConversations: number
    totalMessages: number
    totalMinutes: number
    totalCost: number
    longestSessionMinutes: number
    skillsCount: number
    memoriesCount: number
  }
  recentActivity: unknown[]
  timeSeries: TimeSeriesEntry[]
}

type Timeframe = '24h' | '7d' | '30d'

// ── Helpers ──────────────────────────────────────────────────────────────

function formatTotalTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatCost(credits: number): string {
  if (credits === 0) return '0'
  if (credits < 1) return `${credits.toFixed(1)}`
  if (credits < 10) return `${credits.toFixed(1)}`
  return `${Math.round(credits)}`
}

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function sliceTimeSeries(data: TimeSeriesEntry[], timeframe: Timeframe): TimeSeriesEntry[] {
  switch (timeframe) {
    case '24h':
      return data.slice(-1)
    case '7d':
      return data.slice(-7)
    case '30d':
      return data
  }
}

function sumField(data: TimeSeriesEntry[], field: keyof Omit<TimeSeriesEntry, 'date'>): number {
  return data.reduce((sum, d) => sum + d[field], 0)
}

// ── Chart configs (one per stat, different colors) ───────────────────────

const costChartConfig = {
  cost: { label: 'Credits', color: 'hsl(var(--primary))' },
} satisfies ChartConfig

const minutesChartConfig = {
  minutes: { label: 'Minutes', color: 'hsl(160, 60%, 45%)' },
} satisfies ChartConfig

const messagesChartConfig = {
  messages: { label: 'Messages', color: 'hsl(35, 90%, 55%)' },
} satisfies ChartConfig

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
  onNavigate?: (section: string) => void
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
  onNavigate,
}: OverviewSectionProps) {
  const router = useRouter()
  const [waking, setWaking] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<Timeframe>('7d')

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
        // Stats are non-critical
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

  // Slice time series for selected timeframe
  const sliced = useMemo(
    () => (stats ? sliceTimeSeries(stats.timeSeries, timeframe) : []),
    [stats, timeframe]
  )

  const costTotal = useMemo(() => sumField(sliced, 'cost'), [sliced])
  const minutesTotal = useMemo(() => sumField(sliced, 'minutes'), [sliced])
  const messagesTotal = useMemo(() => sumField(sliced, 'messages'), [sliced])

  return (
    <div className="space-y-8">
      {/* ── Agent identity ──────────────────────────────────────────── */}
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

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-muted-foreground/60" />
            <h2 className="text-base font-semibold text-muted-foreground">Stats</h2>
          </div>
          <TimeframeToggle value={timeframe} onChange={setTimeframe} />
        </div>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/40 bg-card/50 px-5 py-5">
              <Skeleton className="h-9 w-16 mb-3" />
              <Skeleton className="h-16 w-full mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Cost */}
          <SparklineCard
            icon={DollarSign}
            value={formatCost(costTotal)}
            unit="credits"
            label="Cost"
            chartConfig={costChartConfig}
            data={sliced}
            dataKey="cost"
            headerAction={
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => onNavigate?.('usage')}
              >
                Full Breakdown →
              </Button>
            }
          />

          {/* Together */}
          <SparklineCard
            icon={Clock}
            value={formatTotalTime(minutesTotal)}
            label="Together"
            chartConfig={minutesChartConfig}
            data={sliced}
            dataKey="minutes"
          />

          {/* Messages */}
          <SparklineCard
            icon={Zap}
            value={String(messagesTotal)}
            label="Messages"
            chartConfig={messagesChartConfig}
            data={sliced}
            dataKey="messages"
          />

          {/* Hired — static, no sparkline */}
          <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-5 flex flex-col">
            <div className="flex items-center gap-2.5 mb-2">
              <CalendarDays className="size-4 text-muted-foreground/60" />
              <span className="text-3xl font-bold tracking-tight leading-none">{hiredDate}</span>
            </div>
            <div className="flex-1 min-h-16" />
            <p className="text-sm text-muted-foreground">Hired</p>
          </div>
        </div>
      )}
      </div>

      {/* ── Brain (Knowledge Graph) ─────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="size-5 text-muted-foreground/60" />
          <h2 className="text-base font-semibold text-muted-foreground">Brain</h2>
        </div>
        <KnowledgeGraph instanceId={instanceId} />
      </div>
    </div>
  )
}

// ── Subcomponents ────────────────────────────────────────────────────────

function TimeframeToggle({
  value,
  onChange,
}: {
  value: Timeframe
  onChange: (tf: Timeframe) => void
}) {
  const options: Timeframe[] = ['24h', '7d', '30d']

  return (
    <div className="flex items-center rounded-lg bg-muted/50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            value === opt
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function SparklineCard({
  icon: Icon,
  value,
  unit,
  label,
  chartConfig,
  data,
  dataKey,
  headerAction,
}: {
  icon: typeof Clock
  value: string
  unit?: string
  label: string
  chartConfig: ChartConfig
  data: TimeSeriesEntry[]
  dataKey: string
  headerAction?: React.ReactNode
}) {
  const hasData = data.some((d) => d[dataKey as keyof TimeSeriesEntry] as number > 0)

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-5 flex flex-col">
      <div className="flex items-center gap-2.5 mb-2">
        <Icon className="size-4 text-muted-foreground/60" />
        <span className="text-3xl font-bold tracking-tight leading-none">{value}</span>
        {unit && (
          <span className="text-sm text-muted-foreground/60 font-medium self-end mb-0.5">{unit}</span>
        )}
        {headerAction && <div className="ml-auto">{headerAction}</div>}
      </div>

      {/* Sparkline with tooltip */}
      <div className="h-16 mt-1">
        {hasData && data.length > 1 ? (
          <ChartContainer config={chartConfig} className="h-16 w-full">
            <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                content={
                  <ChartTooltipContent
                    hideIndicator
                    labelFormatter={(_, payload) => {
                      const entry = payload?.[0]?.payload as TimeSeriesEntry | undefined
                      return entry ? formatTooltipDate(entry.date) : ''
                    }}
                  />
                }
              />
              <Bar
                dataKey={dataKey}
                fill={`var(--color-${dataKey})`}
                radius={[3, 3, 0, 0]}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-full flex items-end">
            <div className="w-full h-[2px] bg-border/30 rounded-full" />
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mt-2">{label}</p>
    </div>
  )
}
