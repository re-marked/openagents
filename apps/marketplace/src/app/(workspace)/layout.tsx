import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@agentbay/db/server'
import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // Load ALL user's agent instances (not just test-agent)
  const { data: instances } = await service
    .from('agent_instances')
    .select('id, display_name, status, team_id, agents!inner(name, slug, category, tagline)')
    .eq('user_id', user.id)
    .not('status', 'eq', 'destroyed')
    .order('created_at', { ascending: true })

  type AgentInfo = {
    instanceId: string
    name: string
    slug: string
    category: string
    tagline: string
    status: string
    teamId: string | null
  }

  const agents: AgentInfo[] = (instances ?? []).map((inst) => {
    const agent = (inst as Record<string, unknown>).agents as {
      name: string
      slug: string
      category: string
      tagline: string
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

  // Get project ID from first team (for routing)
  let projectId: string | undefined
  const firstTeamId = agents.find((a) => a.teamId)?.teamId
  if (firstTeamId) {
    const { data: team } = await service
      .from('teams')
      .select('project_id')
      .eq('id', firstTeamId)
      .single()
    projectId = team?.project_id ?? undefined
  }

  return (
    <SidebarProvider className="h-svh !min-h-0">
      <AppSidebar
        projectId={projectId}
        userEmail={user.email}
        agents={agents}
      />
      <SidebarInset className="overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
