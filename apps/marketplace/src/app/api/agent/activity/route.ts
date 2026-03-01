import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'

// ── Types ────────────────────────────────────────────────────────────────

export type ActivityEventType =
  | 'tool_call'
  | 'file_change'
  | 'command_exec'
  | 'context_compaction'
  | 'message_sent'
  | 'message_received'
  | 'error'
  | 'skill_invoked'
  | 'api_call'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  timestamp: string
  title: string
  summary: string
  durationMs: number
  metadata: Record<string, unknown>
}

interface ActivityResponse {
  events: ActivityEvent[]
  summary: {
    total: number
    byType: Record<string, number>
  }
}

// ── Mock data ────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function pickRandom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]!
}

function generateMockActivity(days: number, typeFilter?: string): ActivityResponse {
  const now = new Date()
  const rand = seededRandom(42)
  const events: ActivityEvent[] = []

  const toolNames = ['read_file', 'write_file', 'search_code', 'run_command', 'web_search', 'list_files']
  const filePaths = ['src/app/page.tsx', 'src/lib/utils.ts', 'package.json', 'src/components/header.tsx', 'README.md', 'tsconfig.json']
  const commands = ['pnpm build', 'pnpm test', 'git status', 'pnpm lint', 'npx tsc --noEmit', 'curl -s localhost:3000']
  const skills = ['commit', 'review-pr', 'explain', 'refactor', 'test']
  const endpoints = ['/v1/chat/completions', '/v1/models', '/api/agent/status', '/api/chat']
  const errorMessages = [
    'ENOENT: no such file or directory',
    'TypeError: Cannot read properties of undefined',
    'SyntaxError: Unexpected token',
    'RangeError: Maximum call stack size exceeded',
    'Error: Connection refused',
  ]

  const types: ActivityEventType[] = [
    'tool_call', 'tool_call', 'tool_call',
    'file_change', 'file_change',
    'command_exec', 'command_exec',
    'context_compaction',
    'message_sent', 'message_sent', 'message_sent',
    'message_received', 'message_received', 'message_received',
    'error',
    'skill_invoked',
    'api_call', 'api_call',
  ]

  const totalEvents = Math.round(60 + rand() * 60)

  for (let i = 0; i < totalEvents; i++) {
    const d = new Date(now)
    d.setMinutes(d.getMinutes() - Math.floor(rand() * days * 24 * 60))
    const type = pickRandom(types, rand)

    let title = ''
    let summary = ''
    let durationMs = 0
    let metadata: Record<string, unknown> = {}

    switch (type) {
      case 'tool_call': {
        const tool = pickRandom(toolNames, rand)
        title = `Called ${tool}`
        durationMs = Math.round(rand() * 3000 + 100)
        const args = tool === 'read_file'
          ? { path: pickRandom(filePaths, rand) }
          : tool === 'run_command'
          ? { command: pickRandom(commands, rand) }
          : { query: 'search term' }
        summary = `Executed tool with ${JSON.stringify(args).length} byte args`
        metadata = { tool, args, result: 'Success', outputLength: Math.round(rand() * 5000) }
        break
      }
      case 'file_change': {
        const file = pickRandom(filePaths, rand)
        const action = pickRandom(['created', 'modified', 'deleted'] as const, rand)
        title = `${action.charAt(0).toUpperCase() + action.slice(1)} ${file.split('/').pop()}`
        summary = `${action} ${file}`
        durationMs = Math.round(rand() * 500 + 50)
        const linesAdded = Math.round(rand() * 40)
        const linesRemoved = Math.round(rand() * 20)
        metadata = {
          path: file, action, linesAdded, linesRemoved,
          diff: `@@ -${Math.round(rand() * 50)},${linesRemoved} +${Math.round(rand() * 50)},${linesAdded} @@\n-old line\n+new line\n context line`,
        }
        break
      }
      case 'command_exec': {
        const cmd = pickRandom(commands, rand)
        const exitCode = rand() > 0.85 ? 1 : 0
        title = `Ran \`${cmd.split(' ')[0]}\``
        summary = cmd
        durationMs = Math.round(rand() * 15000 + 200)
        metadata = {
          command: cmd, exitCode,
          stdout: exitCode === 0 ? 'Done. No errors.' : '',
          stderr: exitCode === 1 ? 'Error: process exited with code 1' : '',
        }
        break
      }
      case 'context_compaction': {
        const before = Math.round(rand() * 80000 + 40000)
        const after = Math.round(before * (0.3 + rand() * 0.3))
        title = 'Context compacted'
        summary = `${before.toLocaleString()} → ${after.toLocaleString()} tokens`
        durationMs = Math.round(rand() * 2000 + 500)
        metadata = { tokensBefore: before, tokensAfter: after, messagesDropped: Math.round(rand() * 20 + 5), ratio: Math.round((after / before) * 100) }
        break
      }
      case 'message_sent': {
        const len = Math.round(rand() * 2000 + 50)
        title = 'Sent response'
        summary = `Generated ${len} character response`
        durationMs = Math.round(rand() * 5000 + 300)
        metadata = { length: len, hasCode: rand() > 0.5 }
        break
      }
      case 'message_received': {
        const len = Math.round(rand() * 500 + 10)
        title = 'Received message'
        summary = `User sent ${len} character message`
        durationMs = 0
        metadata = { length: len }
        break
      }
      case 'error': {
        const msg = pickRandom(errorMessages, rand)
        title = 'Error occurred'
        summary = msg
        durationMs = 0
        metadata = {
          message: msg,
          stack: `Error: ${msg}\n    at Object.<anonymous> (src/index.ts:42:15)\n    at Module._compile (node:internal/modules/cjs/loader:1376:14)\n    at Module._extensions..js (node:internal/modules/cjs/loader:1435:10)`,
          recoveryAction: 'Retried with fallback approach',
        }
        break
      }
      case 'skill_invoked': {
        const skill = pickRandom(skills, rand)
        title = `Invoked /${skill}`
        summary = `Skill "${skill}" executed`
        durationMs = Math.round(rand() * 8000 + 500)
        metadata = { skill, args: '', success: rand() > 0.1 }
        break
      }
      case 'api_call': {
        const endpoint = pickRandom(endpoints, rand)
        const method = endpoint.includes('chat') ? 'POST' : 'GET'
        const status = rand() > 0.9 ? 500 : rand() > 0.85 ? 429 : 200
        title = `${method} ${endpoint.split('/').pop()}`
        summary = `${method} ${endpoint} → ${status}`
        durationMs = Math.round(rand() * 4000 + 100)
        metadata = { method, endpoint, status, latencyMs: durationMs, responsePreview: status === 200 ? '{"ok":true}' : '{"error":"..."}' }
        break
      }
    }

    events.push({ id: `act-${String(i).padStart(4, '0')}`, type, timestamp: d.toISOString(), title, summary, durationMs, metadata })
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const filtered = typeFilter ? events.filter((e) => e.type === typeFilter) : events

  const byType: Record<string, number> = {}
  for (const e of events) {
    byType[e.type] = (byType[e.type] ?? 0) + 1
  }

  return { events: filtered, summary: { total: events.length, byType } }
}

// ── Route ────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const instanceId = searchParams.get('instanceId')
  const days = parseInt(searchParams.get('days') ?? '30', 10)
  const typeFilter = searchParams.get('type') ?? undefined

  if (!instanceId) {
    return NextResponse.json({ error: 'Missing instanceId' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: instance } = await service
    .from('agent_instances')
    .select('id, fly_app_name')
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .single()

  if (!instance) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  if (instance.fly_app_name?.startsWith('mock-')) {
    return NextResponse.json(generateMockActivity(days, typeFilter))
  }

  // ── Real data — build activity from sessions + messages ──────────────
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffIso = cutoff.toISOString()

    // Fetch sessions in date range
    const { data: sessions } = await service
      .from('sessions')
      .select('id, started_at, ended_at, compute_seconds')
      .eq('instance_id', instanceId)
      .eq('user_id', user.id)
      .gte('started_at', cutoffIso)
      .order('started_at', { ascending: false })

    const events: ActivityEvent[] = []

    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        // Fetch messages for this session
        const { data: messages } = await service
          .from('messages')
          .select('id, role, content, tokens_used, tool_use, created_at')
          .eq('session_id', session.id)
          .order('created_at', { ascending: true })

        if (!messages) continue

        for (const msg of messages) {
          const timestamp = msg.created_at ?? session.started_at

          if (msg.role === 'user') {
            events.push({
              id: msg.id,
              type: 'message_received',
              timestamp,
              title: 'Received message',
              summary: msg.content
                ? msg.content.length > 80
                  ? msg.content.slice(0, 80) + '...'
                  : msg.content
                : 'User message',
              durationMs: 0,
              metadata: { length: msg.content?.length ?? 0 },
            })
          } else if (msg.role === 'assistant') {
            // Check for tool use data
            const toolData = msg.tool_use as Record<string, unknown> | null
            const tools = (toolData?.tools ?? []) as Array<{
              id: string
              tool: string
              args?: string
              output?: string
              status: string
            }>

            // Emit tool call events
            for (const tool of tools) {
              events.push({
                id: `${msg.id}-tool-${tool.id}`,
                type: 'tool_call',
                timestamp,
                title: `Called ${tool.tool}`,
                summary: tool.args
                  ? `${tool.tool}(${tool.args.length > 60 ? tool.args.slice(0, 60) + '...' : tool.args})`
                  : `Executed ${tool.tool}`,
                durationMs: 0,
                metadata: {
                  tool: tool.tool,
                  args: tool.args,
                  result: tool.status === 'done' ? 'Success' : tool.status,
                  outputLength: tool.output?.length ?? 0,
                },
              })
            }

            // Emit the response event
            events.push({
              id: msg.id,
              type: 'message_sent',
              timestamp,
              title: 'Sent response',
              summary: msg.content
                ? msg.content.length > 80
                  ? msg.content.slice(0, 80) + '...'
                  : msg.content
                : 'Agent response',
              durationMs: 0,
              metadata: {
                length: msg.content?.length ?? 0,
                tokensUsed: msg.tokens_used ?? 0,
                hasCode: msg.content?.includes('```') ?? false,
              },
            })
          }
        }
      }
    }

    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply type filter
    const filtered = typeFilter ? events.filter((e) => e.type === typeFilter) : events

    // Build summary
    const byType: Record<string, number> = {}
    for (const e of events) {
      byType[e.type] = (byType[e.type] ?? 0) + 1
    }

    return NextResponse.json({
      events: filtered,
      summary: { total: events.length, byType },
    } satisfies ActivityResponse)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch activity'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
