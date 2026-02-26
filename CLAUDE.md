# OpenAgents — Codebase Guide

App Store-style marketplace for OpenClaw AI agents. Users hire assistants; creators publish and earn.

## Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui
- **Backend**: Supabase (Postgres + Auth + Realtime + Edge Functions)
- **Agent runtime**: OpenClaw in Firecracker microVMs on Fly.io Machines
- **Background jobs**: Trigger.dev v3 (provision, health-check, billing)
- **Payments**: Stripe (subscriptions + Connect Express for creator payouts)
- **Package manager**: pnpm (monorepo with Turborepo)

## Monorepo Structure

```
apps/
  marketplace/        # Next.js 15 app — main product (Vercel)
  sse-gateway/        # Hono app — SSE proxy on Fly.io (bridges Vercel ↔ agent 6PN)
  docs/               # Architecture documentation
packages/
  db/                 # Supabase client, types, auth middleware
  fly/                # Typed Fly Machines API client
  ui/                 # Shared shadcn components
  config/             # Shared ESLint, TypeScript, Prettier config
supabase/
  functions/          # Edge Functions (webhooks)
trigger/              # Trigger.dev task definitions
docker/
  agent-base/         # Base OpenClaw Docker image
```

## Commands

```bash
pnpm dev              # Run all apps in dev mode
pnpm dev --filter marketplace   # Run marketplace only
pnpm build            # Build all
pnpm lint             # Lint all
pnpm type-check       # Type-check all
```

## marketplace app

**Entry**: `apps/marketplace/src/`

### Route Groups

| Group | Routes | Auth |
|-------|--------|------|
| `(public)` | `/`, `/discover`, `/agents/[id]`, `/login` | None |
| `(workspace)` | `/workspace/*`, `/settings/*`, `/usage` | Required → `/login` |
| `(platform)` | `/platform/*` | Required (creator role) → `/platform/login` |

### Key Files

```
src/
  app/
    layout.tsx                    # Root layout (fonts, providers, theme)
    globals.css                   # Tailwind v4 + shadcn CSS vars (edit --radius etc here)
    icon.tsx                      # Favicon (auto-generated from Sierpinski logo)
    (public)/layout.tsx           # Public layout — uses PublicSiteHeader
    (workspace)/layout.tsx        # Workspace layout — auth guard
    (platform)/layout.tsx         # Platform layout — auth guard
    auth/callback/route.ts        # OAuth callback handler
  components/
    ui/                           # shadcn components (don't edit manually)
    public-site-header.tsx        # Nav with search bar (/ shortcut)
    sierpinski-logo.tsx           # SVG logo
    providers.tsx                 # Theme provider
  lib/
    auth/
      actions.ts                  # signInWithGoogle, signInWithGitHub, signOut
      get-user.ts                 # getUser() — server-side
    trigger.ts                    # triggerProvision, triggerDestroy helpers
    utils.ts                      # cn() helper
  middleware.ts                   # Supabase session refresh on every request
```

### Styling

Global design tokens live in `src/app/globals.css`. Change these to restyle the whole app:

```css
--radius: 1rem;          /* border radius scale */
--primary: ...           /* brand color */
```

shadcn components auto-derive from these variables. Never hardcode `rounded-lg` values in one-off components — change the token.

## Auth Flow

1. User clicks "Continue with Google" → `signInWithGoogle()` server action
2. Supabase redirects to Google → callback hits `/auth/callback`
3. `exchangeCodeForSession()` sets cookie → redirect to `/workspace/home`
4. `middleware.ts` refreshes session on every request
5. Layout files double-check auth and redirect if unauthenticated
6. On first sign-up: `handle_new_user` Postgres trigger creates `users` row + 100 free credits

## Database

Schema in Supabase. Key tables:

| Table | Purpose |
|-------|---------|
| `users` | User profiles (mirrors auth.users) |
| `agents` | Marketplace listings |
| `agent_instances` | User ↔ Agent pair + Fly.io machine info |
| `sessions` | Chat sessions |
| `messages` | Message history |
| `credit_balances` | User credits (subscription + topup) |
| `credit_transactions` | Credit ledger |
| `usage_events` | Token/compute usage per session |
| `creator_earnings` | Per-session earnings for creators |
| `relay_connections` | Telegram/Slack/Discord/WhatsApp links |

RLS is enabled on all tables. Service role (used by Trigger.dev) bypasses RLS.

## Agent Lifecycle

```
User hires → agent_instances INSERT (status=provisioning)
  → Supabase DB webhook → Edge Function: on-purchase-created
  → Trigger.dev: provision-agent-machine
  → Fly.io: create App + Volume + Machine
  → Machine starts OpenClaw on port 18789
  → agent_instances UPDATE (status=running)
  → User redirected to chat
```

Suspend/resume is handled automatically by Fly.io (`autostop: suspend`). ~200-500ms resume.

## OpenClaw API Key Storage

**CRITICAL**: OpenClaw does NOT read API keys from environment variables. It reads them from `auth-profiles.json` on the volume:

```
/data/agents/main/agent/auth-profiles.json
```

This file must exist on the agent's volume for the agent to call any LLM provider. Format:

