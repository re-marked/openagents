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
 * Uses a single nested query instead of 3 sequential round-trips.
 */
export async function getProjectAgents(_userId: string, activeProjectId: string | null) {
  if (!activeProjectId) return []

  const service = createServiceClient()

  // Single query: teams → team_agents → agent_instances → agents
  // Team membership already scopes to the user's project
  const { data: teams } = await service
    .from('teams')
    .select('team_agents(agent_instances!inner(id, display_name, status, created_at, agents!inner(name, slug, category, tagline, icon_url)))')
    .eq('project_id', activeProjectId)

  if (!teams || teams.length === 0) return []

  // Flatten nested structure and deduplicate
  const seen = new Set<string>()
  const instances: ProjectAgentInstance[] = []

  for (const team of teams) {
    const teamAgents = (team as any).team_agents ?? []
    for (const ta of teamAgents) {
      const inst = ta.agent_instances
      if (!inst || seen.has(inst.id)) continue
      if (inst.status === 'destroyed' || inst.status === 'destroying') continue
      if (inst.agents?.name == null) continue
      seen.add(inst.id)
      instances.push(inst)
    }
  }

  // Sort newest first
  instances.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return instances
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
