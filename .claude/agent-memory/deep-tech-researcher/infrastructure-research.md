# Infrastructure Research: OpenAgents Marketplace Stack

Research date: 2026-02-19 (updated with full detail pass)

---

## 1. Fly.io Machines API

### Base URLs
- Public: `https://api.machines.dev`
- Internal (within Fly.io private network): `http://_api.internal:4280`
- Auth: `Authorization: Bearer <FLY_API_TOKEN>` on every request

### Full Lifecycle Operations

```
POST   /v1/apps                                    — create a new app
POST   /v1/apps/{app}/machines                    — create + optionally launch machine
POST   /v1/apps/{app}/machines/{id}/start         — start a stopped machine
POST   /v1/apps/{app}/machines/{id}/stop          — stop (keep rootfs, bill storage only)
DELETE /v1/apps/{app}/machines/{id}?force=true    — destroy machine entirely
POST   /v1/apps/{app}/machines/{id}/suspend       — suspend (CRIU snapshot, fastest resume)
GET    /v1/apps/{app}/machines/{id}/wait?state=started&timeout=60  — poll until state
GET    /v1/apps/{app}/machines/{id}               — get machine details
GET    /v1/apps/{app}/machines                    — list all machines in app
POST   /v1/apps/{app}/machines/{id}/exec          — run command inside machine
```

### Machine Create Config (full JSON schema)

```json
{
  "name": "agent-user123",
  "region": "iad",
  "config": {
    "image": "ghcr.io/openclaw/openclaw:latest",
    "guest": {
      "cpu_kind": "shared",
      "cpus": 1,
      "memory_mb": 512
    },
    "env": {
      "OPENCLAW_GATEWAY_TOKEN": "secret",
      "ANTHROPIC_API_KEY": "sk-ant-..."
    },
    "services": [
      {
        "protocol": "tcp",
        "internal_port": 18789,
        "autostop": "stop",
        "autostart": true,
        "ports": [{"port": 443, "handlers": ["tls", "http"]}]
      }
    ],
    "mounts": [
      {
        "volume": "vol_abc123",
        "path": "/data"
      }
    ],
    "restart": {"policy": "on-failure", "max_retries": 3}
  }
}
```

### CPU/Memory Sizing

| Preset | cpu_kind | CPUs | Memory | Per-second | Per-hour | Per-month |
|--------|----------|------|--------|------------|----------|-----------|
| shared-cpu-1x | shared | 1 | 256MB | $0.00000075 | $0.0027 | $1.94 |
| shared-cpu-2x | shared | 2 | 512MB | $0.0000015 | $0.0054 | $3.88 |
| shared-cpu-4x | shared | 4 | 1GB | $0.000003 | $0.0108 | $7.76 |
| shared-cpu-8x | shared | 8 | 2GB | $0.000006 | $0.0216 | $15.53 |
| performance-1x | performance | 1 | 2GB | $0.000031 | $0.1116 | $80.35 |
| performance-2x | performance | 2 | 4GB | $0.000062 | $0.2232 | $160.70 |
| performance-4x | performance | 4 | 8GB | $0.000124 | $0.4464 | $321.41 |
| performance-8x | performance | 8 | 16GB | $0.000248 | $0.8928 | $642.82 |
| performance-16x | performance | 16 | 32GB | $0.000496 | $1.7856 | $1285.63 |

- Additional RAM: ~$5 per 30 days per GB above preset
- Storage (volumes): $0.15/GB/month (billed always, even if machine stopped)
- Volume snapshots: charged separately since Jan 2026
- Bandwidth: $0.02/GB outbound (first 100GB/month free)
- 40% discount available with reserved compute blocks

### Cold Start Times
- MicroVM launch (Firecracker-based): sub-second, ~200–500ms typical
- Machine SUSPEND → RESUME: hundreds of milliseconds (fastest option, state preserved)
- Machine STOP → START: ~1–3 seconds (boots from rootfs, no state)
- Docker image pull (first ever): 30–120 seconds (mitigated by pre-warming)
- Pre-warmed pool strategy recommended: create N machines ahead of time, assign on demand

### Auto-Stop / Auto-Start
Three autostop modes:
1. `"off"` — never autostop (always running, billed continuously)
2. `"stop"` — stop machine when no requests (billed for storage only when stopped)
3. `"suspend"` — CRIU suspend when idle (fastest resume, minimal billing)

