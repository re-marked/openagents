'use client'

import { useState, useRef, useEffect } from 'react'
import { Power, RotateCcw, Pause, Square, Pencil, Download, Loader2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { RemoveAgentButton } from '@/components/remove-agent-button'

interface ActionsSectionProps {
  instanceId: string
  agentName: string
  agentSlug?: string
  status: string
  onNameChange: (name: string) => void
  onWake?: () => void
}

export function ActionsSection({
  instanceId,
  agentName,
  agentSlug,
  status,
  onNameChange,
  onWake,
}: ActionsSectionProps) {
  const [restarting, setRestarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [suspending, setSuspending] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(agentName)
  const [exportingLogs, setExportingLogs] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingName && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [isEditingName])

  const isRunning = status === 'running'
  const isStarting = status === 'starting'
  const canWake = status === 'suspended' || status === 'stopped'

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
    if (!trimmed || trimmed === agentName) {
      setIsEditingName(false)
      setNewName(agentName)
      return
    }
    setRenaming(true)
    try {
      const res = await fetch('/api/agent/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, name: trimmed }),
      })
      if (res.ok) {
        onNameChange(trimmed)
        toast.success('Agent renamed')
      }
    } catch {
      toast.error('Failed to rename agent')
    } finally {
      setRenaming(false)
      setIsEditingName(false)
    }
  }

  function cancelRename() {
    setIsEditingName(false)
    setNewName(agentName)
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
          {canWake && onWake && (
            <ActionButton
              icon={Power}
              label={status === 'stopped' ? 'Start Up' : 'Wake Up'}
              loading={false}
              onClick={onWake}
            />
          )}
          {isStarting && (
            <ActionButton
              icon={Power}
              label="Starting up..."
              loading={true}
              onClick={() => {}}
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

      {/* Nickname */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Nickname</h3>
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <Input
              ref={renameInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="max-w-xs text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') cancelRename()
              }}
              onBlur={() => {
                // Small delay so button clicks register before blur fires
                setTimeout(() => {
                  if (!renaming) cancelRename()
                }, 150)
              }}
              disabled={renaming}
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
                <Check className="size-3 mr-1.5" />
              )}
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelRename}
              disabled={renaming}
            >
              <X className="size-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="group flex items-center gap-2 rounded-md px-2 py-1 -ml-2 hover:bg-accent/50 transition-colors"
            >
              <span className="text-sm font-medium">{agentName}</span>
              <Pencil className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        )}
        {agentSlug && (
          <p className="text-xs text-muted-foreground">
            Username: <span className="font-mono text-foreground/60">@{agentSlug}</span>
            <span className="ml-1 text-muted-foreground/60">· not changeable</span>
          </p>
        )}
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
