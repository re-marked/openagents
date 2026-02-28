// Mock data for ?test=true mode — shows what a fully populated agent home looks like

// ── Overview stats ──────────────────────────────────────────────────────

function generateTimeSeries(days: number) {
  const data = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayOfWeek = d.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const base = isWeekend ? 0.4 : 1
    data.push({
      date: d.toISOString().split('T')[0],
      messages: Math.floor((8 + Math.random() * 30) * base),
      minutes: Math.floor((5 + Math.random() * 25) * base),
      cost: parseFloat(((0.2 + Math.random() * 1.5) * base).toFixed(2)),
    })
  }
  return data
}

function generateHourlySeries() {
  const data = []
  const now = new Date()
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now)
    d.setHours(d.getHours() - i)
    const hour = d.getHours()
    const isActive = hour >= 9 && hour <= 22
    const base = isActive ? 1 : 0.1
    data.push({
      date: d.toISOString(),
      messages: Math.floor((1 + Math.random() * 8) * base),
      minutes: Math.floor((1 + Math.random() * 6) * base),
      cost: parseFloat(((0.05 + Math.random() * 0.4) * base).toFixed(2)),
    })
  }
  return data
}

export const TEST_STATS = {
  relationship: {
    totalConversations: 47,
    totalMessages: 1243,
    totalMinutes: 482,
    totalCost: 12.5,
    longestSessionMinutes: 45,
    skillsCount: 6,
    memoriesCount: 12,
  },
  recentActivity: [],
  timeSeries: generateTimeSeries(30),
  hourlySeries: generateHourlySeries(),
}

// ── Knowledge Graph files ───────────────────────────────────────────────

export const TEST_KNOWLEDGE_FILES = [
  {
    path: '/data/workspace/MEMORY.md',
    name: 'MEMORY.md',
    content: `# Agent Memory

## User Preferences
- Prefers concise responses unless asked for detail
- Uses TypeScript and React daily
- Timezone: EST (UTC-5)
- Likes dark mode UI, dislikes cluttered dashboards

## Key Facts
- Working on a SaaS product called "AgentBay"
- Main stack: Next.js 15, Supabase, Fly.io
- Has 3 team members: Alex (frontend), Sam (backend), Jordan (design)
- See [[project-context]] for architecture details
- See [[user-preferences]] for communication style

## Learned Patterns
- When debugging, user wants root cause analysis first
- For code reviews, focus on #security and #performance
- User prefers [[coding-standards]] over ad-hoc fixes
`,
  },
  {
    path: '/data/memory/project-context.md',
    name: 'project-context.md',
    content: `# Project Context

## Architecture
- Monorepo with pnpm workspaces
- Frontend deployed on Vercel
- Backend on Supabase (Postgres + Auth + Edge Functions)
- Agent runtime on Fly.io Machines

## Current Sprint
- Building marketplace discovery page
- Implementing agent DM system
- Fixing SSE gateway latency issues

## Tech Debt
- Need to migrate from REST to tRPC
- Auth middleware needs refactoring
- Test coverage is at 34% — target 60%

See [[coding-standards]] for conventions.
Related: [[user-preferences]]
`,
  },
  {
    path: '/data/memory/user-preferences.md',
    name: 'user-preferences.md',
    content: `# User Preferences

## Communication
- Direct and concise
- No unnecessary pleasantries
- Show code examples over lengthy explanations
- Use bullet points for multi-step answers

## Coding Style
- Functional components in React
- Prefer const arrow functions
- Use early returns
- Avoid nested ternaries
- See [[coding-standards]]

## Tools & Workflow
- Uses VS Code with Vim keybindings
- Git flow: feature branches → dev → main
- Prefers small, frequent commits
- Uses Claude Code for pair programming
`,
  },
  {
    path: '/data/memory/coding-standards.md',
    name: 'coding-standards.md',
    content: `# Coding Standards

## TypeScript
- Strict mode enabled
- Prefer \`interface\` over \`type\` for objects
- Use \`unknown\` over \`any\`
- Zod for runtime validation at boundaries

## React
- Server Components by default
- \`'use client'\` only when needed
- Co-locate components with their routes
- Use Radix UI primitives via shadcn

## CSS
- Tailwind v4 with CSS variables
- Never hardcode color values
- Use design tokens from globals.css
- Mobile-first responsive design

## Testing
- Vitest for unit tests
- Playwright for e2e
- Test behavior, not implementation
`,
  },
  {
    path: '/data/memory/debugging-notes.md',
    name: 'debugging-notes.md',
    content: `# Debugging Notes

## SSE Gateway Issues (Feb 2026)
- Fly.io \`fly-replay\` header sometimes drops on cold starts
- Workaround: retry with exponential backoff in client
- Root cause: machine resume takes 200-500ms, gateway times out at 100ms

## WebSocket Connection Drops
- OpenClaw WS disconnects after 5min idle
- Solution: ping/pong keepalive every 30s
- Client reconnect logic in \`use-agent-chat.ts\`

## Volume Corruption Pattern
- If gateway hangs during init, volume state is poisoned
- Only fix: destroy volume + create fresh one
- Added health check in [[project-context]]

#debugging #infrastructure
`,
  },
]

