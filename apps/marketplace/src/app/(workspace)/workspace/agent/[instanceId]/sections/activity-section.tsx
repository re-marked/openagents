'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Wrench,
  FileCode2,
  Terminal,
  Minimize2,
  MessageSquare,
  MessageCircle,
  AlertTriangle,
  Sparkles,
  Globe,
  X,
  Download,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

// ── Types ────────────────────────────────────────────────────────────────

type ActivityEventType =
  | 'tool_call'
  | 'file_change'
  | 'command_exec'
  | 'context_compaction'
  | 'message_sent'
  | 'message_received'
  | 'error'
  | 'skill_invoked'
  | 'api_call'

interface ActivityEvent {
  id: string
  type: ActivityEventType
  timestamp: string
  title: string
  summary: string
  durationMs: number
  metadata: Record<string, unknown>
}

interface ActivityData {
  events: ActivityEvent[]
  summary: {
    total: number
    byType: Record<string, number>
  }
}

// ── Config ───────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<ActivityEventType, { label: string; icon: LucideIcon; color: string; badgeCls: string }> = {
  tool_call:           { label: 'Tool Call',    icon: Wrench,         color: 'text-amber-400',   badgeCls: 'bg-amber-500/10 text-amber-400 border-0' },
  file_change:         { label: 'File Change',  icon: FileCode2,      color: 'text-emerald-400', badgeCls: 'bg-emerald-500/10 text-emerald-400 border-0' },
  command_exec:        { label: 'Command',      icon: Terminal,       color: 'text-violet-400',  badgeCls: 'bg-violet-500/10 text-violet-400 border-0' },
  context_compaction:  { label: 'Compaction',   icon: Minimize2,      color: 'text-cyan-400',    badgeCls: 'bg-cyan-500/10 text-cyan-400 border-0' },
  message_sent:        { label: 'Sent',         icon: MessageSquare,  color: 'text-blue-400',    badgeCls: 'bg-blue-500/10 text-blue-400 border-0' },
  message_received:    { label: 'Received',     icon: MessageCircle,  color: 'text-blue-400',    badgeCls: 'bg-blue-500/10 text-blue-400 border-0' },
  error:               { label: 'Error',        icon: AlertTriangle,  color: 'text-red-400',     badgeCls: 'bg-red-500/10 text-red-400 border-0' },
  skill_invoked:       { label: 'Skill',        icon: Sparkles,       color: 'text-purple-400',  badgeCls: 'bg-purple-500/10 text-purple-400 border-0' },
  api_call:            { label: 'API Call',     icon: Globe,          color: 'text-orange-400',  badgeCls: 'bg-orange-500/10 text-orange-400 border-0' },
}

const EVENTS_PER_PAGE = 15

// ── Helpers ──────────────────────────────────────────────────────────────

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDuration(ms: number): string {
  if (ms === 0) return ''
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}

