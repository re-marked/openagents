import { createClient } from '@openagents/db/server'
import { NextResponse } from 'next/server'
import type { Tables } from '@openagents/db'

export const runtime = 'nodejs'

type AgentInstance = Pick<
  Tables<'agent_instances'>,
  'id' | 'fly_app_name' | 'status' | 'user_id' | 'agent_id'
>

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse body
  let body: { agentInstanceId: string; message: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { agentInstanceId, message } = body
  if (!agentInstanceId || !message) {
    return NextResponse.json({ error: 'Missing agentInstanceId or message' }, { status: 400 })
  }

  // 3. Load agent instance — verify ownership and running status
  const { data: instanceData, error: instanceError } = await supabase
    .from('agent_instances')
    .select('id, fly_app_name, status, user_id, agent_id')
    .eq('id', agentInstanceId)
    .single()

  const instance = instanceData as AgentInstance | null

  if (instanceError || !instance) {
    return NextResponse.json({ error: 'Agent instance not found' }, { status: 404 })
  }

  if (instance.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (instance.status !== 'running' && instance.status !== 'suspended') {
    return NextResponse.json(
      { error: `Agent is ${instance.status}, not available` },
      { status: 409 },
    )
  }

  if (!instance.fly_app_name) {
    return NextResponse.json({ error: 'Agent has no Fly app configured' }, { status: 500 })
  }

  // 4. Find or create session for this user + instance
  const { data: existingSession } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('instance_id', agentInstanceId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  let sessionId: string

  if (existingSession) {
    sessionId = (existingSession as { id: string }).id
  } else {
    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        instance_id: agentInstanceId,
        relay: 'web',
      })
      .select('id')
      .single()

    if (sessionError || !newSession) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }
    sessionId = (newSession as { id: string }).id
  }

  // 5. Insert user message
  await supabase.from('messages').insert({
    session_id: sessionId,
    role: 'user',
    content: message,
  })

  // 6. Build session key for OpenClaw native sessions
  const sessionKey = `agent:main:oa-user-${user.id}`
  const idempotencyKey = `${sessionId}-${Date.now()}`

  // 7. POST to SSE gateway
  const gatewayUrl = process.env.SSE_GATEWAY_URL
  const gatewaySecret = process.env.SSE_GATEWAY_SECRET

  if (!gatewayUrl || !gatewaySecret) {
    return NextResponse.json({ error: 'Gateway not configured' }, { status: 500 })
  }

  const gatewayResponse = await fetch(`${gatewayUrl}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gateway-token': gatewaySecret,
      'x-fly-app': instance.fly_app_name,
      ...(process.env.TEST_AGENT_GATEWAY_TOKEN
        ? { 'x-agent-token': process.env.TEST_AGENT_GATEWAY_TOKEN }
        : {}),
    },
    body: JSON.stringify({ sessionKey, message, idempotencyKey }),
  })

  if (!gatewayResponse.ok || !gatewayResponse.body) {
    const text = await gatewayResponse.text().catch(() => 'Unknown error')
    return NextResponse.json(
      { error: `Gateway error: ${text}` },
      { status: gatewayResponse.status },
    )
  }

  // 8. Pipe SSE stream through, accumulating assistant content for DB storage
  const decoder = new TextDecoder()
  let assistantContent = ''

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true })

      // Parse SSE lines to accumulate assistant content
      const lines = text.split('\n')
      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const data = JSON.parse(line.slice(5).trim())
            if (data.content) {
              assistantContent += data.content
            }
          } catch {
            // Not JSON, pass through
          }
        }
      }

      // Forward the raw SSE bytes to the client
      controller.enqueue(chunk)
    },
    async flush() {
      // 9. On stream end, insert assistant message into DB
      if (assistantContent) {
        await supabase.from('messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: assistantContent,
        })
      }
    },
  })

  gatewayResponse.body.pipeThrough(transformStream)

  return new Response(transformStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