// ── Personality (SOUL.md) ───────────────────────────────────────────────

export const TEST_SOUL_CONTENT = `# Nova — Personal AI Assistant

## Identity
You are Nova, a sharp, reliable AI assistant who helps with software engineering, product thinking, and day-to-day knowledge work. You're the kind of colleague people love pairing with — fast, opinionated when it matters, and always honest about what you don't know.

## Personality Traits
- **Direct**: Get to the point. No filler, no hedging.
- **Curious**: Ask clarifying questions before diving into complex tasks.
- **Pragmatic**: Favor working solutions over perfect abstractions.
- **Witty**: Dry humor is welcome. Sarcasm is fine in moderation.

## Communication Style
- Default to concise responses (3-5 sentences for simple questions)
- Use code examples over prose explanations
- Structure complex answers with headers and bullets
- Never use corporate buzzwords or AI-speak ("As an AI...", "I'd be happy to...")
- When uncertain, say "I'm not sure" — never fabricate

## Technical Expertise
- Primary: TypeScript, React, Next.js, Node.js
- Secondary: Python, Rust, Go
- Infrastructure: Docker, Fly.io, Vercel, Supabase
- Always consider security, performance, and maintainability

## Boundaries
- Don't browse the web unless asked
- Don't modify files outside the workspace
- Ask before running destructive commands
- Flag potential security issues proactively
`

// ── Skills ──────────────────────────────────────────────────────────────

export const TEST_SKILLS = [
  {
    name: 'web-search',
    content: `---
name: web-search
description: Search the web for current information
parameters:
  - name: query
    type: string
    required: true
    description: The search query
  - name: maxResults
    type: number
    default: 5
    description: Maximum number of results to return
---

# Web Search

Search the internet for up-to-date information on any topic.

## When to use
- User asks about current events or recent data
- Need to verify facts or find documentation
- Looking up API references or library versions

## Guidelines
- Summarize results, don't just paste URLs
- Cite sources with links
- If results conflict, present both sides
- Default to 5 results unless user asks for more
`,
  },
  {
    name: 'code-review',
    content: `---
name: code-review
description: Review code for bugs, security issues, and best practices
parameters:
  - name: files
    type: string[]
    required: true
    description: File paths to review
  - name: focus
    type: string
    default: all
    description: Focus area (security, performance, readability, all)
---

# Code Review

Perform thorough code reviews focusing on correctness, security, and maintainability.

## Checklist
1. **Security**: SQL injection, XSS, auth bypass, secrets exposure
2. **Performance**: N+1 queries, unnecessary re-renders, large bundles
3. **Correctness**: Edge cases, null handling, type safety
4. **Style**: Naming conventions, code organization, DRY violations
5. **Tests**: Coverage gaps, missing edge case tests

## Output Format
- Use severity levels: 🔴 Critical, 🟡 Warning, 🔵 Suggestion
- Include line numbers and file paths
- Suggest fixes with code snippets
`,
  },
  {
    name: 'generate-tests',
    content: `---
name: generate-tests
description: Generate unit and integration tests for code
parameters:
  - name: target
    type: string
    required: true
    description: File or function to test
  - name: framework
    type: string
    default: vitest
    description: Test framework to use
---

# Test Generation

Generate comprehensive tests for functions, components, and modules.

## Strategy
1. Start with happy path tests
2. Add edge cases (empty input, null, boundary values)
3. Test error handling paths
4. Add integration tests for complex flows

## Guidelines
- Use descriptive test names: \`it('should return 404 when user not found')\`
- Prefer \`toEqual\` over \`toBe\` for objects
- Mock external dependencies, not internal modules
- Keep tests independent — no shared mutable state
`,
  },
  {
    name: 'deploy',
    content: `---
name: deploy
description: Deploy the application to staging or production
parameters:
  - name: environment
    type: string
    required: true
    description: Target environment (staging, production)
  - name: service
    type: string
    default: all
    description: Service to deploy (marketplace, sse-gateway, all)
---

# Deployment

Deploy services to staging or production environments.

## Pre-flight Checks
1. All tests pass
2. Type check passes
3. No uncommitted changes
4. Branch is up to date with main

## Deployment Steps
1. Build the application
2. Run database migrations if needed
3. Deploy to target environment
4. Verify health checks pass
5. Run smoke tests

## Rollback
If deployment fails:
1. Revert to previous version
2. Check logs for error details
3. Fix and re-deploy
`,
  },
]

