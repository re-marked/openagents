import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@openagents/db/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProvisioningPoller } from '@/components/function/provisioning-poller'
import { OnboardingWizard } from '@/components/function/onboarding-wizard'
import { RemoveAgentButton } from '@/components/function/remove-agent-button'
import { AgentInitial } from '@/lib/agents'
import { getApiKeys } from '@/lib/settings/actions'

export default async function HomePage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // Check if user has API keys configured
  const apiKeys = await getApiKeys()
  const hasApiKeys = apiKeys.length > 0

  // Load user's agents
  const { data: instances } = await service
    .from('agent_instances')
    .select('id, display_name, status, team_id, created_at, agents!inner(name, slug, category, tagline)')
    .eq('user_id', user.id)
    .not('status', 'eq', 'destroyed')
    .order('created_at', { ascending: false })

  type HiredAgent = {
    instanceId: string
    name: string
    slug: string
    category: string
    tagline: string
    status: string
    teamId: string | null
  }

  const agents: HiredAgent[] = (instances ?? []).map((inst) => {
    const agent = (inst as Record<string, unknown>).agents as {
      name: string; slug: string; category: string; tagline: string
    }
    return {
      instanceId: inst.id,
      name: inst.display_name ?? agent.name,
      slug: agent.slug,
      category: agent.category,
      tagline: agent.tagline,
      status: inst.status,
      teamId: inst.team_id,
    }
  })

  // Get project ID for chat links
  let projectId: string | null = null
  const firstTeamId = agents.find((a) => a.teamId)?.teamId
  if (firstTeamId) {
    const { data: team } = await service
      .from('teams')
      .select('project_id')
      .eq('id', firstTeamId)
      .single()
    projectId = team?.project_id ?? null
  }

  const STATUS_BADGE: Record<string, { text: string; className: string }> = {
    running: { text: "Running", className: "bg-green-500/10 text-green-400 border-0" },
    suspended: { text: "Suspended", className: "bg-yellow-500/10 text-yellow-400 border-0" },
    provisioning: { text: "Provisioning...", className: "bg-blue-500/10 text-blue-400 border-0" },
    error: { text: "Error", className: "bg-red-500/10 text-red-400 border-0" },
    destroying: { text: "Removing...", className: "bg-orange-500/10 text-orange-400 border-0" },
  }

  return (
    <div className="px-8 py-8 lg:px-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Your Agents</h1>
          <p className="text-muted-foreground mt-1">
            {agents.length === 0
              ? "Hire your first assistant from the marketplace"
              : `${agents.length} agent${agents.length === 1 ? "" : "s"} in your workspace`}
          </p>
        </div>
        <Button asChild>
          <Link href="/discover">
            <Plus className="size-4 mr-2" />
            Hire Agent
          </Link>
        </Button>
      </div>

      {/* Onboarding / Empty state / Agent grid */}
      {!hasApiKeys && agents.length === 0 ? (
        <OnboardingWizard />
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card mb-5">
            <Plus className="h-9 w-9 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Browse the marketplace and hire your first AI assistant. They'll appear here ready to chat.
          </p>
          <Button size="lg" asChild>
            <Link href="/discover">
              Browse Marketplace
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const statusBadge = STATUS_BADGE[agent.status] ?? { text: agent.status, className: "bg-secondary" }
            const chatPath = agent.teamId && projectId
              ? `/workspace/p/${projectId}/t/${agent.teamId}/chat`
              : null
            const isProvisioning = agent.status === "provisioning"
            const isDestroying = agent.status === "destroying"

            return (
              <Card
                key={agent.instanceId}
                className="group border-0 gap-0 py-0 transition-all duration-200 hover:bg-accent"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <AgentInitial name={agent.name} category={agent.category} size="md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold leading-tight truncate">{agent.name}</h3>
                      <p className="text-[13px] text-muted-foreground mt-0.5 truncate">{agent.tagline}</p>
                      <Badge variant="secondary" className={`mt-1.5 text-[10px] ${statusBadge.className}`}>
                        {isProvisioning && <Loader2 className="inline size-3 mr-1 animate-spin" />}
                        {statusBadge.text}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  {chatPath && !isProvisioning && !isDestroying && agent.status !== 'error' && (
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

                  {/* Remove */}
                  <div className={`flex justify-end mt-2 transition-opacity ${agent.status === 'error' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <RemoveAgentButton instanceId={agent.instanceId} agentName={agent.name} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Poll provisioning agents */}
      <ProvisioningPoller
        instanceIds={agents.filter((a) => a.status === "provisioning").map((a) => a.instanceId)}
      />
    </div>
  )
}
