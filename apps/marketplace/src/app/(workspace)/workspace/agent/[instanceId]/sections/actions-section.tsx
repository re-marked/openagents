'use client'

import { useState } from 'react'
import { Power, RotateCcw, Pause, Square, Edit3, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { RemoveAgentButton } from '@/components/remove-agent-button'

interface ActionsSectionProps {
  instanceId: string
  agentName: string
  status: string
  onNameChange: (name: string) => void
}

export function ActionsSection({
  instanceId,
  agentName,
  status,
  onNameChange,
}: ActionsSectionProps) {
  const [waking, setWaking] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [suspending, setSuspending] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(agentName)
  const [exportingLogs, setExportingLogs] = useState(false)

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
      // polling picks up
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
      // polling picks up
    } finally {
      setRestarting(false)
    }
  }

  async function handleStop() {
    setStopping(true)
    try {
      await fetch('/api/agent/wake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentInstanceId: instanceId, action: 'stop' }),
      })
    } catch {
      // polling picks up
    } finally {
      setStopping(false)
    }
  }

  async function handleSuspend() {
    setSuspending(true)
    try {
      await fetch('/api/agent/wake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentInstanceId: instanceId, action: 'suspend' }),
      })
    } catch {
      // polling picks up
    } finally {
      setSuspending(false)
    }
  }

  async function handleRename() {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === agentName) return
    setRenaming(true)
    try {
      const res = await fetch('/api/agent/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, name: trimmed }),
      })
      if (res.ok) {
        onNameChange(trimmed)
      }
    } catch {
      // fail silently
    } finally {
      setRenaming(false)
    }
  }

  async function handleExportLogs() {
    setExportingLogs(true)
    try {
      const res = await fetch(`/api/agent/logs?instanceId=${instanceId}`)
      if (res.ok) {
        const data = await res.json()
        const logs = (data.logs ?? []) as Array<{ message?: string; timestamp?: string }>
        const text = logs
          .map((l) => `${l.timestamp ?? ''} ${l.message ?? JSON.stringify(l)}`)
          .join('\n')
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `agent-logs-${instanceId.slice(0, 8)}.txt`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      // fail silently
    } finally {
      setExportingLogs(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Actions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Control your agent's machine and manage settings.
        </p>
      </div>

      {/* Machine controls */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Machine Controls</h3>
        <div className="flex flex-wrap gap-2">
          {canWake && (
            <ActionButton
              icon={Power}
              label={status === 'stopped' ? 'Start Up' : 'Wake Up'}
              loading={waking}
              onClick={handleWake}
            />
          )}
          {isRunning && (
            <>
              <ActionButton
                icon={RotateCcw}
                label="Restart"
                loading={restarting}
                onClick={handleRestart}
              />
              <ActionButton
                icon={Pause}
                label="Suspend"
                loading={suspending}
                onClick={handleSuspend}
                variant="outline"
              />
              <ActionButton
                icon={Square}
                label="Stop"
                loading={stopping}
                onClick={handleStop}
                variant="outline"
              />
            </>
          )}
        </div>
      </div>

      {/* Rename */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Rename</h3>
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="max-w-xs text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleRename}
            disabled={!newName.trim() || newName.trim() === agentName || renaming}
          >
            {renaming ? (
              <Loader2 className="size-3 mr-1.5 animate-spin" />
            ) : (
              <Edit3 className="size-3 mr-1.5" />
            )}
            Rename
          </Button>
        </div>
      </div>

      {/* Export */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Export</h3>
        <ActionButton
          icon={Download}
          label="Export Logs"
          loading={exportingLogs}
          onClick={handleExportLogs}
          variant="outline"
        />
      </div>

      <Separator className="bg-border/40" />

      {/* Danger zone */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
        <p className="text-xs text-muted-foreground">
          Removing an agent will permanently delete its data and shut down the machine.
        </p>
        <RemoveAgentButton instanceId={instanceId} agentName={agentName} />
      </div>
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  loading,
  onClick,
  variant = 'default',
}: {
  icon: typeof Power
  label: string
  loading: boolean
  onClick: () => void
  variant?: 'default' | 'outline'
}) {
  return (
    <Button size="sm" variant={variant} onClick={onClick} disabled={loading}>
      {loading ? (
        <Loader2 className="size-3.5 mr-1.5 animate-spin" />
      ) : (
        <Icon className="size-3.5 mr-1.5" />
      )}
      {label}
    </Button>
  )
}