// ── Memory ──────────────────────────────────────────────────────────────

export const TEST_MEMORY_MD = `# Agent Memory

## User Preferences
- Prefers concise responses unless asked for detail
- Uses TypeScript and React daily
- Timezone: EST (UTC-5)
- Likes dark mode UI, dislikes cluttered dashboards

## Key Facts
- Working on a SaaS product called "AgentBay"
- Main stack: Next.js 15, Supabase, Fly.io
- Has 3 team members: Alex (frontend), Sam (backend), Jordan (design)

## Learned Patterns
- When debugging, user wants root cause analysis first
- For code reviews, focus on security and performance
- User prefers coding standards over ad-hoc fixes
`

export const TEST_MEMORY_FILES = [
  { name: 'project-context.md' },
  { name: 'user-preferences.md' },
  { name: 'coding-standards.md' },
  { name: 'debugging-notes.md' },
  { name: 'meeting-notes-feb-25.md' },
]

export const TEST_MEMORY_FILE_CONTENTS: Record<string, string> = {
  'project-context.md': `# Project Context
- Monorepo with pnpm workspaces
- Frontend on Vercel, backend on Supabase
- Agent runtime on Fly.io Machines
- Current sprint: marketplace discovery + DM system`,
  'user-preferences.md': `# User Preferences
- Direct and concise communication
- Functional React components, const arrow functions
- Small frequent commits
- VS Code with Vim keybindings`,
  'coding-standards.md': `# Coding Standards
- TypeScript strict mode
- Server Components by default
- Tailwind v4 with CSS variables
- Vitest for unit tests, Playwright for e2e`,
  'debugging-notes.md': `# Debugging Notes
- SSE gateway: fly-replay drops on cold starts
- WebSocket: disconnects after 5min idle, needs keepalive
- Volume corruption: destroy + recreate is only fix`,
  'meeting-notes-feb-25.md': `# Meeting Notes — Feb 25, 2026
- Discussed pricing tiers: free (100 credits), pro ($20/mo), team ($50/mo)
- Jordan presenting new discover page mockups Thursday
- Sam finishing Stripe Connect integration by EOW
- Need to decide on agent-to-agent communication protocol`,
}

// ── Usage ───────────────────────────────────────────────────────────────

function generateDailyUsage(days: number) {
  const data = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayOfWeek = d.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const base = isWeekend ? 0.3 : 1
    const credits = parseFloat(((0.5 + Math.random() * 2) * base).toFixed(2))
    data.push({
      date: d.toISOString().split('T')[0],
      credits,
      tokens: Math.floor((5000 + Math.random() * 40000) * base),
      sessions: Math.floor((1 + Math.random() * 5) * base),
    })
  }
  return data
}

function generateUsageEvents(count: number) {
  const events = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now)
    d.setHours(d.getHours() - i * 2)
    const inputTokens = Math.floor(500 + Math.random() * 5000)
    const outputTokens = Math.floor(200 + Math.random() * 3000)
    const computeSeconds = Math.floor(1 + Math.random() * 30)
    const credits = parseFloat((0.1 + Math.random() * 0.8).toFixed(2))
    events.push({
      date: d.toISOString(),
      sessionId: `ses-${crypto.randomUUID().slice(0, 8)}`,
      inputTokens,
      outputTokens,
      computeSeconds,
      credits,
      costUsd: parseFloat((credits * 0.01).toFixed(4)),
    })
  }
  return events
}

export const TEST_USAGE = {
  summary: {
    totalCredits: 42.7,
    totalCostUsd: 0.43,
    totalInputTokens: 847200,
    totalOutputTokens: 312500,
    totalComputeSeconds: 1840,
    totalSessions: 89,
  },
  daily: generateDailyUsage(30),
  events: generateUsageEvents(35),
}

// ── Activity ────────────────────────────────────────────────────────────