```json
{
  "profiles": {
    "google": { "type": "api-key", "apiKey": "<GEMINI_API_KEY>" },
    "anthropic": { "type": "api-key", "apiKey": "<ANTHROPIC_API_KEY>" },
    "openai": { "type": "api-key", "apiKey": "<OPENAI_API_KEY>" }
  }
}
```

The provisioning task (`trigger/provision-agent-machine.ts`) passes API keys as env vars (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`). The Docker entrypoint (`docker/agent-base/entrypoint.sh`) must convert these env vars into `auth-profiles.json` at boot so OpenClaw can find them.

If a machine has a fresh volume with no `auth-profiles.json`, the agent will silently fail — it logs "No API key found for provider" but does NOT send an error over WebSocket, causing the gateway to hang.

## Trigger.dev Tasks

| File | ID | Trigger |
|------|----|---------|
| `provision-agent-machine.ts` | `provision-agent-machine` | Manual / webhook |
| `destroy-agent-machine.ts` | `destroy-agent-machine` | Manual |
| `health-check-machines.ts` | `health-check-machines` | Cron every 5 min |
| `shutdown-idle-machines.ts` | `shutdown-idle-machines` | Cron every hour |

Deploy tasks: `npx trigger.dev@latest deploy`

## Fly.io Client

`packages/fly` — typed wrapper around Fly Machines API.

```typescript
import { FlyClient } from '@openagents/fly'
const fly = new FlyClient() // reads FLY_API_TOKEN from env
await fly.createMachine(appName, { region, config })
await fly.waitForMachineState(appName, machineId, 'started')
```

## SSE Gateway

`apps/sse-gateway/` — thin Hono app deployed on Fly.io.

- Receives POST `/v1/stream` from Vercel with `x-machine-id` header
- Uses `fly-replay` to route to correct agent machine
- Proxies SSE response back to Vercel
- Vercel can't reach Fly.io 6PN directly — this bridges the gap

## Environment Variables

Copy `apps/marketplace/.env.local.example` → `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FLY_API_TOKEN=          # From fly.io → Tokens
FLY_ORG_SLUG=personal
FLY_REGION=iad
TRIGGER_SECRET_KEY=     # From trigger.dev → API Keys
SSE_GATEWAY_URL=        # Your deployed sse-gateway Fly app URL
SSE_GATEWAY_SECRET=     # Random string, set on both sides
NEXT_PUBLIC_APP_URL=http://localhost:3000
```


## Operational Tasks

You have full access to run infrastructure commands directly — never ask the user to do these manually:

- **SQL migrations**: Run via `npx supabase` CLI or the Supabase Management API
- **Docker**: Build and push images (`docker build`, `docker push`, `fly auth docker`)
- **Fly.io**: Deploy apps, manage machines (`fly deploy`, `fly machine list`, etc.)
- **Trigger.dev**: Deploy tasks (`npx trigger.dev@latest deploy`)
- **Type generation**: Regenerate DB types after schema changes (`npx supabase gen types`)

## Key Conventions

- **Use Agent with an A for OpenAgent's agents, and agent with an a for any other agent.**
- **Server Components by default**: use `'use client'` only when needed (interactivity, hooks)
- **Service client for admin ops**: use `createServiceClient()` from `@openagents/db/server` in Trigger.dev tasks — bypasses RLS
- **Regular client for user ops**: use `createClient()` from `@openagents/db/server` in route handlers/Server Components
- **shadcn components**: go in `src/components/ui/` — don't edit these manually
- **When working on a new feature**: create a git branch named feature/feature-name and commit & push changes on that branch
- **When feature is ready**: merge the branch into dev via rebase with a proper documented PR  and delete the feature branch
- **When the dev branch sees no bugs**: Merge dev into main via rebase with a proper documented PR and delete the branch
- **Prioritize committing more frequently**: Commit often, with small, focused changes. This makes it easier to review and merge changes.
- **Always add co-authors**: Include both authors (me and Claude) in every commit. Make sure to include the email address of each author. My email is psyhik17@gmail.com and my Github username is re-marked.

## Worktrees for Parallel Sessions

When the user wants you to work on a feature in parallel with other Claude Code sessions, use a git worktree. This gives you an isolated copy of the repo on your own branch so you don't interfere with other sessions.

### How to set up a worktree

```bash
# Create a worktree branched off dev
git worktree add .claude/worktrees/feature-xyz -b feature/xyz dev

# Install dependencies in the worktree
cd .claude/worktrees/feature-xyz && pnpm install
```

Then do all your work inside `.claude/worktrees/feature-xyz/`. Commit and push to `feature/xyz` as normal.

### When you're done

```bash
# Push your branch
git push -u origin feature/xyz

# Create a PR to merge feature/xyz → dev via rebase
gh pr create --base dev --title "feat: xyz" --body "..."

# Go back to repo root and remove the worktree
cd /path/to/openagents
git worktree remove .claude/worktrees/feature-xyz
```

### Rules you must follow

- Always branch worktrees off `dev`, never off `main`
- Never have two worktrees on the same branch
- Never push to a branch that another session is using
- Always remove the worktree after the PR is merged — run `git worktree prune` to clean up stale refs
- If the user says `/worktree`, use the built-in Claude Code worktree command instead of manual setup
