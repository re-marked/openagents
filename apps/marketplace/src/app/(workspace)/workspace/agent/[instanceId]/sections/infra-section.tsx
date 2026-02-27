'use client'

import { useState, useEffect, useRef } from 'react'
import { RefreshCw, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LogEntry {
  message?: string
  timestamp?: string
  level?: string
}

interface InfraSectionProps {
  instanceId: string
  flyAppName: string
  flyMachineId: string
  status: string
}

export function InfraSection({
  instanceId,
  flyAppName,
  flyMachineId,
  status,
}: InfraSectionProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  async function loadLogs() {
    setLoadingLogs(true)
    try {
      const res = await fetch(`/api/agent/logs?instanceId=${instanceId}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs ?? [])
      }
    } catch {
      // fail silently
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(loadLogs, 10000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Infrastructure</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Machine details and recent logs from your agent&apos;s container.
        </p>
      </div>

      {/* Machine info */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Machine Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <InfoRow label="App Name" value={flyAppName} copyable onCopy={() => copyToClipboard(flyAppName, 'app')} copied={copied === 'app'} />
          <InfoRow label="Machine ID" value={flyMachineId} copyable onCopy={() => copyToClipboard(flyMachineId, 'machine')} copied={copied === 'machine'} />
          <InfoRow label="Region" value="iad (Virginia)" />
          <InfoRow label="Size" value="shared-cpu-2x / 2048 MB" />
          <InfoRow label="Status" value={status} />
        </div>
      </div>

      {/* Logs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Recent Logs</h3>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-border"
              />
              Auto-refresh
            </label>
            <Button size="sm" variant="ghost" onClick={loadLogs} disabled={loadingLogs}>
              <RefreshCw className={`size-3 ${loadingLogs ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-[hsl(30,3%,7%)] overflow-hidden">
          <div className="max-h-80 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
            {logs.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">
                {loadingLogs ? 'Loading logs...' : 'No logs available'}
              </p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-2 hover:bg-white/[0.02] px-1 py-0.5 rounded">
                  {log.timestamp && (
                    <span className="text-muted-foreground/60 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                  <span className={log.level === 'error' ? 'text-red-400' : 'text-foreground/80'}>
                    {log.message ?? JSON.stringify(log)}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  copyable,
  onCopy,
  copied,
}: {
  label: string
  value: string
  copyable?: boolean
  onCopy?: () => void
  copied?: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card/50 px-3 py-2">
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-xs font-mono mt-0.5">{value}</p>
      </div>
      {copyable && onCopy && (
        <button
          onClick={onCopy}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          {copied ? <Check className="size-3 text-green-400" /> : <Copy className="size-3" />}
        </button>
      )}
    </div>
  )
}