Autostart: `true` — Fly Proxy automatically starts the machine when a request arrives.
Configured per service in the machine config `services[].autostop` / `services[].autostart`.

### Networking: 6PN (IPv6 Private Network)
- All apps in the same Fly.io organization share a WireGuard mesh (6PN)
- Each machine gets a 6PN address: `machine-id.internal`
- DNS discovery: `{app-name}.internal` resolves to all running machines in that app
- Custom 6PN: create app with `network` field to isolate per-customer — apps on different 6PNs can't communicate without explicit config
- Flycast: internal load balancer on 6PN for private services (no public exposure)

### fly-replay Header (Subdomain/Machine Routing)
- Router app receives all requests to `*.yourdomain.com`
- Extracts subdomain → looks up userId → finds machineId
- Sets response header: `fly-replay: instance=<machine_id>,app=<app_name>`
- Fly Proxy internally redirects to that specific machine
- Latency added: ~10ms (router app co-located with user)
- Falls back to any available machine if specified instance unavailable

### Apps vs Machines
- App = logical namespace grouping machines; required before creating machines
- One App can have zero to thousands of Machines
- For OpenAgents: create one App per agent-user pair (isolates 6PN networks) OR one shared App with machine-per-user (simpler, less isolated)
- Recommendation: shared App per agent type, machine per user session. Use custom 6PN per customer for strongest isolation.

### Volumes (Persistent Storage)
- Create: `POST /v1/apps/{app}/volumes` with `{"name":"data","size_gb":1,"region":"iad"}`
- Attach at machine create time via `mounts` array
- Volume is tied to a region — machine and volume must be in same region
- One volume = one machine at a time (not shared across machines)
- Daily snapshots default: 5-day retention (configurable 1–60 days)
- Fork volume: create exact copy in same region on different physical host
- Volume persists when machine is destroyed (must delete explicitly)

### Per-User Dev Environment Blueprint (Official Fly.io Pattern)
- Router app on `*.example.com` wildcard cert
- Per-user: 1 Fly App + 1 Machine + 1 Volume
- fly-replay for request routing to specific machine
- Pre-create pool of 10–50 machines for instant assignment
- OpenClaw fits this model perfectly: port 18789 (gateway), port 18790 (bridge)

---

## 2. Container Orchestration & Isolation

### Isolation Technology Comparison

| Technology | Isolation Level | Cold Start | Overhead | Best For |
|-----------|----------------|------------|---------|----------|
| Docker/runc | Shared kernel | ~100ms | Minimal | Trusted code only |
| gVisor (runsc) | Syscall interception | ~200ms | 10-30% I/O | Semi-trusted, fast |
| Firecracker microVM | Dedicated kernel | ~125ms | <5MB RAM | Untrusted code |
| Kata Containers | Hardware VM | ~1-2s | Higher | Maximum isolation |
| WASM (Wasmtime) | Language sandbox | <10ms | Minimal | Compute-only tasks |

### For OpenAgents: Recommended Stack
- Fly.io Machines use Firecracker under the hood — each Machine IS a microVM
- No additional sandbox layer needed if using Fly.io (hardware isolation already)
- One Machine per user-agent session = true isolation, dedicated kernel
- Resource limits: set `guest.cpus` and `guest.memory_mb` per machine

### Security Isolation Best Practices
- Never run multiple users' agents in the same container
- Use Fly.io custom 6PN per customer to prevent network-level lateral movement
- Set CPU and memory hard limits in machine config
- Run OpenClaw container as non-root user (add `--user node` in Dockerfile)
- Disable capabilities: `cap_drop: [ALL]`; only add back what's needed
- No host network mode
- Read-only rootfs where possible (mount /data volume for state)

### Apify Actor Model (Reference Architecture)
- Each "actor run" = isolated Docker container
- Input/output via key-value stores (S3-backed), datasets, request queues
- Actor gets: INPUT record, env vars, Apify proxy, storage APIs
- Platform manages container lifecycle, scheduling, scaling
- Usage billing: $0.004/compute unit (CU); 1 CU = 1 CPU-hour at 4GB RAM
- Actors can call other actors via API (actor-to-actor communication)
- Docker image stored in Apify registry; user provides Dockerfile

