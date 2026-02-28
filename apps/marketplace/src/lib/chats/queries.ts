import { createServiceClient } from '@agentbay/db/server'

export interface ChatInfo {
  id: string
  name: string
  agentCount: number
}

export interface ChatAgentInfo {
  instanceId: string
  name: string
  slug: string
  category: string
  status: string
  iconUrl: string | null
}

/**
 * Load all chats for a project with agent counts.
 */
export async function getProjectChats(userId: string, projectId: string | null): Promise<ChatInfo[]> {
  if (!projectId) return []

  const service = createServiceClient()
  const { data: chats } = await service
    .from('chats')
    .select('id, name')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (!chats || chats.length === 0) return []

  // Get agent counts per chat
  const chatIds = chats.map(c => c.id)
  const { data: chatAgents } = await service
    .from('chat_agents')
    .select('chat_id')
    .in('chat_id', chatIds)

  const countMap: Record<string, number> = {}
  for (const ca of chatAgents ?? []) {
    countMap[ca.chat_id] = (countMap[ca.chat_id] ?? 0) + 1
  }

  return chats.map(c => ({
    id: c.id,
    name: c.name,
    agentCount: countMap[c.id] ?? 0,
  }))
}

/**
 * Load agents in a specific chat with their instance details.
 */
export async function getChatAgents(chatId: string): Promise<ChatAgentInfo[]> {
  const service = createServiceClient()

  const { data } = await service
    .from('chat_agents')
    .select('instance_id, agent_instances!inner(id, display_name, status, agents!inner(name, slug, category, icon_url))')
    .eq('chat_id', chatId)
    .order('added_at', { ascending: true })

  if (!data) return []

  return data.map((row) => {
    const inst = row.agent_instances as unknown as {
      id: string
      display_name: string | null
      status: string
      agents: { name: string; slug: string; category: string; icon_url: string | null }
    }
    return {
      instanceId: inst.id,
      name: inst.display_name ?? inst.agents.name,
      slug: inst.agents.slug,
      category: inst.agents.category,
      status: inst.status,
      iconUrl: inst.agents.icon_url,
    }
  })
}

/**
 * Ensure a default "General" chat exists for a project.
 * Creates one and adds all current agent instances if it doesn't exist.
 */
export async function ensureDefaultChat(userId: string, projectId: string): Promise<string> {
  const service = createServiceClient()

  // Check if a chat already exists for this project
  const { data: existing } = await service
    .from('chats')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existing) return existing.id

  // Create the default chat
  const { data: chat } = await service
    .from('chats')
    .insert({ project_id: projectId, user_id: userId, name: 'General' })
    .select('id')
    .single()

  // Race condition guard — if another request created one concurrently, use that
  if (!chat) {
    const { data: fallback } = await service
      .from('chats')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    if (fallback) return fallback.id
  }

  if (!chat) throw new Error('Failed to create default chat')

  // Add all existing agent instances for this project
  // Find instances via team_agents → teams → project
  const { data: teams } = await service
    .from('teams')
    .select('id')
    .eq('project_id', projectId)

  const teamIds = (teams ?? []).map(t => t.id)
  if (teamIds.length > 0) {
    const { data: teamAgents } = await service
      .from('team_agents')
      .select('instance_id')
      .in('team_id', teamIds)

    const instanceIds = (teamAgents ?? []).map(ta => ta.instance_id)
    if (instanceIds.length > 0) {
      // Filter to non-destroyed instances
      const { data: activeInstances } = await service
        .from('agent_instances')
        .select('id')
        .in('id', instanceIds)
        .not('status', 'in', '("destroyed","destroying")')

      const rows = (activeInstances ?? []).map(inst => ({
        chat_id: chat.id,
        instance_id: inst.id,
      }))

      if (rows.length > 0) {
        await service.from('chat_agents').insert(rows)
      }
    }
  }

  return chat.id
}
