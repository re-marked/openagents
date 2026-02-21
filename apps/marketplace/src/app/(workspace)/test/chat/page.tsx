import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@openagents/db/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function TestChatPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // Ensure test agent exists
  const { data: existingAgent, error: selectError } = await service
    .from('agents')
    .select('id')
    .eq('slug', 'test-agent')
    .single()

  let agent = existingAgent as { id: string } | null
  let debugInfo = ''

  if (!agent) {
    debugInfo += `Select error: ${selectError?.message ?? 'no data'}\n`
    const { data: newAgent, error: insertError } = await service
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

    if (insertError) {
      debugInfo += `Insert error: ${insertError.message} (code: ${insertError.code})\n`
      debugInfo += `Details: ${JSON.stringify(insertError.details)}\n`
    }

    agent = newAgent as { id: string } | null
  }

  if (!agent) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-8">
        <div className="max-w-lg space-y-4 text-center">
          <p className="text-destructive">Failed to create test agent row.</p>
          <pre className="bg-muted text-muted-foreground whitespace-pre-wrap rounded p-4 text-left text-xs">
            {debugInfo || 'No debug info available'}
          </pre>
        </div>
      </div>
    )
  }

  // Ensure agent instance exists for this user
  const { data: existingInstance, error: instanceSelectError } = await service
    .from('agent_instances')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('agent_id', agent.id)
    .single()

  let instance = existingInstance as { id: string; status: string } | null

  if (!instance) {
    debugInfo += `Instance select error: ${instanceSelectError?.message ?? 'no data'}\n`
    const { data: newInstance, error: instanceInsertError } = await service
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

    if (instanceInsertError) {
      debugInfo += `Instance insert error: ${instanceInsertError.message} (code: ${instanceInsertError.code})\n`
    }

    instance = newInstance as { id: string; status: string } | null
  }

  if (!instance) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-8">
        <div className="max-w-lg space-y-4 text-center">
          <p className="text-destructive">Failed to create test agent instance.</p>
          <pre className="bg-muted text-muted-foreground whitespace-pre-wrap rounded p-4 text-left text-xs">
            {debugInfo || 'No debug info available'}
          </pre>
        </div>
      </div>
    )
  }

  const chatUrl = `/workspace/project/test/team/${instance.id}/chat`
  const instanceId = instance.id
  const userId = user.id

  async function resetSession() {
    'use server'
    const svc = createServiceClient()

    const { data: sessions } = await svc
      .from('sessions')
      .select('id')
      .eq('instance_id', instanceId)
      .eq('user_id', userId)

    const sessionRows = (sessions ?? []) as { id: string }[]
    if (sessionRows.length > 0) {
      const sessionIds = sessionRows.map((s) => s.id)
      await svc.from('messages').delete().in('session_id', sessionIds)
      await svc.from('sessions').delete().in('id', sessionIds)
    }

    revalidatePath('/test/chat')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Test Assistant</h1>
          <p className="text-muted-foreground text-sm">
            Connected to{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">oa-test-agent.fly.dev</code>
          </p>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={instance.status === 'running' ? 'default' : 'secondary'}>
              {instance.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Instance ID</span>
            <code className="text-muted-foreground text-xs">{instance.id.slice(0, 8)}...</code>
          </div>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href={chatUrl}>Open Chat</Link>
          </Button>

          <form action={resetSession}>
            <Button type="submit" variant="outline" className="w-full">
              Reset Session
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
