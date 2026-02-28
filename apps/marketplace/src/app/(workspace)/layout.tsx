import { cookies } from 'next/headers'
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

  // Load user's projects
  const { data: projects } = await service
    .from('projects')
    .select('id, name, description')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Auto-create a default project if user has none
  let userProjects = projects ?? []
  if (userProjects.length === 0) {
    const { data: newProject } = await service
      .from('projects')
      .insert({ name: 'My Workspace', description: 'Personal', user_id: user.id })
      .select('id, name, description')
      .single()
    if (newProject) userProjects = [newProject]
  }

  // Determine active project from cookie
  const cookieStore = await cookies()
  const activeProjectCookie = cookieStore.get('active_project')?.value
  const activeProjectId = userProjects.find(p => p.id === activeProjectCookie)?.id
    ?? userProjects[0]?.id
    ?? null

  // Load teams for the active project
  let teamIds: string[] = []
  if (activeProjectId) {
    const { data: teams } = await service
      .from('teams')
      .select('id')
      .eq('project_id', activeProjectId)
    teamIds = (teams ?? []).map(t => t.id)
  }

  // Load agent instances — filter by team membership if project has teams
  let instances
  if (teamIds.length > 0) {
    // Get instance IDs linked to this project's teams
    const { data: teamAgents } = await service
      .from('team_agents')
      .select('instance_id')
      .in('team_id', teamIds)
    const instanceIds = (teamAgents ?? []).map(ta => ta.instance_id)

    if (instanceIds.length > 0) {
      const { data } = await service
        .from('agent_instances')
        .select('id, display_name, status, agents!inner(name, slug, category, tagline, icon_url)')
        .eq('user_id', user.id)
        .in('id', instanceIds)
        .not('status', 'eq', 'destroyed')
        .order('created_at', { ascending: true })
      instances = data
    }
  } else {
    // No teams yet — show all user's agents (backwards compatible)
    const { data } = await service
      .from('agent_instances')
      .select('id, display_name, status, agents!inner(name, slug, category, tagline, icon_url)')
      .eq('user_id', user.id)
      .not('status', 'eq', 'destroyed')
      .order('created_at', { ascending: true })
    instances = data
  }

  type AgentInfo = {
    instanceId: string
    name: string
    slug: string
    category: string
    tagline: string
    status: string
    iconUrl: string | null
  }

  const agents: AgentInfo[] = (instances ?? []).map((inst) => {
    const agent = (inst as Record<string, unknown>).agents as {
      name: string
      slug: string
      category: string
      tagline: string
      icon_url: string | null
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
    <SidebarProvider className="h-svh !min-h-0">
      <AppSidebar
        userEmail={user.email}
        agents={agents}
        projects={userProjects}
        activeProjectId={activeProjectId}
      />
      <SidebarInset className="overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
