import { cookies } from 'next/headers'
import { createServiceClient } from '@agentbay/db/server'

export interface ProjectAgentInstance {
  id: string
  display_name: string | null
  status: string
  created_at: string
  agents: {
    name: string
    slug: string
    category: string
    tagline: string
    icon_url: string | null
  }
}

/**
 * Resolve the active project ID from the cookie, falling back to the first project.
 */
export async function getActiveProjectId(userId: string) {
  const service = createServiceClient()

  const { data: projects } = await service
    .from('projects')
    .select('id, name, description')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  let userProjects = projects ?? []
  if (userProjects.length === 0) {
    const { data: newProject } = await service
      .from('projects')
      .insert({ name: 'My Workspace', description: 'Personal', user_id: userId })
      .select('id, name, description')
      .single()
    if (newProject) userProjects = [newProject]
  }

  const cookieStore = await cookies()
  const activeProjectCookie = cookieStore.get('active_project')?.value
  const activeProjectId = userProjects.find(p => p.id === activeProjectCookie)?.id
    ?? userProjects[0]?.id
    ?? null

  return { projects: userProjects, activeProjectId }
}

/**
 * Load agent instances for the active project (filtered by team membership).
 * Falls back to all user agents if no teams exist yet.
 */
export async function getProjectAgents(userId: string, activeProjectId: string | null) {
  const service = createServiceClient()

  let teamIds: string[] = []
  if (activeProjectId) {
    const { data: teams } = await service
      .from('teams')
      .select('id')
      .eq('project_id', activeProjectId)
    teamIds = (teams ?? []).map(t => t.id)
  }

  // Project exists but has no teams yet — no agents to show
  if (teamIds.length === 0) return []

  const { data: teamAgents } = await service
    .from('team_agents')
    .select('instance_id')
    .in('team_id', teamIds)
  const instanceIds = (teamAgents ?? []).map(ta => ta.instance_id)

  if (instanceIds.length === 0) return []

  const { data } = await service
    .from('agent_instances')
    .select('id, display_name, status, created_at, agents!inner(name, slug, category, tagline, icon_url)')
    .eq('user_id', userId)
    .in('id', instanceIds)
    .not('status', 'in', '("destroyed","destroying")')
    .order('created_at', { ascending: false })
  return data ?? []
}

/**
 * Map raw DB instances to the AgentInfo shape used by components.
 */
export function toAgentInfoList(instances: ProjectAgentInstance[]) {
  return instances.map((inst) => {
    const agent = inst.agents
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
}
