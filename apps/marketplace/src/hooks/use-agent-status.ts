'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type AgentStatus = 'running' | 'suspended' | 'stopped' | 'provisioning' | 'error' | string

interface UseAgentStatusOptions {
  instanceId: string
  initialStatus: AgentStatus
  /** Polling interval in ms (default 5000) */
  interval?: number
  /** Whether to poll (default true) */
  enabled?: boolean
}

export function useAgentStatus({
  instanceId,
  initialStatus,
  interval = 5000,
  enabled = true,
}: UseAgentStatusOptions) {
  const [status, setStatus] = useState<AgentStatus>(initialStatus)
  const [isPolling, setIsPolling] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setIsPolling(false)
  }, [])

  useEffect(() => {
    if (!enabled) {
      stopPolling()
      return
    }

    setIsPolling(true)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/agent/status?instanceId=${instanceId}`)
        if (!res.ok) return
        const data = await res.json()
        setStatus(data.status)
      } catch {
        // Ignore transient fetch errors
      }
    }, interval)

    return stopPolling
  }, [instanceId, interval, enabled, stopPolling])

  return { status, setStatus, isPolling, stopPolling }
}