### CodeSandbox/Replit Reference
- CodeSandbox: Firecracker microVMs, resume in ~500ms, clone in <1s
- Replit: Each project in isolated Linux container; 50+ language support
- Both: pre-warm pools, lazy loading of images

---

## 3. Messaging Platform Integration

### 3.1 Telegram Bot API
- Two update modes: polling (getUpdates) or webhook (setWebhook)
- Webhook: HTTPS POST to your URL on every update (JSON payload)
- Supported webhook ports: 443, 80, 88, 8443 only
- SSL required (self-signed allowed if cert provided to setWebhook)
- Max connections per webhook: configurable (1–100), default 40
- Webhook MUST respond within 60 seconds with 2xx (async process recommended)
- Self-hosted Bot API server option: run `docker run -d -p 8081:8081 aiogram/telegram-bot-api`
  - Enables files >20MB, custom domains, no rate limit differences

**Routing to Agent Containers:**
```
Telegram → your HTTPS webhook endpoint (Next.js Edge Function or Supabase Edge Function)
→ look up user_id → find their Fly.io machine_id
→ POST to machine's internal 6PN URL: http://{machine_id}.internal:18789/api/chat
→ stream response back (collect full response, reply via Telegram sendMessage API)
```
Note: Telegram does not support streaming responses — collect the full agent response then send.

### 3.2 WhatsApp Business Cloud API (Meta)
- On-Premises API deprecated October 2025; Cloud API is the only supported path
- Webhook config: phone_number level overrides WABA level
- WABA-to-App subscription required: `POST /{WABA_ID}/subscribed_apps` (undocumented gotcha — missing subscription = silent webhook failure)
- Webhook fields to subscribe: `messages`, `message_deliveries`, `message_reads`
- Rate limits: ~80 messages/sec per phone number (tier-based, rises with quality rating)
- Message types: text, image, video, document, audio, template, interactive (buttons/lists)
- Templates required for business-initiated conversations (24h window rule)
- Verify webhook: GET with `hub.challenge` query param (must echo it back)

**Routing Pattern:**
```
WhatsApp Cloud API → POST webhook (Supabase Edge Function or Next.js route)
→ extract wa_id (user phone) → look up agent assignment
→ route to appropriate Fly.io machine via internal 6PN
→ sendMessage via Graph API (/v18.0/{phone_number_id}/messages) with response
```

### 3.3 Slack Bot API
- Two delivery modes:
  1. HTTP Events API (webhook): Slack POSTs events to your URL. Best for production.
  2. Socket Mode: WebSocket from your server to Slack. Best for dev/firewalled.
- For production distributed apps: use HTTP Events API (stateless, scalable)
- Slash commands and interactions → HTTP POST to your Interactions Endpoint URL
- Bot token scopes: `chat:write`, `channels:history`, `im:history` (at minimum)
- 3-second response window for interactions (must ack within 3s, then use `response_url`)
- Rate limits: Tier 1 = 1/min, Tier 2 = 20/min, Tier 3 = 50/min, Tier 4 = 100/min (per workspace)

**Routing Pattern:**
```
Slack → POST to your route handler (verify X-Slack-Signature)
→ immediate 200 OK (within 3s or Slack times out)
→ async: look up team_id + user_id → find machine
→ POST message to Fly.io machine
→ respond via response_url or chat.postMessage
```

### 3.4 Discord Bot API
Two architectures, mutually exclusive per application:

**Gateway WebSocket (full bot):**
- Persistent WebSocket to `wss://gateway.discord.gg`
- Required for: reading messages, presence, reactions, guild events
- Must maintain heartbeat (Discord sends HEARTBEAT_ACK, kill connection if missed)
- Max 2500 guilds per shard; shard count = Math.ceil(guilds / 2500)
- Not compatible with Vercel serverless (requires persistent process)
- Best deployed as: a Fly.io Machine running a long-lived Node.js process

**HTTP Interactions Endpoint (serverless-compatible):**
- Discord POSTs slash commands, buttons, select menus, modals to your URL
- Must respond within 3 seconds (type 5 = deferred response for longer work)
- Works with Vercel/Supabase Edge Functions
- Cannot receive regular message events (slash commands only)
- Verify signature: `X-Signature-Ed25519` + `X-Signature-Timestamp` headers

