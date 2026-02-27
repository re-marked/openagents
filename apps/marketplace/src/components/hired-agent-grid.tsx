'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RemoveAgentButton } from '@/components/remove-agent-button'
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
  running: { text: "Running", className: "bg-green-500/10 text-green-400 border-0" },
  suspended: { text: "Suspended", className: "bg-yellow-500/10 text-yellow-400 border-0" },
  stopped: { text: "Stopped", className: "bg-orange-500/10 text-orange-400 border-0" },
  provisioning: { text: "Provisioning...", className: "bg-blue-500/10 text-blue-400 border-0" },
  error: { text: "Error", className: "bg-red-500/10 text-red-400 border-0" },
  destroying: { text: "Removing...", className: "bg-orange-500/10 text-orange-400 border-0" },
}

interface HiredAgentGridProps {
  agents: HiredAgent[]
}

export function HiredAgentGrid({ agents: initialAgents }: HiredAgentGridProps) {
  const [agents, setAgents] = useState(initialAgents)

  function handleRemoved(instanceId: string) {
    setAgents((prev) => prev.filter((a) => a.instanceId !== instanceId))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {agents.map((agent) => {
        const statusBadge = STATUS_BADGE[agent.status] ?? { text: agent.status, className: "bg-secondary" }
        const chatPath = `/workspace/agent/${agent.instanceId}/chat`
        const isProvisioning = agent.status === "provisioning"
        const isDestroying = agent.status === "destroying"

        return (
          <Card
            key={agent.instanceId}
            className="group border-0 gap-0 py-0 transition-all duration-200 hover:bg-accent"
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <AgentAvatar name={agent.name} category={agent.category} iconUrl={agent.iconUrl} size="md" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold leading-tight truncate">{agent.name}</h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5 truncate">{agent.tagline}</p>
                  <Badge variant="secondary" className={`mt-1.5 text-[10px] ${statusBadge.className}`}>
                    {isProvisioning && <Loader2 className="inline size-3 mr-1 animate-spin" />}
                    {statusBadge.text}
                  </Badge>
                </div>
              </div>

              {!isProvisioning && !isDestroying && agent.status !== 'error' && (
                <Button variant="secondary" asChild className="w-full bg-primary/15 text-primary hover:bg-primary/25">
                  <Link href={chatPath}>
                    <MessageSquare className="size-4 mr-2" />
                    Open Chat
                  </Link>
                </Button>
              )}
              {isProvisioning && (
                <Button variant="secondary" disabled className="w-full">
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Setting up your agent...
                </Button>
              )}
              {agent.status === 'error' && (
                <Alert variant="destructive" className="border-0 bg-red-500/10 py-2">
                  <AlertDescription className="text-center text-red-400 text-sm">
                    Setup failed — remove and try again
                  </AlertDescription>
                </Alert>
              )}

              <div className={`flex justify-end mt-2 transition-opacity ${agent.status === 'error' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <RemoveAgentButton
                  instanceId={agent.instanceId}
                  agentName={agent.name}
                  onRemoved={() => handleRemoved(agent.instanceId)}
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