function exportCsv(events: ActivityEvent[]) {
  const header = 'timestamp,type,title,summary,duration_ms'
  const rows = events.map((e) =>
    [e.timestamp, e.type, `"${e.title.replace(/"/g, '""')}"`, `"${e.summary.replace(/"/g, '""')}"`, e.durationMs].join(',')
  )
  const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `activity-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Component ────────────────────────────────────────────────────────────

export function ActivitySection({ instanceId }: { instanceId: string }) {
  const [data, setData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ instanceId, days: '30' })
      if (typeFilter !== 'all') params.set('type', typeFilter)
      const res = await fetch(`/api/agent/activity?${params}`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
        setPage(1)
      }
    } catch {
      // non-critical
    } finally {
      setLoading(false)
    }
  }, [instanceId, typeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
        </div>
        <Skeleton className="h-[480px] rounded-xl" />
      </div>
    )
  }

  if (!data) return <p className="text-sm text-muted-foreground">Failed to load activity data.</p>

  const totalPages = Math.ceil(data.events.length / EVENTS_PER_PAGE)
  const paged = data.events.slice((page - 1) * EVENTS_PER_PAGE, page * EVENTS_PER_PAGE)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Activity</h2>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v)}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(EVENT_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => exportCsv(data.events)}>
            <Download className="size-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(data.summary.byType)
          .sort(([, a], [, b]) => b - a)
          .map(([type, count]) => {
            const cfg = EVENT_CONFIG[type as ActivityEventType]
            if (!cfg) return null
            const isActive = typeFilter === type
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(isActive ? 'all' : type)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive ? cfg.badgeCls + ' ring-1 ring-current/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {cfg.label}
                <span className="tabular-nums">{count}</span>
              </button>
            )
          })}
        <span className="inline-flex items-center px-2 text-[11px] text-muted-foreground/60">
          {data.summary.total} total
        </span>
      </div>

      {/* Timeline + Detail panel (side by side like brain graph) */}
      <div className="flex gap-3 items-stretch">
        {/* Timeline list */}
        <div
          className={`rounded-xl border border-border/40 bg-card/50 overflow-hidden flex flex-col shrink-0 transition-all duration-200 ${
            selectedEvent ? 'w-[55%]' : 'w-full'
          }`}
          style={{ height: 480 }}
        >
          <ScrollArea className="flex-1 min-h-0">
            {paged.length === 0 ? (
              <div className="flex items-center justify-center h-full py-20 text-sm text-muted-foreground">
                No activity events found.
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {paged.map((event) => {
                  const cfg = EVENT_CONFIG[event.type]
                  const Icon = cfg.icon
                  const isSelected = selectedEvent?.id === event.id
                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(isSelected ? null : event)}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
                        isSelected ? 'bg-muted/50' : 'hover:bg-muted/30'
                      }`}
                    >
                      <div className={`shrink-0 flex items-center justify-center size-8 rounded-lg bg-muted/50 ${cfg.color}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{event.title}</span>
                          {!selectedEvent && (
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.badgeCls}`}>
                              {cfg.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{event.summary}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-0.5">
                        <span className="text-[11px] text-muted-foreground/60">{relativeTime(event.timestamp)}</span>
                        {event.durationMs > 0 && (
                          <span className="text-[10px] tabular-nums text-muted-foreground/40">{formatDuration(event.durationMs)}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {totalPages > 1 && (
            <div className="border-t border-border/40 px-5 py-2.5 shrink-0">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="cursor-pointer">
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        {/* Detail panel — slides in from right like knowledge graph */}
        <AnimatePresence mode="wait">
          {selectedEvent && (
            <motion.div
              key={selectedEvent.id}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '45%' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden min-w-0"
            >
              <ActivityDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Detail Panel (inline, not a drawer) ──────────────────────────────────

function ActivityDetailPanel({ event, onClose }: { event: ActivityEvent; onClose: () => void }) {
  const cfg = EVENT_CONFIG[event.type]
  const Icon = cfg.icon
  const meta = event.metadata

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-4 h-[480px] flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0 flex items-center gap-2.5">
          <div className={`shrink-0 flex items-center justify-center size-9 rounded-xl bg-muted/50 ${cfg.color}`}>
            <Icon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold truncate">{event.title}</h3>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${cfg.badgeCls}`}>
                {cfg.label}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {new Date(event.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' })}
              {event.durationMs > 0 && <span className="ml-1.5">· {formatDuration(event.durationMs)}</span>}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="mt-3 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs text-muted-foreground">
        {/* Summary */}
        <div>
          <h4 className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1.5">Summary</h4>
          <p className="text-sm text-foreground/80">{event.summary}</p>
        </div>

        {/* Type-specific content */}
        {event.type === 'tool_call' && <ToolCallDetail meta={meta} />}
        {event.type === 'file_change' && <FileChangeDetail meta={meta} />}
        {event.type === 'command_exec' && <CommandExecDetail meta={meta} />}
        {event.type === 'context_compaction' && <CompactionDetail meta={meta} />}
        {event.type === 'error' && <ErrorDetail meta={meta} />}
        {event.type === 'api_call' && <ApiCallDetail meta={meta} />}
        {event.type === 'skill_invoked' && <SkillDetail meta={meta} />}
      </div>
    </div>
  )
}

// ── Type-specific detail panels ──────────────────────────────────────────

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div>
      {label && <h4 className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1.5">{label}</h4>}
      <pre className="rounded-lg bg-muted/50 border border-border/30 p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
        {children}
      </pre>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function ToolCallDetail({ meta }: { meta: Record<string, unknown> }) {
  return (
    <>
      <DetailRow label="Tool" value={String(meta.tool ?? '')} />
      <DetailRow label="Result" value={String(meta.result ?? '')} />
      {meta.outputLength && <DetailRow label="Output" value={`${meta.outputLength} bytes`} />}
      {meta.args && <CodeBlock label="Arguments">{JSON.stringify(meta.args, null, 2)}</CodeBlock>}
    </>
  )
}

function FileChangeDetail({ meta }: { meta: Record<string, unknown> }) {
  return (
    <>
      <DetailRow label="Path" value={<span className="font-mono text-xs">{String(meta.path ?? '')}</span>} />
      <DetailRow label="Action" value={
        <Badge variant="outline" className={
          meta.action === 'created' ? 'bg-emerald-500/10 text-emerald-400 border-0'
          : meta.action === 'deleted' ? 'bg-red-500/10 text-red-400 border-0'
          : 'bg-blue-500/10 text-blue-400 border-0'
        }>{String(meta.action ?? '')}</Badge>
      } />
      <DetailRow label="Lines added" value={`+${meta.linesAdded ?? 0}`} />
      <DetailRow label="Lines removed" value={`-${meta.linesRemoved ?? 0}`} />
      {meta.diff && <CodeBlock label="Diff">{String(meta.diff)}</CodeBlock>}
    </>
  )
}

function CommandExecDetail({ meta }: { meta: Record<string, unknown> }) {
  return (
    <>
      <CodeBlock label="Command">{String(meta.command ?? '')}</CodeBlock>
      <DetailRow label="Exit code" value={
        <Badge variant="outline" className={
          meta.exitCode === 0 ? 'bg-emerald-500/10 text-emerald-400 border-0' : 'bg-red-500/10 text-red-400 border-0'
        }>{String(meta.exitCode ?? '')}</Badge>
      } />
      {meta.stdout && <CodeBlock label="stdout">{String(meta.stdout)}</CodeBlock>}
      {meta.stderr && <CodeBlock label="stderr">{String(meta.stderr)}</CodeBlock>}
    </>
  )
}

function CompactionDetail({ meta }: { meta: Record<string, unknown> }) {
  return (
    <>
      <DetailRow label="Tokens before" value={Number(meta.tokensBefore ?? 0).toLocaleString()} />
      <DetailRow label="Tokens after" value={Number(meta.tokensAfter ?? 0).toLocaleString()} />
      <DetailRow label="Reduction" value={`${meta.ratio ?? 0}%`} />
      <DetailRow label="Messages dropped" value={String(meta.messagesDropped ?? 0)} />
    </>
  )
}

function ErrorDetail({ meta }: { meta: Record<string, unknown> }) {
  return (
    <>
      <DetailRow label="Message" value={String(meta.message ?? '')} />
      {meta.recoveryAction && <DetailRow label="Recovery" value={String(meta.recoveryAction)} />}
      {meta.stack && <CodeBlock label="Stack Trace">{String(meta.stack)}</CodeBlock>}
    </>
  )
}

function ApiCallDetail({ meta }: { meta: Record<string, unknown> }) {
  return (
    <>
      <DetailRow label="Method" value={String(meta.method ?? '')} />
      <DetailRow label="Endpoint" value={<span className="font-mono text-xs">{String(meta.endpoint ?? '')}</span>} />
      <DetailRow label="Status" value={
        <Badge variant="outline" className={
          Number(meta.status) < 300 ? 'bg-emerald-500/10 text-emerald-400 border-0'
          : Number(meta.status) < 500 ? 'bg-amber-500/10 text-amber-400 border-0'
          : 'bg-red-500/10 text-red-400 border-0'
        }>{String(meta.status ?? '')}</Badge>
      } />
      <DetailRow label="Latency" value={`${meta.latencyMs ?? 0}ms`} />
      {meta.responsePreview && <CodeBlock label="Response">{String(meta.responsePreview)}</CodeBlock>}
    </>
  )
}

function SkillDetail({ meta }: { meta: Record<string, unknown> }) {
  return (
    <>
      <DetailRow label="Skill" value={<span className="font-mono text-xs">/{String(meta.skill ?? '')}</span>} />
      <DetailRow label="Success" value={
        <Badge variant="outline" className={
          meta.success ? 'bg-emerald-500/10 text-emerald-400 border-0' : 'bg-red-500/10 text-red-400 border-0'
        }>{meta.success ? 'Yes' : 'No'}</Badge>
      } />
      {meta.args && <DetailRow label="Arguments" value={String(meta.args)} />}
    </>
  )
}
