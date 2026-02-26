import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@openagents/db/server'
import { redirect } from 'next/navigation'
import { TeamSettings } from '@/components/team-settings'
import { AGENT_ROLES } from '@/lib/agent-roles'

interface Props {
  params: Promise<{ projectId: string; teamId: string }>
}

export default async function TeamSettingsPage({ params }: Props) {
  const user = await getUser()
  if (!user) redirect('/login')

  const { projectId, teamId } = await params
  const service = createServiceClient()

  // Load all team members with their agent instance data
  const { data: teamAgents } = await service
    .from('team_agents')
    .select('instance_id, agent_instances!inner(id, display_name, status, agent_id, agents!inner(name, slug))')
    .eq('team_id', teamId)

  type TeamMember = {
    instanceId: string
    displayName: string
    agentName: string
    agentSlug: string
    status: string
    isMaster: boolean
    roleColor: string
  }

  const members: TeamMember[] = (teamAgents ?? []).map((ta) => {
    const inst = (ta as Record<string, unknown>).agent_instances as {
      id: string
      display_name: string | null
      status: string
      agent_id: string
      agents: { name: string; slug: string }
    }
    const isMaster = !inst.agents.slug.startsWith('sub-')
    const roleId = inst.display_name ?? ''
    const roleColor = AGENT_ROLES[roleId]?.color ?? (isMaster ? 'indigo' : 'zinc')

    return {
      instanceId: inst.id,
      displayName: inst.display_name ?? inst.agents.name,
      agentName: inst.agents.name,
      agentSlug: inst.agents.slug,
      status: inst.status,
      isMaster,
      roleColor,
    }
  })

  // Sort: master first, then alphabetically
  members.sort((a, b) => {
    if (a.isMaster && !b.isMaster) return -1
    if (!a.isMaster && b.isMaster) return 1
    return a.displayName.localeCompare(b.displayName)
  })

  // Determine which roles are available to add (not already in team)
  const activeRoleIds = new Set(
    members.filter((m) => !m.isMaster && m.status !== 'destroyed').map((m) => m.displayName),
  )
  const availableRoles = Object.values(AGENT_ROLES).filter((r) => !activeRoleIds.has(r.id))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold">Team Settings</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Manage the members of your AI team. Add specialists to handle different types of tasks.
      </p>
      <TeamSettings
        members={members}
        availableRoles={availableRoles.map((r) => ({ id: r.id, name: r.name, tagline: r.tagline, color: r.color }))}
        projectId={projectId}
        teamId={teamId}
      />
    </div>
  )
}