**Routing Pattern (Gateway bot on Fly.io):**
```
Fly.io Machine running Discord.js/Discordeno gateway bot
→ on MESSAGE_CREATE event with @mention or DM
→ identify user_id → look up their assigned agent machine
→ POST to agent machine internal URL
→ stream response, edit/send Discord message via REST
```

### 3.5 Webhook Management at Scale
For multi-tenant webhook routing at scale:

1. **Queue-first ingestion**: All incoming webhooks → message queue (e.g., Upstash QStash) immediately, respond 200 OK to platform
2. **Tenant isolation**: Separate queue per tenant or per-bot
3. **Fan-out**: One event → N delivery jobs if multiple subscribers
4. **Dead Letter Queue**: Failed deliveries → DLQ after N retries
5. **Idempotency**: Deduplicate via event_id in DB before processing
6. **Circuit breaker**: Stop sending to repeatedly failing endpoints
7. **Rate limiting**: Per-tenant rate limits prevent noisy neighbor

OpenSource option: Hookdeck Outpost (launched 2025) — open source webhook delivery infrastructure.

---

## 4. Trigger.dev v3

### Architecture
- Tasks defined next to app code, compiled via esbuild → Docker image → deployed to Trigger.dev managed elastic serverless runtime
- CRIU (Checkpoint/Restore In Userspace) enables pause/resume without billing during waits
- No maximum task duration (truly unlimited)
- OpenTelemetry tracing built-in; Realtime observability
- Tasks run in isolated processes (no state sharing between tasks)
- Self-hostable (Apache 2.0) but CRIU requires compatible Linux kernel
- Task code loaded dynamically (not all tasks loaded per execution = faster cold starts)

### Pricing (Cloud)
- Free: $0/month + $5 credit, 20 prod concurrent, 1 batch/concurrent
- Hobby: $10/month + $10 credit, 50 prod concurrent
- Pro: $50/month + $50 credit, 200+ prod concurrent
- Compute: $0.0000169/sec (micro 0.25vCPU/0.25GB) to $0.0003400/sec (large 4vCPU/8GB)
- Per-run invocation: $0.000025 ($0.25/10k runs)
- Extra concurrency: $10/month per 50 additional
- No double billing: you pay once, not for orchestrator + runtime separately

### Limits
- Payload: max 3MB (auto-uploads to S3 if >512KB); task output max 10MB
- Batch: 1,000 items per batch
- API rate: 1,500 req/min
- Realtime connections: 10 (Free) / 50 (Hobby) / 500+ (Pro)
- Schedules: 10 (Free) / 100 (Hobby) / 1,000+ (Pro)
- Projects: 10 per org

### Concurrency Keys (multi-tenant)
```typescript
// Creates separate queue per user — prevents one user from starving others
await myTask.trigger(payload, {
  queue: "free-users",
  concurrencyKey: userId,
});
```

### Next.js Integration Pattern
```typescript
// trigger/agent-deploy.ts
import { task, wait } from "@trigger.dev/sdk/v3";

export const deployAgentMachine = task({
  id: "deploy-agent-machine",
  run: async (payload: { userId: string; agentId: string; imageTag: string }) => {
    // 1. Create Fly.io app (if not exists)
    const app = await createFlyApp(payload.agentId);
    // 2. Create volume for persistence
    const volume = await createFlyVolume(app.name, "iad");
    // 3. Create machine with OpenClaw image
    const machine = await createFlyMachine(app.name, {
      image: `ghcr.io/openagents/openclaw-runner:${payload.imageTag}`,
      volume: volume.id,
      env: { USER_ID: payload.userId }
    });
    // 4. Wait for machine to start (up to 30s)
    await waitForMachine(app.name, machine.id);
    // 5. Update DB with machine details
    await supabase.from("agent_instances").upsert({
      user_id: payload.userId,
      agent_id: payload.agentId,
      machine_id: machine.id,
      app_name: app.name,
      status: "running"
    });
    return { machineId: machine.id, appName: app.name };
  }
});

// app/api/agent/deploy/route.ts
import { tasks } from "@trigger.dev/sdk/v3";
export async function POST(req: Request) {
  const payload = await req.json();
  const handle = await tasks.trigger<typeof deployAgentMachine>(
    "deploy-agent-machine",
    payload
  );
  const publicToken = await auth.createPublicToken({
    scopes: { read: { runs: [handle.id] } },
    expirationTime: "1hr",
  });
  return Response.json({ runId: handle.id, token: publicToken });
}
```

