'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Power, RotateCcw, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AgentAvatar } from '@/lib/agents'
import { STATUS_CONFIG } from '../agent-home'

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

  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    dot: 'bg-zinc-400',
    bg: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
  }
  const isRunning = status === 'running'
  const canWake = status === 'suspended' || status === 'stopped'

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

  const createdDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="space-y-8">
      {/* Agent identity card */}
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
            <p className="text-sm text-muted-foreground mt-0.5">{agentTagline}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.bg}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <span className="text-xs text-muted-foreground capitalize">{agentCategory}</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
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

      {/* Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoCard
          icon={Calendar}
          label="Hired"
          value={createdDate}
        />
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
