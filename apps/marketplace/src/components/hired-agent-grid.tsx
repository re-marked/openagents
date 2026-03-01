'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageSquare, Loader2, Settings, Plus, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AgentAvatar } from '@/lib/agents'

export interface HiredAgent {
  instanceId: string
  name: string
  slug: string
  category: string
  tagline: string
  status: string
  iconUrl: string | null
}

const STATUS_BADGE: Record<string, { text: string; className: string }> = {
  running: { text: "Running", className: "bg-status-running/10 text-status-running border-0" },
  starting: { text: "Starting up...", className: "bg-status-provisioning/10 text-status-provisioning border-0" },
  suspended: { text: "Suspended", className: "bg-status-suspended/10 text-status-suspended border-0" },
  stopped: { text: "Stopped", className: "bg-status-stopped/10 text-status-stopped border-0" },
  provisioning: { text: "Provisioning...", className: "bg-status-provisioning/10 text-status-provisioning border-0" },
  error: { text: "Error", className: "bg-status-error/10 text-status-error border-0" },
  destroying: { text: "Removing...", className: "bg-status-stopped/10 text-status-stopped border-0" },
}

interface HiredAgentGridProps {
  agents: HiredAgent[]
}

export function HiredAgentGrid({ agents }: HiredAgentGridProps) {
  const router = useRouter()
  const [wakingIds, setWakingIds] = useState<Set<string>>(new Set())

  async function handleWake(instanceId: string) {
    setWakingIds((prev) => new Set(prev).add(instanceId))
    try {
      await fetch('/api/agent/wake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentInstanceId: instanceId }),
      })
    } catch {
      setWakingIds((prev) => {
        const next = new Set(prev)
        next.delete(instanceId)
        return next
      })
    }
  }

  // Clear waking state when an agent becomes running (via parent re-render with fresh data)
  useEffect(() => {
    for (const agent of agents) {
      if (agent.status === 'running' && wakingIds.has(agent.instanceId)) {
        setWakingIds((prev) => {
          const next = new Set(prev)
          next.delete(agent.instanceId)
          return next
        })
      }
    }
  }, [agents, wakingIds])

  const MIN_SLOTS = 6
  const emptySlots = Math.max(0, MIN_SLOTS - agents.length)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {agents.map((agent) => {
        const isWaking = wakingIds.has(agent.instanceId)
        const effectiveStatus = isWaking && agent.status !== 'running' ? 'starting' : agent.status
        const statusBadge = STATUS_BADGE[effectiveStatus] ?? { text: effectiveStatus, className: "bg-secondary" }
        const homePath = `/workspace/agent/${agent.instanceId}`
        const chatPath = `${homePath}/chat`
        const isProvisioning = effectiveStatus === "provisioning"
        const isStarting = effectiveStatus === "starting"
        const canWake = effectiveStatus === "suspended" || effectiveStatus === "stopped"

        return (
          <Card
            key={agent.instanceId}
            className="group relative border-0 gap-0 py-0 cursor-pointer transition-colors hover:bg-card/80"
            onClick={() => router.push(homePath)}
          >
            <CardContent className="p-5 min-h-[180px] flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <AgentAvatar name={agent.name} category={agent.category} iconUrl={agent.iconUrl} size="md" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold leading-tight truncate">{agent.name}</h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5 truncate">{agent.tagline}</p>
                  <Badge variant="secondary" className={`mt-1.5 text-[10px] ${statusBadge.className}`}>
                    {(isProvisioning || isStarting) && <Loader2 className="inline size-3 mr-1 animate-spin" />}
                    {statusBadge.text}
                  </Badge>
                </div>
              </div>

              <div className="flex-1" />
              {effectiveStatus === 'running' && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    asChild
                    className="flex-1 bg-primary/15 text-primary hover:bg-primary/25"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={chatPath}>
                      <MessageSquare className="size-4 mr-2" />
                      Chat
                    </Link>
                  </Button>
                  <Button
                    variant="secondary"
                    asChild
                    className="flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={homePath}>
                      <Settings className="size-4 mr-2" />
                      Agent Config
                    </Link>
                  </Button>
                </div>
              )}
              {canWake && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 bg-primary/15 text-primary hover:bg-primary/25"
                    onClick={(e) => { e.stopPropagation(); handleWake(agent.instanceId) }}
                  >
                    <Power className="size-4 mr-2" />
                    {effectiveStatus === 'stopped' ? 'Start Up' : 'Wake Up'}
                  </Button>
                  <Button
                    variant="secondary"
                    asChild
                    className="flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={homePath}>
                      <Settings className="size-4 mr-2" />
                      Agent Config
                    </Link>
                  </Button>
                </div>
              )}
              {isStarting && (
                <><Button variant="secondary" disabled className="w-full">
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Starting up...
                </Button><div className="text-center text-sm text-muted-foreground">
                    (This might take anywhere from 30 seconds to 5 minutes)
                  </div></>
              )}
              {isProvisioning && (
                <><Button variant="secondary" disabled className="w-full">
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Setting up your agent...
                </Button>
                <div className="text-red text-center text-xs text-muted-foreground mt-3">
                    (This might take anywhere from 1 to 5 minutes)
                  </div></>
              )}
              {agent.status === 'error' && (
                <div className="space-y-2">
                  <Alert variant="destructive" className="border-0 bg-status-error/10 py-2">
                    <AlertDescription className="text-center text-status-error text-sm">
                      Setup failed — remove from Agent Config
                    </AlertDescription>
                  </Alert>
                  <Button
                    variant="secondary"
                    asChild
                    className="w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={homePath}>
                      <Settings className="size-4 mr-2" />
                      Agent Config
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {Array.from({ length: emptySlots }).map((_, i) => (
        <Link
          key={`empty-${i}`}
          href="/discover"
          className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/40 transition-colors hover:border-border/60 hover:bg-card/30"
        >
          <div className="flex size-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
            <Plus className="size-5 text-muted-foreground/40" />
          </div>
          <span className="text-sm text-muted-foreground/50">
            Add an Agent to your team
          </span>
        </Link>
      ))}
    </div>
  )
}