### Realtime Frontend Hooks
```typescript
import { useRealtimeRun } from "@trigger.dev/react-hooks";
const { run, error } = useRealtimeRun(runId, { accessToken: publicToken });
// run.status: "QUEUED" | "EXECUTING" | "COMPLETED" | "FAILED"
// run.output: typed output from your task
// run.metadata: live-updating metadata you push from task
```

### Use Cases for OpenAgents
- Agent machine provisioning (create Fly machine + volume + DNS)
- Agent health checks on schedule (ping machine, restart if unhealthy)
- Billing metering (aggregate usage, report to Polar.sh)
- Agent shutdown for inactive sessions (stop machine after N hours idle)
- Skill installation pipeline (pull SKILL.md, validate, install into machine)
- Bulk actions: batch health checks across all machines

### Trigger.dev does NOT orchestrate arbitrary Docker containers
- It runs YOUR task code in its managed containers
- To orchestrate Fly.io Machines, write Trigger.dev tasks that call Fly Machines REST API

### Supabase → Trigger.dev Integration
```typescript
// Supabase Edge Function (triggered by DB webhook on INSERT into agent_jobs)
import { tasks } from "npm:@trigger.dev/sdk@latest";
Deno.serve(async (req) => {
  const payload = await req.json();
  await tasks.trigger("deploy-agent-machine", {
    userId: payload.record.user_id,
    agentId: payload.record.agent_id,
  });
  return new Response("ok");
});
```

---

## 5. Supabase

### Auth: Multiple Providers
- Supported OAuth: Google, GitHub, Apple, Discord, Slack, Notion, Twitch, Twitter, LinkedIn, etc.
- For OpenAgents: Google OAuth for consumers, GitHub OAuth for creators
- JWT: RS256 asymmetric by default (recommended); HS256 supported for legacy
- Custom JWT claims via Auth Hooks (Custom Access Token Hook)
- Multi-tenant claims: inject `org_id` or `tenant_id` into JWT via hook

```sql
-- Custom Access Token Hook (Postgres function)
CREATE OR REPLACE FUNCTION add_tenant_claims(event jsonb) RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  claims := event->'claims';
  SELECT role INTO user_role FROM user_profiles WHERE id = (event->>'user_id')::uuid;
  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql;
```

### Row Level Security Patterns for Multi-Tenant Marketplace

**Core pattern: tenant_id in every table**
```sql
-- Enable RLS on every table
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Agent listing: public read, creator write
CREATE POLICY "agents_public_read" ON agents
  FOR SELECT USING (status = 'published');

CREATE POLICY "agents_creator_write" ON agents
  FOR ALL USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Purchases: user can see their own
CREATE POLICY "purchases_own" ON purchases
  FOR SELECT USING (buyer_id = auth.uid());

-- Agent instances: user can see their own machines
CREATE POLICY "instances_own" ON agent_instances
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role bypasses all RLS (for backend operations)
-- Set SUPABASE_SERVICE_ROLE_KEY in server-only code
```

**Performance: always index RLS columns**
```sql
CREATE INDEX idx_agents_creator_id ON agents(creator_id);
CREATE INDEX idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX idx_instances_user_id ON agent_instances(user_id);
```

**Scale warning with Postgres Changes:** Single-threaded; 100 subscribers × 1 INSERT = 100 auth checks. At scale, switch to server-side Postgres Changes re-streamed via Broadcast.

### Realtime: Chat Architecture

**Pattern for agent chat (recommended):**
```typescript
// Server: write to DB + broadcast simultaneously
await supabase.from("messages").insert({ session_id, content, role: "assistant" });
await supabase.channel(`session:${session_id}`).send({
  type: "broadcast",
  event: "message",
  payload: { content, role: "assistant" }
});

// Client: subscribe to Broadcast (not Postgres Changes)
const channel = supabase.channel(`session:${session_id}`, {
  config: { broadcast: { ack: true } }
});
channel.on("broadcast", { event: "message" }, ({ payload }) => {
  setMessages(prev => [...prev, payload]);
}).subscribe();
```

