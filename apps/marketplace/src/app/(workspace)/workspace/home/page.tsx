import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProvisioningPoller } from '@/components/provisioning-poller'
import { OnboardingWizard } from '@/components/onboarding-wizard'
import { HiredAgentGrid, type HiredAgent } from '@/components/hired-agent-grid'
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
    .select('id, display_name, status, created_at, agents!inner(name, slug, category, tagline, icon_url)')
    .eq('user_id', user.id)
    .not('status', 'eq', 'destroyed')
    .order('created_at', { ascending: false })

  const agents: HiredAgent[] = (instances ?? []).map((inst) => {
    const agent = (inst as Record<string, unknown>).agents as {
      name: string; slug: string; category: string; tagline: string; icon_url: string | null
    }
    return {
      instanceId: inst.id,
      name: inst.display_name ?? agent.name,
      slug: agent.slug,
      category: agent.category,
      tagline: agent.tagline,
      status: inst.status,
      iconUrl: agent.icon_url,
    }
  })

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 lg:px-12">
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
        <HiredAgentGrid agents={agents} />
      )}

      {/* Poll provisioning agents */}
      <ProvisioningPoller
        instanceIds={agents.filter((a) => a.status === "provisioning").map((a) => a.instanceId)}
      />
    </div>
  )
}
