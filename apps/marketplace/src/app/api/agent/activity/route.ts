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

  return NextResponse.json({
    events: [],
    summary: { total: 0, byType: {} },
  } satisfies ActivityResponse)
}