**Realtime Limits by Plan:**
| Plan | Concurrent Connections | Msg/sec | Broadcast Payload |
|------|----------------------|---------|-------------------|
| Free | 200 | 100 | 256KB |
| Pro | 500 | 500 | 3MB |
| Pro (no cap) | 10,000 | 2,500 | 3MB |
| Team/Enterprise | 10,000+ | 2,500+ | 3MB |

### Edge Functions for Webhooks
```typescript
// supabase/functions/telegram-webhook/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // Telegram sends POST with no auth header — configure in config.toml:
  // [functions.telegram-webhook]
  // verify_jwt = false

  const update = await req.json();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Look up user's agent machine
  const { data: instance } = await supabase
    .from("agent_instances")
    .select("machine_id, app_name")
    .eq("telegram_user_id", update.message.from.id)
    .single();

  // Forward to Fly machine via internal API
  const response = await fetch(
    `http://${instance.machine_id}.${instance.app_name}.internal:18789/api/chat`,
    {
      method: "POST",
      body: JSON.stringify({ message: update.message.text }),
    }
  );

  const result = await response.json();

  // Send response back via Telegram
  await fetch(`https://api.telegram.org/bot${Deno.env.get("TELEGRAM_TOKEN")}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: update.message.chat.id,
      text: result.reply,
    }),
  });

  return new Response("ok");
});
```

**Edge Function Limits:**
- 150ms CPU time per invocation (not wall clock — I/O doesn't count)
- 150MB memory
- Response: up to 2MB (larger: use streams)
- Not suitable for long-running tasks — use Trigger.dev instead

### Database Schema Pattern for Marketplace
```sql
-- Users
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  role TEXT DEFAULT 'user', -- 'user' | 'creator' | 'admin'
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents (published skills/agents)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES user_profiles(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  price_monthly NUMERIC, -- null = free
  price_onetime NUMERIC,
  skill_md TEXT, -- raw SKILL.md content
  docker_image TEXT, -- e.g., ghcr.io/creator/agent:latest
  status TEXT DEFAULT 'draft', -- 'draft' | 'published' | 'suspended'
  install_count INTEGER DEFAULT 0,
  rating NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User ↔ Agent subscriptions/purchases
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES user_profiles(id),
  agent_id UUID REFERENCES agents(id),
  type TEXT, -- 'subscription' | 'onetime'
  polar_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, agent_id)
);

-- Running machine instances
CREATE TABLE agent_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  agent_id UUID REFERENCES agents(id),
  fly_app_name TEXT,
  fly_machine_id TEXT,
  fly_volume_id TEXT,
  region TEXT DEFAULT 'iad',
  status TEXT DEFAULT 'provisioning', -- 'provisioning' | 'running' | 'stopped' | 'error'
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_id)
);

-- Chat sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  instance_id UUID REFERENCES agent_instances(id),
  channel TEXT DEFAULT 'web', -- 'web' | 'telegram' | 'slack' | 'discord'
  external_user_id TEXT, -- Telegram user_id, Slack user_id, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage/billing records
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  agent_id UUID REFERENCES agents(id),
  session_id UUID REFERENCES sessions(id),
  event_type TEXT, -- 'tokens', 'compute_seconds', 'api_call'
  quantity NUMERIC,
  unit_cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. SSE / Streaming Architecture

### The Proxy Buffering Problem
Next.js route handlers buffer the entire response before sending when you use async loops.
The fix: return `Response` immediately with a `ReadableStream`, use `X-Accel-Buffering: no`.

### Correct SSE Proxy Pattern (Next.js App Router)
```typescript
// app/api/chat/stream/route.ts
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes (Vercel Pro)

export async function POST(req: Request) {
  const { sessionId, message, userId } = await req.json();

  // Get user's machine from DB
  const instance = await getAgentInstance(userId);

  // Create SSE stream that proxies from Fly.io machine
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Connect to agent machine internal endpoint
        const agentRes = await fetch(
          `http://${instance.fly_machine_id}.${instance.fly_app_name}.internal:18789/api/stream`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
          }
        );

        if (!agentRes.body) throw new Error("No response body");

        const reader = agentRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            break;
          }
          // Forward raw SSE chunk
          controller.enqueue(value);
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`data: {"error":"${err}"}\n\n`));
        controller.close();
      }
    },
    cancel() {
      // Handle client disconnect
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx/CDN buffering
    },
  });
}
```

### Client-side EventSource
```typescript
// Client
const eventSource = new EventSource(`/api/chat/stream?sessionId=${id}`);
eventSource.onmessage = (e) => {
  if (e.data === "[DONE]") {
    eventSource.close();
    return;
  }
  const chunk = JSON.parse(e.data);
  setResponse(prev => prev + chunk.text);
};
eventSource.onerror = () => eventSource.close();
```

### Vercel Streaming Support
- App Router: full streaming support
- Pages Router: NO streaming support (returns entire response at once)
- Hobby: max 300s with Fluid Compute (new default)
- Pro: max 800s with Fluid Compute
- Edge runtime: streaming works, max 30s execution
- `X-Accel-Buffering: no` header required to disable Vercel's edge caching of SSE

### SSE vs WebSocket Decision
Use SSE for this platform because:
- Vercel does NOT support WebSocket long connections in serverless
- SSE works natively with Next.js Route Handlers
- HTTP/2 multiplexing handles multiple SSE streams over one connection
- Auto-reconnect built into EventSource browser API (client handles reconnection)
- Perfect for server→client agent response streaming (unidirectional)

WebSocket requires a persistent process (Fly.io Machine) — only use if you need bidirectional, sub-100ms latency (e.g., real-time collaboration).

---

## 7. Security

### Container Sandboxing Best Practices
1. **One machine per user** — never share a container between users
2. **Non-root execution** — run OpenClaw as node user, not root
3. **Read-only rootfs** — only /data volume writable
4. **No host networking** — use Fly.io 6PN (WireGuard mesh) only
5. **Cap_drop ALL** — drop all Linux capabilities, add back only needed
6. **Resource limits** — hard CPU + memory limits in machine config
7. **Network egress rules** — restrict outbound to only necessary endpoints (Anthropic API, etc.)
8. **No privileged mode** — never `--privileged`
9. **Custom 6PN per customer** — prevent machine-to-machine lateral movement

### Skill/Plugin Signing and Verification
Current state (2026): ClawHub has NO code signing — only a GitHub account (≥1 week old) required.
Snyk "ToxicSkills" study found 13.4% of 3,984 ClawHub skills had critical security issues.

**OpenAgents Hardened Skill Verification Pipeline:**
```
1. SKILL.md submission
2. Static analysis: scan for shell injection, suspicious URLs, exfiltration patterns
3. Docker image build in isolated sandbox (network-restricted)
4. Runtime behavioral analysis: run skill with canary inputs, monitor syscalls/network
5. SAST scan of skill source (Semgrep, Snyk)
6. Human review queue for flagged skills
7. Sign approved skill manifest with Ed25519 key (store signature in registry)
8. Runtime verification: OpenClaw container verifies signature before loading skill
```

### Prompt Injection Prevention
Prompt injection is OWASP LLM Top 10 #1 (2025). 73% of production AI deployments affected.
Trail of Bits demonstrated prompt injection → RCE in AI agents (Oct 2025).

**Defense layers:**
1. **Input sanitization**: strip control characters, limit context injection size
2. **Trust boundary enforcement**: never merge user content with system prompts directly
3. **Context isolation**: skills run in sandboxed tool invocations, not in main context
4. **Output validation**: verify tool call outputs match expected schema before use
5. **Least privilege**: each skill gets only declared tool permissions
6. **Prompt shields**: use Anthropic's built-in injection detection (Claude 3.5+)
7. **Canary tokens**: inject traceable strings to detect exfiltration attempts
8. **Audit logging**: log all tool invocations for forensic review

```typescript
// Input sanitization before passing to agent
function sanitizeUserInput(input: string): string {
  // Remove null bytes, control characters
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Limit length
  sanitized = sanitized.slice(0, 10000);
  // Detect injection attempts (flag but don't block — log for review)
  if (/ignore previous instructions|system prompt|you are now/i.test(sanitized)) {
    auditLog("potential_injection", { input, userId });
  }
  return sanitized;
}
```

### API Key Management (Platform-Managed Keys)

**Architecture:**
- Platform holds the Anthropic API key (never exposed to users)
- One platform key, usage metered per user via Polar.sh Ingestion API
- Per-user encryption: derive a unique encryption key per user (HKDF from master key + user_id)
- Store user's external API keys (if allowed) in Supabase vault or HashiCorp Vault

**Supabase Vault (pgsodium):**
```sql
-- Store encrypted secret per user
SELECT vault.create_secret(
  secret := 'sk-ant-user-key',
  name := 'user_' || user_id || '_anthropic_key',
  description := 'User anthropic API key'
);

