import { createClient, createServiceClient } from '@openagents/db/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  // 1. Find or create agent with slug 'test-agent'
  const { data: existingAgent } = await service
    .from('agents')
    .select('id')
    .eq('slug', 'test-agent')
    .single()

  let agent = existingAgent as { id: string } | null

  if (!agent) {
    const { data: newAgent, error } = await service
      .from('agents')
      .insert({
        slug: 'test-agent',
        name: 'Test Assistant',
        creator_id: user.id,
        tagline: 'Test agent for development',
        description: 'A test agent running on oa-test-agent.fly.dev',
        category: 'general',
        status: 'published',
        github_repo_url: 'https://github.com/openagents/test-agent',
      })
      .select('id')
      .single()

    if (error || !newAgent) {
      return NextResponse.json(
        { error: 'Failed to create agent', details: error?.message },
        { status: 500 },
      )
    }
    agent = newAgent as { id: string }
  }

  // 2. Find or create agent_instance for this user + test agent
  const { data: existingInstance } = await service
    .from('agent_instances')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('agent_id', agent.id)
    .single()

  let instance = existingInstance as { id: string; status: string } | null

  if (!instance) {
    const { data: newInstance, error } = await service
      .from('agent_instances')
      .insert({
        user_id: user.id,
        agent_id: agent.id,
        fly_app_name: 'oa-test-agent',
        fly_machine_id: '2861050fe63548',
        status: 'running',
      })
      .select('id, status')
      .single()

    if (error || !newInstance) {
      return NextResponse.json(
        { error: 'Failed to create instance', details: error?.message },
        { status: 500 },
      )
    }
    instance = newInstance as { id: string; status: string }
  }

  return NextResponse.json({
    instanceId: instance.id,
    agentName: 'Test Assistant',
    status: instance.status,
    chatUrl: `/workspace/p/test/t/${instance.id}/chat`,
  })
}
