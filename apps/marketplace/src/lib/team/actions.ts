'use server'

import { createServiceClient } from '@agentbay/db/server'
import { getUser } from '@/lib/auth/get-user'
import { triggerDestroy } from '@/lib/trigger'
import { AGENT_ROLES } from '@/lib/agent-roles'
import { revalidatePath } from 'next/cache'

interface AddSubAgentParams {
  teamId: string
  roleId: string
}

export async function addSubAgent({ teamId, roleId }: AddSubAgentParams) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const role = AGENT_ROLES[roleId]
  if (!role) throw new Error(`Unknown role: ${roleId}`)

  const service = createServiceClient()

  // Find the sub-agent's agents row (slug: sub-<roleId>)
  const slug = `sub-${roleId}`
  const { data: agent } = await service
    .from('agents')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!agent) throw new Error(`Agent definition not found for role: ${roleId}`)

  // Sub-agents share the master's Fly machine — they're routed by the gateway
  // based on role context, not separate machines. Mark running immediately.
  const { data: instance, error: instanceErr } = await service
    .from('agent_instances')
    .insert({
      user_id: user.id,
      agent_id: agent.id,
      team_id: teamId,
      display_name: roleId,
      fly_app_name: 'ab-test-agent',
      fly_machine_id: '2861050fe63548',
      status: 'running',
    })
    .select('id')
    .single()

  if (instanceErr || !instance) {
    throw new Error(`Failed to create instance: ${instanceErr?.message}`)
  }

  // Link to team
  await service.from('team_agents').insert({
    team_id: teamId,
    instance_id: instance.id,
  })

  revalidatePath(`/workspace`)

  return { instanceId: instance.id }
}

interface RemoveSubAgentParams {
  instanceId: string
  teamId: string
}

export async function removeSubAgent({ instanceId, teamId }: RemoveSubAgentParams) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()

  // Verify ownership
  const { data: instance } = await service
    .from('agent_instances')
    .select('id, user_id, status')
    .eq('id', instanceId)
    .single()

  if (!instance) throw new Error('Instance not found')
  if (instance.user_id !== user.id) throw new Error('Forbidden')

  // Remove from team_agents
  await service
    .from('team_agents')
    .delete()
    .eq('team_id', teamId)
    .eq('instance_id', instanceId)

  // Trigger machine destruction if it's running
  if (instance.status === 'running' || instance.status === 'suspended') {
    await triggerDestroy({ instanceId })
  } else {
    // Just mark as destroyed if not yet provisioned
    await service
      .from('agent_instances')
      .update({ status: 'destroyed' })
      .eq('id', instanceId)
  }

  revalidatePath(`/workspace`)

  return { success: true }
}
