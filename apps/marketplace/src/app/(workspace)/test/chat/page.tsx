import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@openagents/db/server'
import { redirect } from 'next/navigation'

export default async function TestChatPage() {
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

  if (!agent) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-8">
        <p className="text-destructive">Failed to set up agent. Check Supabase logs.</p>
      </div>
    )
  }

  // --- Ensure project exists for user ---
  const { data: existingProject } = await service
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'My Workspace')
    .single()

  let project = existingProject as { id: string } | null

  if (!project) {
    const { data: newProject } = await service
      .from('projects')
      .insert({ user_id: user.id, name: 'My Workspace' })
      .select('id')
      .single()

    project = newProject as { id: string } | null
  }

  if (!project) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-8">
        <p className="text-destructive">Failed to create project. Check Supabase logs.</p>
      </div>
    )
  }

  // --- Ensure team exists under project ---
  const { data: existingTeam } = await service
    .from('teams')
    .select('id')
    .eq('project_id', project.id)
    .eq('name', 'team-chat')
    .single()

  let team = existingTeam as { id: string } | null

  if (!team) {
    const { data: newTeam } = await service
      .from('teams')
      .insert({ project_id: project.id, name: 'team-chat' })
      .select('id')
      .single()

    team = newTeam as { id: string } | null
  }

  if (!team) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-8">
        <p className="text-destructive">Failed to create team. Check Supabase logs.</p>
      </div>
    )
  }

  // --- Ensure agent instance exists for this user ---
  const { data: existingInstance } = await service
    .from('agent_instances')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('agent_id', agent.id)
    .single()

  let instance = existingInstance as { id: string; status: string } | null

  if (!instance) {
    const { data: newInstance } = await service
      .from('agent_instances')
      .insert({
        user_id: user.id,
        agent_id: agent.id,
        team_id: team.id,
        fly_app_name: 'oa-test-agent',
        fly_machine_id: '2861050fe63548',
        status: 'running',
      })
      .select('id, status')
      .single()

    instance = newInstance as { id: string; status: string } | null
  } else {
    // Ensure instance is linked to team
    await service
      .from('agent_instances')
      .update({ team_id: team.id })
      .eq('id', instance.id)
  }

  if (!instance) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-8">
        <p className="text-destructive">Failed to create agent instance. Check Supabase logs.</p>
      </div>
    )
  }

  // Redirect straight to the real chat page
  redirect(`/workspace/p/${project.id}/t/${team.id}/chat`)
}
