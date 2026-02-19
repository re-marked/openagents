# System Design

## Component Architecture

### 1. Next.js 15 App (Vercel)

**Role:** Frontend, API routes, auth middleware, SSE proxy initiation.

Three logical sections, one codebase:
- **Marketplace** (`/`, `/discover`, `/agents/:id`) — Public, SSR for SEO
- **Workspace** (`/workspace/*`) — Authenticated, client-heavy, real-time
- **Platform** (`platform.openagents.com/*`) — Creator tools, Monaco editor

Key patterns:
- App Router with parallel routes for workspace layout
- Server Components for marketplace pages (SEO)
- Client Components for chat, real-time, Monaco editor
- Route handlers for SSE proxy, webhook ingestion, Stripe webhooks
- Middleware for auth checks (Supabase SSR)

### 2. Supabase

**Role:** Database, auth, real-time, edge functions, encrypted storage.

**Postgres** — All application data with Row Level Security (RLS) on every table. Multi-tenant by default: users can only see/modify their own data. Service role bypasses RLS for admin operations (Trigger.dev jobs, internal APIs).

**Auth** — Google OAuth for users, GitHub OAuth for creators. Custom JWT claims via auth hook (injects user_role, org_id into JWT). Supabase SSR package for Next.js middleware integration.

**Realtime (Broadcast)** — Token-by-token streaming from Agent to browser. We use Broadcast (not Postgres Changes) because Broadcast is horizontally scalable while Postgres Changes is single-threaded. Pattern: Agent streams → server broadcasts chunks → client renders.

**Edge Functions** — Webhook ingestion for Telegram, WhatsApp, Slack. Lightweight (150ms CPU limit). Immediately ack the platform, enqueue message for async processing.

**Vault (pgsodium)** — Encrypted storage for SSH credentials and user-provided API keys. Data encrypted at rest, decryptable only in the user's session context.

### 3. Fly.io

**Role:** Agent compute runtime. One Firecracker microVM per user-Agent pair.

**Machine topology:** One Fly.io App per Agent type (e.g., `agent-legal-reviewer`). One Machine per user-Agent instance. Machines isolated by Firecracker hypervisor — hardware-enforced, not just namespace-enforced.

**For stronger isolation:** Create one Fly.io App per customer with a custom 6PN network (`network: "customer-{userId}"`). This prevents cross-user machine communication even if a machine is compromised. Tradeoff: operational complexity at scale.

**SSE Gateway App:** A thin Fly.io App that receives SSE requests from Vercel and uses `fly-replay` to route to the correct Agent Machine. This solves the problem that Vercel functions cannot reach Fly.io's 6PN internal network.

**Discord Gateway Bot:** A persistent Fly.io Machine running the Discord.js WebSocket client. `autostop: "off"` — always running. Costs ~$1.94/month.

### 4. Trigger.dev v3

**Role:** Background jobs, scheduled tasks, long-running operations.

Key tasks:
- `provision-agent-machine` — Creates Fly.io App, Volume, Machine. Triggered by purchase webhook.
- `health-check-machines` — Cron every 5 minutes. Pings all running machines, restarts failed ones.
- `shutdown-idle-machines` — Cron hourly. Stops machines inactive >2 hours.
- `aggregate-usage-billing` — Cron hourly. Reports usage to Stripe metering.
- `process-relay-message` — Async. Routes messages from Telegram/WhatsApp/Slack to the correct Machine.
- `deploy-agent-update` — Triggered when creator pushes to GitHub. Rolls out new config to existing machines.

CRIU checkpointing means tasks that `await` (sleeping, waiting for external events) consume zero compute. Only billed when CPU is active.

Concurrency control: per-user keys prevent one user's workload from starving others.

### 5. Stripe

**Role:** All payments.

**Stripe Billing** — Subscription plans (Basic/Pro/Power) and credit top-up one-time purchases. Customer portal for self-serve plan changes.

**Stripe Connect Express** — Creator payouts. Handles KYC, ID verification, tax reporting (1099). Monthly transfers from platform account to creator connected accounts.

### 6. OpenClaw Runtime

**Role:** The agent brain inside each Fly.io Machine.

Each Machine runs the official OpenClaw Docker image (`ghcr.io/openclaw/openclaw:latest`) with:
- Agent configuration from the creator's repo (agent.yaml, skills, SOUL.md)
- Platform-managed API keys (Anthropic, OpenAI) injected as environment variables
- Gateway exposed on port 18789 (internal, reachable via 6PN)
- Persistent volume at `/data` for state (conversations, memory, config)
- Gateway token for authentication

OpenClaw provides:
- LLM provider abstraction (Claude, GPT, Gemini, Llama)
- Tool execution (CLI, file system, web search, API calls)
- Session management (JSONL append-only)
- Memory system (persistent across sessions)
- Skill loading (SKILL.md files)
- Context compaction (when conversations exceed token limits)
- HTTP API endpoints: `POST /v1/chat/completions` (OpenAI-compatible), `POST /v1/responses` (streaming)

---

## Request Flow: User Sends a Chat Message

```
1. User types message in browser
2. Browser POSTs to /api/chat/stream (Next.js route handler on Vercel)
3. Route handler:
   a. Authenticates user (Supabase JWT)
   b. Checks credit balance (must have ≥ estimated session credits)
   c. Looks up user's Agent Machine (Supabase query)
   d. If Machine is suspended: Fly.io auto-starts it (~500ms)
4. Route handler creates a ReadableStream and returns it immediately
5. Inside the stream:
   a. Fetches SSE from Fly.io SSE Gateway (public URL)
   b. SSE Gateway uses fly-replay to route to the specific Agent Machine
   c. Agent Machine's OpenClaw instance processes the message
   d. OpenClaw streams response tokens via SSE
   e. Each token chunk is forwarded to the browser + broadcast via Supabase Realtime
6. When stream completes:
   a. Full response persisted to Supabase (messages table)
   b. Usage event recorded (tokens consumed, compute seconds)
   c. Credit balance atomically decremented
   d. Creator earning record created
```

---

## Request Flow: Telegram Message → Agent → Response

```
1. User sends message to Telegram bot
2. Telegram POSTs webhook to Supabase Edge Function
3. Edge Function:
   a. Immediately returns 200 OK (Telegram requires fast ack)
   b. Enqueues message to processing queue
4. Trigger.dev task picks up the message:
   a. Looks up Telegram user → OpenAgents user → Agent Machine
   b. If no Machine: provisions one (30-60 seconds, sends "Setting up..." message)
   c. POSTs message to Agent Machine via 6PN internal DNS
   d. Collects full response (no streaming on Telegram)
   e. Sends response back to Telegram via Bot API
5. Usage metered and credits deducted
```

---

## Data Flow: Creator Publishes an Agent

```
1. Creator connects GitHub repo on Platform
2. Platform validates repo structure:
   - agent.yaml ✓
   - .skills/ ✓
   - openagents.yaml ✓
   - README.md ✓
3. Security scan runs:
   - Semgrep for injection patterns
   - Dependency scan (if npm/pip present)
   - SKILL.md analysis for suspicious tool declarations
4. If scan passes: Agent enters "ready to publish" state
5. Creator configures marketplace metadata in split-panel editor
6. Creator clicks "Publish"
7. Agent record created in Supabase (agents table)
8. Docker image built from base OpenClaw + creator's config
9. Image pushed to Fly.io registry
10. Agent appears on marketplace (status: published)
11. When a user hires: Trigger.dev provisions a Machine from this image
```
