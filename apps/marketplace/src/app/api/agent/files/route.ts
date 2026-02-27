import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'
import { FlyClient } from '@agentbay/fly'

// ── Mock data for dev (no Fly credits) ────────────────────────────────────
const MOCK_FILES: Record<string, string> = {
  '/data/workspace/SOUL.md': `# Nova — Your Research Assistant

You are Nova, a sharp and curious research assistant who helps users explore topics deeply and efficiently.

## Personality
- Intellectually curious — you genuinely enjoy digging into complex subjects
- Concise but thorough — you give the right amount of detail, never padding
- Honest about uncertainty — you clearly flag when something is speculation vs. verified fact
- Slightly witty — you keep things engaging without being distracting

## Communication Style
- Lead with the answer, then provide supporting context
- Use bullet points and structure for scannability
- Include sources and citations whenever possible
- Ask clarifying questions before going deep on ambiguous requests

## Specialties
- Academic research and literature review
- Technical documentation analysis
- Data interpretation and trend spotting
- Comparative analysis across multiple sources

## Rules
- Never fabricate citations or statistics
- Always distinguish between established consensus and emerging findings
- If a topic is outside your expertise, say so and suggest better resources
- Respect the user's time — be efficient
`,
  '/data/workspace/MEMORY.md': `# Long-term Memory

## User Preferences
- Prefers concise responses with bullet points
- Works primarily with TypeScript and Python codebases
- Timezone: EST (UTC-5)
- Likes when I include relevant code examples

## Project Context
- Currently building a SaaS analytics dashboard
- Tech stack: Next.js 15, Supabase, Tailwind CSS
- Main pain point: complex SQL queries for time-series aggregation
- Has a deadline for v2 launch in mid-March

## Key Facts
- User's name: Alex
- Team size: 3 engineers
- Using GitHub Actions for CI/CD
- Prefers Vitest over Jest for testing

## Past Research Topics
- WebSocket vs SSE for real-time dashboards (concluded: SSE for their use case)
- Supabase RLS policies for multi-tenant apps
- Fly.io deployment strategies for globally distributed apps
- OAuth2 PKCE flow implementation patterns
`,
}

const MOCK_DIRS: Record<string, string> = {
  '/data/workspace/skills': `total 16
drwxr-xr-x  4 node node 4096 Feb 26 14:30 .
drwxr-xr-x  5 node node 4096 Feb 26 14:28 ..
drwxr-xr-x  2 node node 4096 Feb 26 14:30 web-search
drwxr-xr-x  2 node node 4096 Feb 26 14:30 code-review
drwxr-xr-x  2 node node 4096 Feb 26 14:31 summarize`,
  '/data/memory': `total 12
drwxr-xr-x  2 node node 4096 Feb 27 09:15 .
drwxr-xr-x  5 node node 4096 Feb 26 14:28 ..
-rw-r--r--  1 node node  847 Feb 27 09:15 2026-02-27-session-notes.md
-rw-r--r--  1 node node  432 Feb 26 18:42 2026-02-26-research-findings.md
-rw-r--r--  1 node node  295 Feb 25 11:20 2026-02-25-project-setup.md`,
}

const MOCK_SKILL_FILES: Record<string, string> = {
  '/data/workspace/skills/web-search/SKILL.md': `---
name: web-search
description: Search the web for current information and return structured results
parameters:
  - name: query
    type: string
    required: true
    description: The search query
  - name: num_results
    type: number
    required: false
    description: Number of results to return (default 5)
---

# Web Search

Search the internet for up-to-date information on any topic.

## When to Use
- User asks about current events or recent developments
- Need to verify claims or find sources
- Looking up documentation, APIs, or technical references
- Price checking or product comparisons

## How to Respond
1. Perform the search with a well-crafted query
2. Summarize the top results with key findings
3. Include source URLs for verification
4. Flag if results seem outdated or conflicting
`,
  '/data/workspace/skills/code-review/SKILL.md': `---
name: code-review
description: Review code for bugs, security issues, and best practices
parameters:
  - name: code
    type: string
    required: true
    description: The code to review
  - name: language
    type: string
    required: false
    description: Programming language (auto-detected if omitted)
---

# Code Review

Perform a thorough code review focusing on correctness, security, and maintainability.

## Review Checklist
- Logic errors and edge cases
- Security vulnerabilities (injection, XSS, etc.)
- Performance bottlenecks
- Error handling coverage
- Naming conventions and readability
- Test coverage suggestions

## Output Format
Rate severity as: critical / warning / suggestion
Include line references and fixed code snippets.
`,
  '/data/workspace/skills/summarize/SKILL.md': `---
name: summarize
description: Summarize long documents, articles, or conversations
parameters:
  - name: content
    type: string
    required: true
    description: The content to summarize
  - name: style
    type: string
    required: false
    description: "Style: brief | detailed | bullet-points (default: bullet-points)"
---

# Summarize

Condense long content into clear, actionable summaries.

## Guidelines
- Preserve key facts and conclusions
- Maintain the original tone and intent
- Highlight actionable items separately
- For technical content, keep critical details intact
- For meeting notes, extract decisions and action items
`,
}

