import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@openagents/db/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AGENT_ROLES } from '@/lib/agent-roles'
import { MessageSquare, Settings, Users } from 'lucide-react'

export default async function HomePage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // --- Ensure test agent exists ---
  const { data: existingAgent } = await service
    .from('agents')
    .select('id')
    .eq('slug', 'test-agent')
    .single()

  let agent = existingAgent as { id: string } | null

  if (!agent) {
    const { data: newAgent } = await service
      .from('agents')
      .insert({
        slug: 'test-agent',
        name: 'Master',
        creator_id: user.id,
        tagline: 'Your AI team member',
        description: 'Master agent — your first AI assistant',
        category: 'general',
        status: 'published',
        github_repo_url: 'https://github.com/openagents/test-agent',
      })
      .select('id')
      .single()

    agent = newAgent as { id: string } | null
  }

  // --- Ensure project exists for user ---
  const { data: existingProject } = await service
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'My Workspace')
    .limit(1)
    .single()

  let project = existingProject as { id: string } | null

  if (!project && agent) {
    const { data: newProject } = await service
      .from('projects')
      .insert({ user_id: user.id, name: 'My Workspace' })
      .select('id')
      .single()

    project = newProject as { id: string } | null
  }

  // --- Ensure team exists under project ---
  let team: { id: string } | null = null
  if (project) {
    const { data: existingTeam } = await service
      .from('teams')
      .select('id')
      .eq('project_id', project.id)
      .eq('name', 'team-chat')
      .limit(1)
      .single()

    team = existingTeam as { id: string } | null

    if (!team) {
      const { data: newTeam } = await service
        .from('teams')
        .insert({ project_id: project.id, name: 'team-chat' })
        .select('id')
        .single()

      team = newTeam as { id: string } | null
    }
  }

  // --- Ensure agent instance exists ---
  if (agent && team) {
    const { data: existingInstance } = await service
      .from('agent_instances')
      .select('id')
      .eq('user_id', user.id)
      .eq('agent_id', agent.id)
      .limit(1)
      .single()

    if (!existingInstance) {
      await service
        .from('agent_instances')
        .insert({
          user_id: user.id,
          agent_id: agent.id,
          team_id: team.id,
          fly_app_name: 'oa-test-agent',
          fly_machine_id: '2861050fe63548',
          status: 'running',
        })
    } else {
      await service
        .from('agent_instances')
        .update({ team_id: team.id })
        .eq('id', existingInstance.id)
    }
  }

  // --- Bootstrap sub-agent `agents` rows (no instances — user adds via team settings) ---
  if (agent) {
    for (const role of Object.values(AGENT_ROLES)) {
      const subSlug = `sub-${role.id}`
      const { data: existing } = await service
        .from('agents')
        .select('id')
        .eq('slug', subSlug)
        .single()

      if (!existing) {
        await service.from('agents').insert({
          slug: subSlug,
          name: role.name,
          creator_id: user.id,
          tagline: role.tagline,
          description: `Sub-agent: ${role.name} — ${role.tagline}`,
          category: 'sub-agent',
          status: 'published',
          github_repo_url: 'https://github.com/openagents/sub-agents',
        })
      }
    }
  }

  // --- Load team members for display ---
  type TeamMember = { name: string; status: string; displayName: string }
  let teamMembers: TeamMember[] = []

  if (team) {
    const { data: teamAgents } = await service
      .from('team_agents')
      .select('agent_instances!inner(display_name, status, agents!inner(name))')
      .eq('team_id', team.id)

    teamMembers = (teamAgents ?? []).map((ta) => {
      const inst = (ta as Record<string, unknown>).agent_instances as {
        display_name: string | null
        status: string
        agents: { name: string }
      }
      return {
        name: inst.agents.name,
        status: inst.status,
        displayName: inst.display_name ?? inst.agents.name,
      }
    }).filter((m) => m.status !== 'destroyed')
  }

  const chatPath = project && team
    ? `/workspace/p/${project.id}/t/${team.id}/chat`
    : null
  const settingsPath = project && team
    ? `/workspace/p/${project.id}/t/${team.id}/settings`
    : null

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-1 text-2xl font-semibold">Welcome back</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Your workspace is ready. Here's what's going on.
      </p>

      {/* Team overview */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Your Team
        </h2>
        <div className="space-y-2">
          {teamMembers.length > 0 ? (
            teamMembers.map((m) => (
              <div key={m.displayName} className="flex items-center gap-3 rounded-lg border p-3">
                <span className={`inline-block h-2 w-2 rounded-full ${
                  m.status === 'running' ? 'bg-green-500' :
                  m.status === 'suspended' ? 'bg-yellow-500' :
                  m.status === 'provisioning' ? 'bg-blue-500 animate-pulse' :
                  'bg-zinc-400'
                }`} />
                <span className="text-sm font-medium">{m.name}</span>
                <span className="text-muted-foreground text-xs">{m.status}</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No team members yet.</p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        {chatPath && (
          <Link
            href={chatPath}
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Team Chat</div>
              <div className="text-muted-foreground text-xs">Talk to your team</div>
            </div>
          </Link>
        )}
        {settingsPath && (
          <Link
            href={settingsPath}
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Team Settings</div>
              <div className="text-muted-foreground text-xs">Add or remove specialists</div>
            </div>
          </Link>
        )}
        <Link
          href="/workspace/settings"
          className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">Settings</div>
            <div className="text-muted-foreground text-xs">API keys and account</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
