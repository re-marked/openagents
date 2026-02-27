import { createClient, createServiceClient } from '@agentbay/db/server'
import { NextResponse } from 'next/server'
import type { Tables } from '@agentbay/db'
import { getUserCredits } from '@/lib/usage/credit-check'
import { estimateTokens, calculateCredits, estimateCostUsd } from '@/lib/usage/token-estimator'

export const runtime = 'nodejs'

type AgentInstance = Pick<
  Tables<'agent_instances'>,
  'id' | 'fly_app_name' | 'status' | 'user_id' | 'agent_id' | 'team_id' | 'gateway_token'
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
    .select('id, fly_app_name, status, user_id, agent_id, team_id, gateway_token')
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

  // 3b. Credit pre-check — block if zero credits
  const userCredits = await getUserCredits(user.id)
  if (userCredits <= 0) {
    return NextResponse.json(
      { error: 'No credits remaining. Please add credits to continue.' },
      { status: 402 },
    )
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

  // 6. Build session key for OpenClaw native sessions.
  // Use the DB session ID so each fresh DB session maps to a fresh OpenClaw
  // session, avoiding stale/corrupted conversation history on the agent side.
  const sessionKey = `agent:main:session-${sessionId}`
  const idempotencyKey = `${sessionId}-${Date.now()}`

  // 6b. Query team sub-agents when the master instance belongs to a team.
  // Maps display_name (e.g. "researcher") to { flyApp, token } so the gateway
  // can open real WS connections instead of using hardcoded mock responses.
  let subAgents: Record<string, { flyApp: string; token?: string }> | undefined

  if (instance.team_id) {
    const serviceSupabase = createServiceClient()
    const { data: teamMembers } = await serviceSupabase
      .from('team_agents')
      .select('instance_id, agent_instances!inner(fly_app_name, display_name, status, gateway_token)')
      .eq('team_id', instance.team_id)
      .neq('instance_id', instance.id)

    if (teamMembers && teamMembers.length > 0) {
      subAgents = {}
      for (const member of teamMembers) {
        // Cast: Supabase join returns the related row as an object
        const inst = (member as Record<string, unknown>).agent_instances as {
          fly_app_name: string
          display_name: string | null
          status: string
          gateway_token: string | null
        }
        if (
          inst.display_name &&
          (inst.status === 'running' || inst.status === 'suspended')
        ) {
          subAgents[inst.display_name] = {
            flyApp: inst.fly_app_name,
            ...(inst.gateway_token ? { token: inst.gateway_token } : {}),
          }
        }
      }
      // Don't send empty object
      if (Object.keys(subAgents).length === 0) {
        subAgents = undefined
      }
    }
  }

  // 7. POST to SSE gateway
  const gatewayUrl = process.env.SSE_GATEWAY_URL
  const gatewaySecret = process.env.SSE_GATEWAY_SECRET

  if (!gatewayUrl || !gatewaySecret) {
    return NextResponse.json({ error: 'Gateway not configured' }, { status: 500 })
  }

  const agentToken = instance.gateway_token ?? process.env.TEST_AGENT_GATEWAY_TOKEN

  const streamStartTime = Date.now()

  const gatewayResponse = await fetch(`${gatewayUrl}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gateway-token': gatewaySecret,
      'x-fly-app': instance.fly_app_name,
      ...(agentToken ? { 'x-agent-token': agentToken } : {}),
    },
    body: JSON.stringify({ sessionKey, message, idempotencyKey, subAgents }),
  })

  if (!gatewayResponse.ok || !gatewayResponse.body) {
    const text = await gatewayResponse.text().catch(() => 'Unknown error')
    return NextResponse.json(
      { error: `Gateway error: ${text}` },
      { status: gatewayResponse.status },
    )
  }

  // 8. Pipe SSE stream through, accumulating assistant content for DB storage.
  // A single run can produce multiple turns (text → tool → text), each ending
  // with a "done" event. We save each turn as a separate assistant message.
  // Thread data (from @mention sub-agent conversations) is stored as tool_use JSON.
  const decoder = new TextDecoder()
  let currentTurnContent = ''
  const assistantMessages: string[] = []

  // Thread tracking — keyed by turn index (the turn that triggered the @mention)
  type ThreadData = {
    id: string
    participants: string[]
    messages: { agent: string; content: string }[]
    complete: boolean
  }
  const threadsByTurnIndex = new Map<number, ThreadData>()
  let activeThreadTurnIdx = -1

  // Tool use tracking — keyed by turn index
  type ToolUseData = {
    id: string
    tool: string
    args?: string
    output?: string
    status: 'running' | 'done' | 'error'
  }
  const toolsByTurnIndex = new Map<number, ToolUseData[]>()

  // currentEvent must be closure-scoped so it survives across chunk boundaries
  let currentEvent = ''

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true })

      const lines = text.split('\n')
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          try {
            const data = JSON.parse(line.slice(5).trim())
            if (currentEvent === 'delta' && data.content) {
              currentTurnContent += data.content
            } else if (currentEvent === 'text_block') {
              // Text flushed before a tool call — save as a separate message
              if (currentTurnContent) {
                assistantMessages.push(currentTurnContent)
                currentTurnContent = ''
              }
            } else if (currentEvent === 'tool') {
              // Accumulate tool use data for the current turn
              const toolPayload = data.data ?? data
              const toolId = toolPayload.id ?? `tool-${Date.now()}`
              const toolName = toolPayload.tool ?? toolPayload.name ?? 'unknown'
              const state = data.state ?? toolPayload.state ?? ''
              const turnIdx = assistantMessages.length // current (not-yet-completed) turn

              let args = ''
              if (toolPayload.args) {
                if (typeof toolPayload.args === 'string') {
                  args = toolPayload.args
                } else if (toolPayload.args.command) {
                  args = toolPayload.args.command
                } else if (toolPayload.args.path || toolPayload.args.file) {
                  args = toolPayload.args.path ?? toolPayload.args.file
                } else if (toolPayload.args.query) {
                  args = toolPayload.args.query
                } else {
                  args = JSON.stringify(toolPayload.args)
                }
              }

              if (!toolsByTurnIndex.has(turnIdx)) {
                toolsByTurnIndex.set(turnIdx, [])
              }
              const turnTools = toolsByTurnIndex.get(turnIdx)!

              if (state === 'start' || state === 'running' || !state) {
                turnTools.push({
                  id: toolId,
                  tool: toolName,
                  args: args || undefined,
                  status: 'running',
                })
              } else if (state === 'end' || state === 'done' || state === 'completed') {
                const existing = turnTools.find((t) => t.id === toolId)
                if (existing) {
                  existing.status = 'done'
                  existing.output = toolPayload.output ?? toolPayload.result ?? ''
                  if (typeof existing.output !== 'string') existing.output = JSON.stringify(existing.output)
                }
              } else if (state === 'error') {
                const existing = turnTools.find((t) => t.id === toolId)
                if (existing) {
                  existing.status = 'error'
                  existing.output = toolPayload.error ?? 'Tool error'
                }
              }
            } else if (currentEvent === 'done') {
              // Turn complete — flush accumulated content
              if (currentTurnContent) {
                assistantMessages.push(currentTurnContent)
                currentTurnContent = ''
              }
            } else if (currentEvent === 'thread_start') {
              // Thread belongs to the most recently completed turn
              activeThreadTurnIdx = assistantMessages.length - 1
              if (activeThreadTurnIdx >= 0) {
                threadsByTurnIndex.set(activeThreadTurnIdx, {
                  id: data.threadId,
                  participants: [data.from, data.to],
                  messages: [{ agent: data.from, content: data.message }],
                  complete: false,
                })
              }
            } else if (currentEvent === 'thread_message') {
              const thread = threadsByTurnIndex.get(activeThreadTurnIdx)
              if (thread && thread.id === data.threadId) {
                thread.messages.push({ agent: data.agent, content: data.content })
              }
            } else if (currentEvent === 'thread_end') {
              const thread = threadsByTurnIndex.get(activeThreadTurnIdx)
              if (thread && thread.id === data.threadId) {
                thread.complete = true
              }
            }
          } catch {
            // Not JSON, pass through
          }
          currentEvent = ''
        }
      }

      controller.enqueue(chunk)
    },
    async flush() {
      // 9. On stream end, save any remaining content and insert all turns
      if (currentTurnContent) {
        assistantMessages.push(currentTurnContent)
      }
      if (assistantMessages.length > 0) {
        // Save messages and get IDs back for token update
        const { data: savedMessages } = await supabase
          .from('messages')
          .insert(
            assistantMessages.map((content, idx) => {
              const thread = threadsByTurnIndex.get(idx) ?? null
              const tools = toolsByTurnIndex.get(idx) ?? null
              // Combine thread and tool data into tool_use JSON
              let toolUseJson: Record<string, unknown> | null = null
              if (thread || (tools && tools.length > 0)) {
                toolUseJson = {}
                if (thread) {
                  // Preserve thread data at top level for backward compatibility
                  Object.assign(toolUseJson, thread)
                }
                if (tools && tools.length > 0) {
                  toolUseJson.tools = tools
                }
              }
              return {
                session_id: sessionId,
                role: 'assistant' as const,
                content,
                tool_use: (toolUseJson ?? null) as never,
              }
            }),
          )
          .select('id')

        // 10. Record usage — estimate tokens, deduct credits
        const inputTokens = estimateTokens(message)
        const outputTokens = assistantMessages.reduce(
          (sum, msg) => sum + estimateTokens(msg),
          0,
        )
        const computeSeconds = Math.round((Date.now() - streamStartTime) / 1000 * 100) / 100
        const creditsConsumed = calculateCredits(inputTokens, outputTokens)
        const costUsd = estimateCostUsd(creditsConsumed)

        const serviceClient = createServiceClient()
        await serviceClient.rpc('record_usage_event', {
          p_session_id: sessionId,
          p_user_id: user.id,
          p_instance_id: agentInstanceId,
          p_input_tokens: inputTokens,
          p_output_tokens: outputTokens,
          p_compute_seconds: computeSeconds,
          p_credits_consumed: creditsConsumed,
          p_cost_usd: costUsd,
        })

        // Update tokens_used on each saved assistant message
        if (savedMessages && savedMessages.length > 0) {
          for (let i = 0; i < savedMessages.length; i++) {
            const msgTokens = estimateTokens(assistantMessages[i])
            await supabase
              .from('messages')
              .update({ tokens_used: msgTokens })
              .eq('id', (savedMessages[i] as { id: string }).id)
          }
        }
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