-- Retrieve in RLS-protected query
SELECT decrypted_secret FROM vault.decrypted_secrets
WHERE name = 'user_' || auth.uid() || '_anthropic_key';
```

**Machine-level secret injection:**
```typescript
// When creating Fly.io machine, inject secrets as env vars (encrypted at rest by Fly)
const machine = await createFlyMachine(appName, {
  env: {
    ANTHROPIC_API_KEY: platformApiKey, // Platform key, metered per user
    OPENCLAW_GATEWAY_TOKEN: await generateMachineToken(userId),
  }
});
// Never log these env vars; Fly.io encrypts them at rest
```

### Transport Security
- All Fly.io inter-machine traffic: WireGuard (6PN) — encrypted by default
- All public endpoints: TLS 1.3 (Fly.io managed certs via Let's Encrypt)
- Supabase: TLS required on all connections
- WebSocket/SSE: WSS/HTTPS only (no downgrade)

---

## Polar.sh

### Fees
- Base transaction: 4% + 40¢
- Subscriptions: +0.5%
- International cards: +1.5%
- Payout: $2 Stripe monthly + 0.25% + $0.25 per payout
- Net creator take-home: ~95.6–96.5%
- Disputes: $15 per chargeback (non-refundable)

### LLM Usage Billing Integration
```typescript
import { Ingestion } from "@polar-sh/ingestion";
import { LLMStrategy } from "@polar-sh/ingestion/strategies/LLM";

