'use client'

import { useEffect, useRef, useState } from 'react'

interface UseGatewayReadyOptions {
  instanceId: string
  /** Skip the heartbeat check (e.g. for test/mock modes) */
  skip?: boolean
  /** Polling interval in ms (default 4000) */
  interval?: number
}

/**
 * Polls /api/agent/heartbeat until the agent's OpenClaw gateway is responsive.
 * Returns { ready, checking, error } so the UI can show appropriate status.
 */
export function useGatewayReady({
  instanceId,
  skip = false,
  interval = 4000,
}: UseGatewayReadyOptions) {
  const [ready, setReady] = useState(skip)
  const [checking, setChecking] = useState(!skip)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (skip) {
      setReady(true)
      setChecking(false)
      return
    }

    let cancelled = false

    const check = async () => {
      try {
        abortRef.current = new AbortController()
        const res = await fetch(
          `/api/agent/heartbeat?instanceId=${instanceId}`,
          { signal: abortRef.current.signal },
        )
        if (cancelled) return

        const data = await res.json()

        if (data.status === 'HEARTBEAT_OK') {
          setReady(true)
          setChecking(false)
          setError(null)
          return // Stop polling
        }

        // Not ready yet — schedule next check
        setError(data.error ?? null)
        timerRef.current = setTimeout(check, interval)
      } catch (err) {
        if (cancelled) return
        // Network error — keep polling
        setError(err instanceof Error ? err.message : 'Connection failed')
        timerRef.current = setTimeout(check, interval)
      }
    }

    check()

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [instanceId, skip, interval])

  return { ready, checking, error }
}
