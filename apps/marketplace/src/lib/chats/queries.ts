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
 * Load all chats for a project with agent counts in a single query.
 */
export async function getProjectChats(userId: string, projectId: string | null): Promise<ChatInfo[]> {
  if (!projectId) return []

  const service = createServiceClient()

  // Single query with nested count instead of 2 sequential queries
  const { data: chats } = await service
    .from('chats')
    .select('id, name, chat_agents(count)')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (!chats || chats.length === 0) return []

  return chats.map((c: any) => ({
    id: c.id,
    name: c.name,
    agentCount: c.chat_agents?.[0]?.count ?? 0,
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

  // Add all existing agent instances for this user
  const { data: activeInstances } = await service
    .from('agent_instances')
    .select('id')
    .eq('user_id', userId)
    .not('status', 'in', '("destroyed","destroying")')

  const rows = (activeInstances ?? []).map(inst => ({
    chat_id: chat.id,
    instance_id: inst.id,
  }))

  if (rows.length > 0) {
    await service.from('chat_agents').insert(rows)
  }

  return chat.id
}
