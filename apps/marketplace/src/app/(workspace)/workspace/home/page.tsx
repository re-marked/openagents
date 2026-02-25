import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@openagents/db/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProvisioningPoller } from '@/components/function/provisioning-poller'
import { OnboardingWizard } from '@/components/function/onboarding-wizard'
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

  const CATEGORY_GRADIENT: Record<string, string> = {
    productivity: "from-blue-500 to-blue-600",
    research: "from-emerald-500 to-emerald-600",
    writing: "from-purple-500 to-purple-600",
    coding: "from-amber-500 to-amber-600",
    business: "from-rose-500 to-rose-600",
    creative: "from-pink-500 to-pink-600",
    personal: "from-cyan-500 to-cyan-600",
  }

  const STATUS_LABEL: Record<string, { text: string; color: string }> = {
    running: { text: "Running", color: "text-green-400" },
    suspended: { text: "Suspended", color: "text-yellow-400" },
    provisioning: { text: "Provisioning...", color: "text-blue-400" },
    error: { text: "Error", color: "text-red-400" },
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
            const gradient = CATEGORY_GRADIENT[agent.category] ?? "from-zinc-500 to-zinc-600"
            const statusInfo = STATUS_LABEL[agent.status] ?? { text: agent.status, color: "text-zinc-400" }
            const chatPath = agent.teamId && projectId
              ? `/workspace/p/${projectId}/t/${agent.teamId}/chat`
              : null
            const isProvisioning = agent.status === "provisioning"

            return (
              <div
                key={agent.instanceId}
                className="group rounded-2xl bg-card p-5 transition-all duration-200 hover:bg-accent"
              >
                <div className="flex items-start gap-4 mb-4">
                  {/* Icon */}
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white text-lg font-semibold shrink-0`}>
                    {agent.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold leading-tight truncate">{agent.name}</h3>
                    <p className="text-[13px] text-muted-foreground mt-0.5 truncate">{agent.tagline}</p>
                    <p className={`text-xs mt-1.5 font-medium ${statusInfo.color}`}>
                      {isProvisioning && <Loader2 className="inline size-3 mr-1 animate-spin" />}
                      {statusInfo.text}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {chatPath && !isProvisioning && (
                  <Link
                    href={chatPath}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary/15 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/25"
                  >
                    <MessageSquare className="size-4" />
                    Open Chat
                  </Link>
                )}
                {isProvisioning && (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-medium text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Setting up your agent...
                  </div>
                )}
              </div>
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