function generateActivityEvents() {
  const now = new Date()
  const types = [
    {
      type: 'tool_call' as const,
      titles: ['Read file', 'Write file', 'Execute command', 'Search codebase'],
      summaries: [
        'Read src/components/app-sidebar.tsx (384 lines)',
        'Wrote 42 lines to src/app/workspace/dm/page.tsx',
        'Ran pnpm type-check — passed',
        'Searched for "AgentAvatar" across 127 files',
      ],
      meta: { tool: 'bash', result: 'success', outputLength: 2048 },
    },
    {
      type: 'file_change' as const,
      titles: ['Modified app-sidebar.tsx', 'Created dm/page.tsx', 'Updated globals.css', 'Deleted temp-debug.ts'],
      summaries: [
        'Added Direct Messages section to sidebar',
        'New DM route page with chat panel',
        'Updated CSS custom properties for dark mode',
        'Removed temporary debugging file',
      ],
      meta: { path: 'src/components/app-sidebar.tsx', action: 'modified', linesAdded: 23, linesRemoved: 8 },
    },
    {
      type: 'command_exec' as const,
      titles: ['pnpm type-check', 'git commit', 'pnpm dev', 'git push'],
      summaries: [
        'Type check passed — 0 errors',
        'Committed: feat(workspace): add DM route',
        'Started dev server on port 3000',
        'Pushed to origin/main',
      ],
      meta: { command: 'pnpm type-check', exitCode: 0 },
    },
    {
      type: 'message_sent' as const,
      titles: ['Response to user', 'Code explanation', 'Bug fix proposal', 'Architecture suggestion'],
      summaries: [
        'Explained the sidebar restructuring approach',
        'Broke down the chat panel component architecture',
        'Proposed fix for duplicate General chat creation',
        'Suggested using SSE over WebSocket for streaming',
      ],
      meta: {},
    },
    {
      type: 'message_received' as const,
      titles: ['User message', 'Follow-up question', 'Code review request', 'Feature request'],
      summaries: [
        'Asked about adding DM section to sidebar',
        'Clarified the expected behavior for group chats',
        'Requested review of overview section changes',
        'Want to add ?test=true for agent home preview',
      ],
      meta: {},
    },
    {
      type: 'skill_invoked' as const,
      titles: ['/web-search', '/code-review', '/deploy staging', '/generate-tests'],
      summaries: [
        'Searched for "Next.js 15 server actions streaming"',
        'Reviewed 3 files for security issues — found 1 warning',
        'Deployed marketplace to staging — health check passed',
        'Generated 12 tests for agent-home.tsx',
      ],
      meta: { skill: 'web-search', success: true },
    },
    {
      type: 'error' as const,
      titles: ['Type error', 'Build failure', 'API timeout', 'Module not found'],
      summaries: [
        "TS6133: 'MessageSquare' is declared but never read",
        'Build failed — missing dependency @agentbay/ui',
        'SSE gateway request timed out after 30s',
        "Cannot find module '@/components/markdown-editor'",
      ],
      meta: { message: "TS6133: 'MessageSquare' is declared but never read", recoveryAction: 'Removed unused import' },
    },
    {
      type: 'api_call' as const,
      titles: ['GET /api/agent/stats', 'POST /api/chat', 'PUT /api/agent/files', 'GET /api/agent/model'],
      summaries: [
        'Fetched agent statistics for overview dashboard',
        'Sent message to agent via chat API',
        'Updated SOUL.md personality file on agent',
        'Retrieved current model configuration',
      ],
      meta: { method: 'GET', endpoint: '/api/agent/stats', status: 200, latencyMs: 145 },
    },
  ]

  const events = []
  let id = 0
  for (let i = 0; i < 45; i++) {
    const typeGroup = types[Math.floor(Math.random() * types.length)]
    const titleIdx = Math.floor(Math.random() * typeGroup.titles.length)
    const d = new Date(now)
    d.setMinutes(d.getMinutes() - i * 15 - Math.floor(Math.random() * 10))
    events.push({
      id: String(id++),
      type: typeGroup.type,
      timestamp: d.toISOString(),
      title: typeGroup.titles[titleIdx],
      summary: typeGroup.summaries[titleIdx],
      durationMs: Math.floor(Math.random() * 5000),
      metadata: { ...typeGroup.meta },
    })
  }

  // Build summary
  const byType: Record<string, number> = {}
  for (const e of events) {
    byType[e.type] = (byType[e.type] || 0) + 1
  }

  return { events, summary: { total: events.length, byType } }
}

export const TEST_ACTIVITY = generateActivityEvents()