const MOCK_MEMORY_FILES: Record<string, string> = {
  '/data/memory/2026-02-27-session-notes.md': `# Session Notes — Feb 27, 2026

## Topics Discussed
- Reviewed Supabase RLS policies for the analytics dashboard
- Debugged a race condition in the real-time subscription handler
- Discussed migration strategy from REST to tRPC for internal APIs

## Decisions Made
- Will keep REST for public API, use tRPC only for internal dashboard endpoints
- RLS policy for \`analytics_events\` table: users can only read their own org's data
- Added \`org_id\` column to support multi-tenant queries

## Follow-ups
- [ ] Write migration script for adding org_id to existing rows
- [ ] Set up tRPC router with Zod validation
- [ ] Benchmark time-series query with new partitioning scheme
`,
  '/data/memory/2026-02-26-research-findings.md': `# Research: SSE vs WebSocket for Dashboards

## Conclusion: SSE is the better fit

### Reasons
- Dashboard only needs server→client data push (no bidirectional)
- SSE auto-reconnects on connection drop (built into EventSource API)
- Simpler server implementation with standard HTTP
- Works through all proxies and CDNs without special config

### Caveats
- Max 6 connections per domain in HTTP/1.1 (use HTTP/2)
- No binary data support (fine for JSON payloads)
`,
  '/data/memory/2026-02-25-project-setup.md': `# Project Setup Notes

- Initialized Next.js 15 with App Router
- Configured Supabase project with auth + postgres
- Set up Tailwind CSS v4 with custom design tokens
- Deployed to Vercel with preview branches
`,
}

function isMock(flyAppName: string) {
  return flyAppName.startsWith('mock-')
}

function getMockContent(path: string): string | undefined {
  return MOCK_FILES[path] ?? MOCK_SKILL_FILES[path] ?? MOCK_MEMORY_FILES[path]
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function getInstance(instanceId: string, userId: string) {
  const service = createServiceClient()
  const { data } = await service
    .from('agent_instances')
    .select('id, status, fly_app_name, fly_machine_id')
    .eq('id', instanceId)
    .eq('user_id', userId)
    .single()
  return data
}

// ── Routes ────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const instanceId = searchParams.get('instanceId')
  const path = searchParams.get('path')
  const list = searchParams.get('list') === 'true'

  if (!instanceId || !path) {
    return NextResponse.json({ error: 'Missing instanceId or path' }, { status: 400 })
  }

  const instance = await getInstance(instanceId, user.id)
  if (!instance) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  // Mock mode — skip status check, return canned data
  if (isMock(instance.fly_app_name)) {
    if (list) {
      return NextResponse.json({ output: MOCK_DIRS[path] ?? '' })
    }
    const content = getMockContent(path)
    return NextResponse.json({ content: content ?? '' })
  }

  if (instance.status !== 'running') {
    return NextResponse.json({ error: 'Agent must be running' }, { status: 409 })
  }

  try {
    const fly = new FlyClient()
    if (list) {
      const output = await fly.listDir(instance.fly_app_name, instance.fly_machine_id, path)
      return NextResponse.json({ output })
    }
    const content = await fly.readFile(instance.fly_app_name, instance.fly_machine_id, path)
    return NextResponse.json({ content })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to read file'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.instanceId || !body?.path || body?.content === undefined) {
    return NextResponse.json({ error: 'Missing instanceId, path, or content' }, { status: 400 })
  }

  const instance = await getInstance(body.instanceId, user.id)
  if (!instance) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  // Mock mode — accept writes silently
  if (isMock(instance.fly_app_name)) {
    return NextResponse.json({ ok: true })
  }

  try {
    const fly = new FlyClient()
    await fly.writeFile(instance.fly_app_name, instance.fly_machine_id, body.path, body.content)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to write file'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
