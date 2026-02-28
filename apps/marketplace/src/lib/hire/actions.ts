'use server'

import { createServiceClient } from '@agentbay/db/server'
import { getUser } from '@/lib/auth/get-user'
import { triggerProvision, triggerDestroy } from '@/lib/trigger'
import { revalidatePath } from 'next/cache'

interface HireAgentParams {
  agentSlug: string
}

/**
 * Hire an agent from the marketplace.
 * Creates project/team if needed, creates agent_instance with status=provisioning,
 * fires Trigger.dev provision task, returns instance ID for polling.
 */
export async function hireAgent({ agentSlug }: HireAgentParams) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()

  // 1. Look up agent
  const { data: agent } = await service
    .from('agents')
    .select('id, name, slug')
    .eq('slug', agentSlug)
    .eq('status', 'published')
    .single()

  if (!agent) throw new Error(`Agent not found: ${agentSlug}`)

  // 2. Check if already hired (running or suspended)
  const { data: existing } = await service
    .from('agent_instances')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('agent_id', agent.id)
    .in('status', ['running', 'suspended', 'provisioning'])
    .limit(1)
    .single()

  if (existing) {
    return { instanceId: existing.id, status: existing.status, alreadyHired: true }
  }

  // 2b. Clean up any destroyed instance so the unique constraint doesn't block re-hire
  await service
    .from('agent_instances')
    .delete()
    .eq('user_id', user.id)
    .eq('agent_id', agent.id)
    .in('status', ['destroyed', 'destroying'])

  // 3. Ensure project exists
  const { data: existingProject } = await service
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'My Workspace')
    .limit(1)
    .single()

  let projectId = existingProject?.id

  if (!projectId) {
    const { data: newProject } = await service
      .from('projects')
      .insert({ user_id: user.id, name: 'My Workspace' })
      .select('id')
      .single()
    projectId = newProject?.id
  }

  if (!projectId) throw new Error('Failed to create project')

  // 4. Ensure team exists
  const { data: existingTeam } = await service
    .from('teams')
    .select('id')
    .eq('project_id', projectId)
    .eq('name', 'team-chat')
    .limit(1)
    .single()

  let teamId = existingTeam?.id

  if (!teamId) {
    const { data: newTeam } = await service
      .from('teams')
      .insert({ project_id: projectId, name: 'team-chat' })
      .select('id')
      .single()
    teamId = newTeam?.id
  }

  if (!teamId) throw new Error('Failed to create team')

  // 5. Create agent instance with provisioning status
  const { data: instance, error: instanceErr } = await service
    .from('agent_instances')
    .insert({
      user_id: user.id,
      agent_id: agent.id,
      team_id: teamId,
      display_name: agent.name,
      fly_app_name: 'pending',
      fly_machine_id: 'pending',
      status: 'provisioning',
    })
    .select('id')
    .single()

  if (instanceErr || !instance) {
    throw new Error(`Failed to create instance: ${instanceErr?.message}`)
  }

  // 6. Link to team
  await service.from('team_agents').insert({
    team_id: teamId,
    instance_id: instance.id,
  })

  // 6b. Add to default chat (first chat in the project)
  const { data: defaultChat } = await service
    .from('chats')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (defaultChat) {
    await service.from('chat_agents').insert({
      chat_id: defaultChat.id,
      instance_id: instance.id,
    })
  }

  // 7. Fire Trigger.dev provision task
  await triggerProvision({
    userId: user.id,
    agentId: agent.id,
    instanceId: instance.id,
  })

  revalidatePath('/workspace')

  return { instanceId: instance.id, status: 'provisioning', alreadyHired: false }
}

/**
 * Remove a hired agent — destroys the Fly.io machine and marks instance as destroyed.
 */
export async function removeAgent(instanceId: string) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()

  // Verify ownership
  const { data: inst } = await service
    .from('agent_instances')
    .select('id, status, fly_app_name, fly_machine_id')
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .single()

  if (!inst) throw new Error('Agent not found')
  if (inst.status === 'destroyed') throw new Error('Agent already removed')

  // Mark as destroying immediately for UI feedback
  await service
    .from('agent_instances')
    .update({ status: 'destroying' })
    .eq('id', instanceId)

  // Fire Trigger.dev destroy task (handles Fly cleanup async)
  if (inst.fly_app_name !== 'pending' && inst.fly_machine_id !== 'pending') {
    await triggerDestroy({ instanceId })
  } else {
    // No machine was ever created — just mark destroyed directly
    await service
      .from('agent_instances')
      .update({ status: 'destroyed' })
      .eq('id', instanceId)
  }

  revalidatePath('/workspace')
  return { success: true }
}

/**
 * Check the status of an agent instance (for polling during provisioning).
 */
export async function checkInstanceStatus(instanceId: string) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()

  const { data } = await service
    .from('agent_instances')
    .select('id, status')
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .single()

  if (!data) return null

  return {
    id: data.id,
    status: data.status,
  }
}