const llmIngestion = Ingestion({ accessToken: process.env.POLAR_ACCESS_TOKEN })
  .strategy(new LLMStrategy(openai("gpt-4o")))
  .ingest("openai-usage");

// Wrap model — auto-tracks tokens per customer
const model = llmIngestion.client({ customerId: userId });
```

### Next.js Webhook Handler
```typescript
import { Webhooks } from "@polar-sh/nextjs";
export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onSubscriptionCreated: async (payload) => {
    await supabase.from("purchases").upsert({ ... });
  },
  onSubscriptionCanceled: async (payload) => {
    await supabase.from("purchases").update({ status: "canceled" });
    // Trigger machine stop via Trigger.dev
  },
  onOrderPaid: async (payload) => {
    // Provision agent machine
    await tasks.trigger("deploy-agent-machine", { ... });
  },
});
```

---

## OpenClaw Docker Details (for containerized deployment)

### Image
- Official: `ghcr.io/openclaw/openclaw:latest`
- Also mirrored: `alpine/openclaw`, `coollabsio/openclaw`

### Ports
- 18789: Gateway (main web UI + API)
- 18790: Bridge port
- Nginx on :8080 proxies to :18789

### Key Env Vars
- `OPENCLAW_GATEWAY_TOKEN` — auth token for gateway access
- `ANTHROPIC_API_KEY` — provider key (or OPENAI_API_KEY, etc.)
- `OPENCLAW_GATEWAY_PORT` — default 18789
- `OPENCLAW_BRIDGE_PORT` — default 18790
- `OPENCLAW_STATE_DIR` — default /data (persistent state)
- `NODE_ENV` — set to production

### Volume Mount
- `/data` — persistent state directory (SOUL.md, MEMORY.md, conversation history, skill cache)
- `/data/.openclaw/` — config and state
- `/data/workspace/` — user project files

### fly.toml for OpenClaw on Fly.io
```toml
app = "agent-user123"
primary_region = "iad"

[build]
  image = "ghcr.io/openclaw/openclaw:latest"

[env]
  NODE_ENV = "production"
  OPENCLAW_STATE_DIR = "/data"

[[mounts]]
  source = "agent_data"
  destination = "/data"

[[services]]
  protocol = "tcp"
  internal_port = 18789
  auto_stop_machines = "suspend"
  auto_start_machines = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[metrics]
  port = 9091
  path = "/metrics"
```
