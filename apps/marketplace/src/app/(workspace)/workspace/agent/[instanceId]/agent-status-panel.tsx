'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  running: { label: 'Running', dot: 'bg-green-500', bg: 'bg-green-500/10 text-green-400 ring-green-500/20' },
  suspended: { label: 'Suspended', dot: 'bg-yellow-500', bg: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20' },
  stopped: { label: 'Stopped', dot: 'bg-orange-500', bg: 'bg-orange-500/10 text-orange-400 ring-orange-500/20' },
  provisioning: { label: 'Provisioning', dot: 'bg-blue-500 animate-pulse', bg: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
  error: { label: 'Error', dot: 'bg-red-500', bg: 'bg-red-500/10 text-red-400 ring-red-500/20' },
}

const CATEGORY_COLOR: Record<string, string> = {
  productivity: 'bg-blue-500',
  research: 'bg-emerald-500',
  writing: 'bg-purple-500',
  coding: 'bg-amber-500',
  business: 'bg-rose-500',
  creative: 'bg-pink-500',
  personal: 'bg-cyan-500',
}

interface AgentStatusPanelProps {
  instanceId: string
  agentName: string
  agentCategory: string
  initialStatus: string
}

export function AgentStatusPanel({
  instanceId,
  agentName,
  agentCategory,
  initialStatus,
}: AgentStatusPanelProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [isWaking, setIsWaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // Poll status while waking
  useEffect(() => {
    if (!isWaking) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/agent/status?instanceId=${instanceId}`)
        if (!res.ok) return
        const data = await res.json()
        setStatus(data.status)
        if (data.status === 'running') {
          stopPolling()
          setIsWaking(false)
          router.push(`/workspace/agent/${instanceId}/chat`)
        }
      } catch {
        // Ignore transient fetch errors during polling
      }
    }, 2000)

    return stopPolling
  }, [isWaking, instanceId, router, stopPolling])

  async function handleWake() {
    setIsWaking(true)
    setError(null)
    try {
      const res = await fetch('/api/agent/wake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentInstanceId: instanceId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to wake agent' }))
        setError(data.error)
        setIsWaking(false)
      }
    } catch {
      setError('Network error — please try again')
      setIsWaking(false)
    }
  }

  const cfg = STATUS_CONFIG[status] ?? { label: status, dot: 'bg-zinc-400', bg: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20' }
  const avatarBg = CATEGORY_COLOR[agentCategory] ?? 'bg-zinc-500'

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        {/* Agent avatar */}
        <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${avatarBg} text-3xl font-bold text-white shadow-lg`}>
          {agentName[0]}
        </div>

        {/* Agent name */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{agentName}</h1>
          <p className="text-muted-foreground text-sm mt-1 capitalize">{agentCategory}</p>
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${cfg.bg}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>

        {/* Actions */}
        {(status === 'suspended' || status === 'stopped') && !isWaking && (
          <Button size="lg" onClick={handleWake}>
            {status === 'stopped' ? 'Start Up' : 'Wake Up'}
          </Button>
        )}

        {isWaking && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Waking up…
            </div>
            <p className="text-xs text-muted-foreground/70">This usually takes a few seconds</p>
          </div>
        )}

        {status === 'running' && !isWaking && (
          <Button size="lg" onClick={() => router.push(`/workspace/agent/${instanceId}/chat`)}>
            Open Chat
          </Button>
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  )
}
