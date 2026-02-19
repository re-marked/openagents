# Infrastructure Research

Research into Fly.io Machines, Trigger.dev v3, Supabase, SSE streaming architecture, relay platform integrations, and container security.

---

## 1. Fly.io Machines

### 1.1 Architecture

Fly.io Machines are Firecracker microVMs with per-second billing. Each Machine is a full Linux VM with hardware-enforced isolation — stronger than any Docker namespace trick.

**Key APIs:**
- `POST /v1/apps/{app}/machines` — create machine
- `POST /v1/apps/{app}/machines/{id}/start` — start
- `POST /v1/apps/{app}/machines/{id}/stop` — stop
- `POST /v1/apps/{app}/machines/{id}/suspend` — CRIU snapshot suspend
- `DELETE /v1/apps/{app}/machines/{id}` — destroy

**Rate limits:** 1 req/sec per mutating action (burst 3), 5 req/sec for reads. Queue provisioning tasks to respect these.

### 1.2 Networking

**6PN (Private Networking):** Every Machine gets an IPv6 address on Fly's WireGuard mesh. Machines in the same org can reach each other at `{machine_id}.{app}.internal`.

**fly-replay:** HTTP header-based routing. Set `fly-replay: instance={machine_id}` to route a request to a specific Machine. ~10ms overhead. This is how the SSE Gateway routes chat requests to the correct agent Machine.

**Critical: Vercel cannot reach 6PN.** Vercel functions run outside Fly's WireGuard network. Solutions:
1. **SSE Gateway as Fly.io app** (recommended) — a Fly app that receives requests from Vercel and uses fly-replay to route to agent machines via 6PN
2. **Flycast** (internal load balancer with public anycast IP) — less control over per-machine routing
3. **Public machine URLs** — adds TLS overhead and requires auth on every request

### 1.3 Autostop/Autostart

```toml
[http_service]
  auto_stop_machines = "suspend"   # "stop" | "suspend" | "off"
  auto_start_machines = true
  min_machines_running = 0
```

| Mode | Resume Time | Billing When Idle | Storage Cost |
|---|---|---|---|
| `"stop"` | 1-3 seconds | None | $0.15/GB rootfs |
| `"suspend"` | ~200-500ms (CRIU) | None | $0.15/GB rootfs + snapshot |
| `"off"` | N/A (always running) | Full compute rate | N/A |

**Recommendation:** `"suspend"` universally for agent machines. Sub-500ms resume gives near-instant UX at negligible cost.

### 1.4 Per-User Dev Environments Blueprint

Fly.io publishes a formal blueprint for exactly the OpenAgents use case: one Machine per user with isolated volumes and subdomain routing.

Pattern:
1. Create Fly App per agent type (or shared app with many machines)
2. Create Machine with volume for each user
3. Route via fly-replay: subdomain or header → specific machine ID
4. Suspend on idle, resume on request
5. Destroy on account deletion

### 1.5 Pricing (Current 2026)

| Resource | Cost |
|---|---|
| shared-cpu-1x, 512MB | $0.0044/hr ($3.19/month continuous) |
| shared-cpu-2x, 2GB | $0.0158/hr ($11.40/month continuous) |
| performance-1x, 2GB | $0.0313/hr ($22.50/month continuous) |
| Volumes | $0.15/GB/month |
| Outbound bandwidth | $0.02/GB (N. America, Europe) |
| Dedicated IPv4 | $2/month per address |
| Reservations | 40% discount for pre-paid per-region blocks |

**GPU Machines deprecated July 31, 2026.** Do not build GPU-dependent features on Fly.io.

---

## 2. Trigger.dev v3

### 2.1 Architecture

Trigger.dev v3 is fundamentally different from v2:
- Tasks compile via esbuild → Docker image → Trigger.dev's elastic runtime
- **No timeouts** — tasks can run for hours or days
- **CRIU checkpoint-resume** — tasks can `await` without consuming compute
- **Task isolation** — each execution runs in its own isolated process
- **OpenTelemetry** — every task is traced; spans visible in dashboard

### 2.2 Pricing

| Plan | Monthly | Credits | Prod Concurrency |
|---|---|---|---|
| Free | $0 | $5 | 20 |
| Hobby | $10 | $10 | 50 |
| Pro | $50 | $50 | 200+ |

Compute rates (per second):
- micro (0.25vCPU/0.25GB): $0.0000169
- small (0.5vCPU/0.5GB): $0.0000338
- medium (1vCPU/1GB): $0.0000675
- large (4vCPU/8GB): $0.000340

Per-run invocation: $0.000025 ($0.25 per 10,000 runs)

### 2.3 OpenAgents Task Catalog

```typescript
// 1. Agent machine provisioning
export const provisionAgentMachine = task({
  id: "provision-agent-machine",
  retry: { maxAttempts: 3, factor: 2, minTimeoutInMs: 5000 },
  run: async (payload: { userId, agentId, agentDockerImage, region }) => {
    const app = await upsertFlyApp(`agent-${agentId}-${userId.slice(0,8)}`);
    const volume = await createFlyVolume(app.name, region, 1);
    const machine = await createFlyMachine(app.name, { image, volumeId, env });
    await waitForMachineState(app.name, machine.id, "started", 60);
    await supabase.from("agent_instances").upsert({ ... });
    return { machineId: machine.id, appName: app.name };
  },
});

// 2. Health checks (every 5 minutes)
export const healthCheckAllMachines = schedules.task({
  id: "health-check-machines",
  cron: "*/5 * * * *",
  run: async () => { /* batch health checks, restart failed */ },
});

// 3. Idle machine shutdown (hourly)
export const shutdownIdleMachines = schedules.task({
  id: "shutdown-idle-machines",
  cron: "0 * * * *",
  run: async () => { /* stop machines inactive >2 hours */ },
});

// 4. Billing aggregation (hourly)
export const aggregateUsageBilling = schedules.task({
  id: "aggregate-usage-billing",
  cron: "0 * * * *",
  run: async () => { /* aggregate usage events, update billing */ },
});

// 5. Relay message processing
export const processRelayMessage = task({
  id: "process-relay-message",
  run: async (payload: { platform, userId, message }) => {
    const instance = await lookupInstance(userId);
    if (instance.status === "suspended") await startMachine(instance);
    const response = await forwardToMachine(instance, message);
    await sendPlatformResponse(platform, userId, response);
  },
});
```

### 2.4 Concurrency Control

```typescript
// Prevent one user from monopolizing the queue
await tasks.trigger("process-message", payload, {
  queue: { name: `user-${userId}`, concurrencyLimit: 2 },
  concurrencyKey: userId,
});
```

### 2.5 Supabase → Trigger.dev Integration

```typescript
// Supabase Edge Function triggered by DB webhook
Deno.serve(async (req) => {
  const { record } = await req.json();
  if (record.status !== "active") return new Response("skip");
  await tasks.trigger("provision-agent-machine", {
    userId: record.buyer_id,
    agentId: record.agent_id,
  });
  return new Response("triggered");
});
```

---

## 3. Supabase

### 3.1 Auth: Multiple OAuth Providers

```typescript
// Google OAuth (users)
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${origin}/auth/callback`, scopes: "openid email profile" },
});

// GitHub OAuth (creators)
await supabase.auth.signInWithOAuth({
  provider: "github",
  options: { redirectTo: `${origin}/auth/callback`, scopes: "read:user user:email" },
});
```

**Custom JWT claims** for role-based access via database hooks:

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE claims jsonb; user_role text;
BEGIN
  claims := event -> 'claims';
  SELECT up.role INTO user_role FROM public.user_profiles up
  WHERE up.id = (event ->> 'user_id')::uuid;
  claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(user_role, 'user')));
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;
```

### 3.2 Row Level Security Patterns

```sql
-- agents: public read (published), creator write
CREATE POLICY "agents_public_read" ON agents FOR SELECT USING (status = 'published');
CREATE POLICY "agents_creator_crud" ON agents FOR ALL
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

-- purchases: users see their own
CREATE POLICY "purchases_own_read" ON purchases FOR SELECT USING (buyer_id = auth.uid());

-- agent_instances: users control their own machines
CREATE POLICY "instances_own" ON agent_instances FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- messages: users see their own sessions only
CREATE POLICY "messages_own" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM sessions s WHERE s.id = messages.session_id AND s.user_id = auth.uid())
);

-- Performance: index all RLS filter columns
CREATE INDEX idx_agents_creator ON agents(creator_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_purchases_buyer ON purchases(buyer_id);
CREATE INDEX idx_instances_user ON agent_instances(user_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_messages_session ON messages(session_id);
```

### 3.3 Realtime for Chat

**Use Broadcast (not Postgres Changes) for streaming chat.**

Postgres Changes is single-threaded and doesn't scale beyond ~100 concurrent subscribers. Broadcast is peer-to-peer and scales with Supabase's infrastructure.

```typescript
// Server-side: broadcast token chunks as they arrive
const channel = supabase.channel(`session:${sessionId}`);
for await (const chunk of agentStream) {
  await channel.send({
    type: "broadcast", event: "token",
    payload: { text: chunk.text, done: false },
  });
}
// Persist to DB AFTER streaming completes
await supabase.from("messages").insert({ session_id: sessionId, role: "assistant", content: fullResponse });
```

```typescript
// Client-side
const channel = supabase
  .channel(`session:${sessionId}`)
  .on("broadcast", { event: "token" }, ({ payload }) => {
    if (payload.done) setIsStreaming(false);
    else setResponse(prev => prev + payload.text);
  })
  .subscribe();
```

**Realtime limits:**

| Plan | Concurrent Conns | Msg/sec | Broadcast Payload |
|---|---|---|---|
| Free | 200 | 100 | 256KB |
| Pro | 500 | 500 | 3MB |
| Pro (no cap) | 10,000 | 2,500 | 3MB |

### 3.4 Edge Functions

- CPU time: 150ms per invocation (I/O doesn't count)
- Memory: 150MB
- Cannot do long-running work — offload to Trigger.dev
- Global distribution: ~35 Deno Deploy edge locations
- Perfect for: webhook ingestion (ack + enqueue)

### 3.5 Vault (Encrypted Secret Storage)

```sql
-- Store SSH credentials
SELECT vault.create_secret(
  'ssh-private-key-content',
  'ssh_key_' || auth.uid()::text,
  'User SSH private key'
);

-- Retrieve (RLS-protected)
SELECT decrypted_secret FROM vault.decrypted_secrets
WHERE name = 'ssh_key_' || auth.uid()::text;
```

---

## 4. SSE Streaming Architecture

### 4.1 The Buffering Problem

Next.js route handlers buffer the entire response if you write chunks in an async loop and return Response at the end. This destroys streaming UX.

**Fix: Return ReadableStream immediately.**

```typescript
// apps/marketplace/app/api/chat/stream/route.ts
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const { sessionId, message } = await req.json();
  const userId = await getUserIdFromRequest(req);
  const instance = await getAgentInstance(userId);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      req.signal.addEventListener("abort", () => controller.close());
      try {
        const agentResponse = await fetch(
          `http://${instance.fly_machine_id}.${instance.fly_app_name}.internal:18789/api/stream`,
          { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, sessionId }), signal: req.signal }
        );
        const reader = agentResponse.body!.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
          broadcastChunk(sessionId, new TextDecoder().decode(value)).catch(() => {});
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        controller.enqueue(encoder.encode(`data: {"error":"${err.message}"}\n\n`));
      } finally { controller.close(); }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",  // CRITICAL: disables nginx/Vercel edge buffering
    },
  });
}
```

### 4.2 Three-Hop Architecture

```
Browser → Vercel (auth check, ReadableStream) → Fly.io SSE Gateway (fly-replay) → Agent Machine
```

The SSE Gateway is a dedicated Fly.io app because Vercel can't reach 6PN. The gateway receives authenticated requests from Vercel and uses fly-replay to route to specific agent machines.

### 4.3 Vercel Duration Limits

| Plan | Fluid Compute | Standard |
|---|---|---|
| Hobby | 300s (5 min) | 60s |
| Pro | 800s (~13 min) | 300s (5 min) |
| Enterprise | 800s | 900s (15 min) |

**Use Node.js runtime** (not Edge runtime) for SSE proxy — Edge has 30s max and no `fetch` to internal Fly addresses.

### 4.4 Client-Side Hook

```typescript
export function useChatStream(sessionId: string) {
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (message: string) => {
    setIsStreaming(true);
    setResponse("");
    const res = await fetch("/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message }),
    });
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      for (const line of text.split("\n")) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") { setIsStreaming(false); return; }
          try { setResponse(prev => prev + JSON.parse(data).token); } catch {}
        }
      }
    }
    setIsStreaming(false);
  };

  return { response, isStreaming, sendMessage };
}
```

---

## 5. Relay Platform Integration

### 5.1 Platform Comparison

| Platform | Delivery Model | Response Window | Streaming | Auth |
|---|---|---|---|---|
| Telegram | Webhook (HTTPS POST) | Unlimited | No (full response) | Bot token |
| WhatsApp | Webhook (Cloud API) | 24-hour window | No | WABA + System User Token |
| Slack | Events API (HTTP) | 3-second ack required | No (update message) | OAuth 2.0 |
| Discord (HTTP) | Interactions Endpoint | 3-second ack + 15 min | No (followup messages) | Application ID |
| Discord (WS) | Gateway WebSocket | Unlimited | No | Bot token |

### 5.2 Webhook Routing Architecture

```
[Telegram/WhatsApp/Slack/Discord]
        ↓ HTTPS POST
[Ingestion: Supabase Edge Function]
        ↓ immediate 200 OK + enqueue
[Queue: Upstash QStash or Supabase Queue]
        ↓ async dequeue (with retry, DLQ)
[Router: Trigger.dev Task]
        ↓ look up user → instance → machine_id
[Fly.io Machine 6PN: POST http://{machine_id}.{app}.internal:18789/api/chat]
        ↓ response
[Platform API: sendMessage back to user]
```

**Design principles:**
- Ingest layer does nothing except ack and enqueue (must respond within 3-60s)
- Queue provides retry, dead-letter queue, and per-tenant isolation
- Routing done by Trigger.dev task (no timeout concerns)
- Machine addresses are stable; look up from DB, cache in Redis

### 5.3 Platform-Specific Gotchas

**Telegram:**
- Simplest integration — webhook + Bot API
- No streaming (send full response)
- Split long responses at 4096 char limit
- Send `chatAction("typing")` while processing

**WhatsApp:**
- **Silent webhook failure gotcha**: Missing WABA-to-App subscription causes all webhooks to fail silently. Fix: `POST /{WABA_ID}/subscribed_apps` during setup
- 24-hour messaging window — after that, need pre-approved message templates (1-7 day Meta approval)
- On-Premises API deprecated October 2025 — use Cloud API only

**Slack:**
- 3-second ack requirement — must respond within 3 seconds
- Pattern: immediate ack → async processing → update original message
- Events API (HTTP) preferred over Socket Mode for production

**Discord (two architectures):**
- **HTTP Interactions Endpoint**: Works on Vercel, 3-second ack + followup messages, slash commands only
- **Gateway WebSocket**: Full bot capabilities, requires persistent process on dedicated Fly Machine (`autostop: "off"`, ~$1.94/month)
- For rich bot features, use Gateway WebSocket on Fly.io

---

## 6. Container Security

### 6.1 Firecracker Isolation

Each Fly.io Machine is a Firecracker microVM:
- Hardware-enforced isolation (not just Linux namespaces)
- Separate kernel per VM
- No shared filesystem between VMs
- Stronger isolation than Docker, comparable to traditional VMs

### 6.2 OpenClaw Sandbox Hardening

For marketplace deployment, force these defaults:

```json5
{
  agents: { defaults: { sandbox: {
    mode: "all",               // sandbox everything including main
    scope: "session",          // per-session isolation
    workspaceAccess: "ro",     // read-only workspace
    docker: {
      network: "none",         // no network from sandbox
      readOnlyRoot: true,
      capDrop: ["ALL"],
      user: "1000:1000",
      pidsLimit: 256,
      memory: "1g",
      cpus: 1
    }
  }}},
  tools: { deny: ["gateway", "cron", "group:automation"] },
  gateway: { bind: "lan", auth: { mode: "token" } }
}
```

### 6.3 Skill Signing Pipeline

Build before opening to external creators:

1. **Submission**: Creator submits SKILL.md + GitHub repo
2. **Static analysis**: Semgrep rules for injection patterns, suspicious tool declarations
3. **Dependency scan**: Snyk on npm/pip dependencies
4. **Sandboxed build**: Docker image built in network-restricted environment, Trivy CVE scan
5. **Behavioral analysis** (high-risk): Run skill with canary inputs, monitor network/file/process activity
6. **Manual review**: Auto-flag failures, human reviews flagged items
7. **Ed25519 signing**: Approved skills signed with platform key, signature covers content hash + permissions
8. **Runtime enforcement**: OpenClaw container verifies signature before loading

### 6.4 Prompt Injection Defense (7 Layers)

1. **Structural separation**: System prompt and user content in separate messages
2. **Input sanitization**: Strip control characters, limit injection vectors
3. **Permission minimization**: Each skill declares required tool permissions; runtime enforces
4. **Output schema validation**: Verify tool call results match expected JSON schema
5. **Model built-in defenses**: Use latest Claude models with improved injection resistance
6. **Canary token injection**: Traceable strings in context; alert if they appear in tool calls
7. **Audit logging**: Log all tool invocations, content, and outcomes

---

## 7. Key Findings

- **Fly.io Machines API is the correct primitive** for per-user agent isolation. Firecracker microVMs with fly-replay routing (~10ms overhead).
- **`autostop: "suspend"`** is the right mode universally. ~200-500ms resume, no CPU billing when idle.
- **SSE buffering in Next.js is real** — return ReadableStream immediately + `X-Accel-Buffering: no` + Node.js runtime.
- **Vercel cannot reach Fly.io 6PN** — SSE Gateway must be a Fly.io app.
- **Discord requires persistent WebSocket** — dedicated Fly Machine with `autostop: "off"` (~$1.94/month).
- **WhatsApp has silent webhook failure** — missing WABA-to-App subscription.
- **ClawHub has zero code signing** — 13.4% critical issue rate. Build signing pipeline before launch.
- **Supabase Realtime at scale**: Use Broadcast, not Postgres Changes (single-threaded bottleneck).
- **Trigger.dev v3 CRIU checkpointing** — zero compute for waiting tasks. Cost-effective for polling/provisioning.
- **Fly.io API rate limits**: 1 req/sec mutating, 5 req/sec reads. Queue provisioning in Trigger.dev.

---

## 8. Open Questions

1. **Can Flycast provide SSE proxy without a dedicated gateway?** Flycast has a public anycast IP but less control over per-machine routing.
2. **Does OpenClaw's `/v1/chat/completions` emit proper SSE?** If it returns a single JSON blob, the streaming proxy needs to collect and re-stream.
3. **Trigger.dev self-hosting on Fly.io**: Does CRIU work inside Firecracker VMs? Requires specific kernel capabilities.
4. **Polar.sh Ingestion API stability**: The `@polar-sh/ingestion` package is new. Verify 1.0 stability before depending on it for revenue-critical metering.

---

## Sources

- [Fly.io Machines API Reference](https://fly.io/docs/machines/api/machines-resource/)
- [Fly.io Per-User Dev Environments Blueprint](https://fly.io/docs/blueprints/per-user-dev-environments/)
- [Fly.io Dynamic Request Routing (fly-replay)](https://fly.io/docs/networking/dynamic-request-routing/)
- [Fly.io Autostop/Autostart](https://fly.io/docs/launch/autostop-autostart/)
- [Fly.io Private Networking (6PN)](https://fly.io/docs/networking/private-networking/)
- [Fly.io Resource Pricing](https://fly.io/docs/about/pricing/)
- [Trigger.dev v3 Architecture](https://trigger.dev/blog/v3-announcement)
- [Trigger.dev How It Works](https://trigger.dev/docs/how-it-works)
- [Supabase Realtime Architecture](https://supabase.com/docs/guides/realtime/architecture)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions/architecture)
- [Telegram Bot API Webhook Guide](https://core.telegram.org/bots/webhooks)
- [WhatsApp Business Cloud API](https://business.whatsapp.com/blog/how-to-use-webhooks-from-whatsapp-business-api/)
- [Slack Events API](https://docs.slack.dev/apis/events-api/comparing-http-socket-mode/)
- [Discord Gateway Documentation](https://discord.com/developers/docs/events/gateway)
- [Snyk ToxicSkills Study](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
- [Fixing SSE Streaming in Next.js (2026)](https://medium.com/@oyetoketoby80/fixing-slow-sse-server-sent-events-streaming-in-next-js-and-vercel-99f42fbdb996)
- [Northflank: AI Agent Sandboxing 2026](https://northflank.com/blog/how-to-sandbox-ai-agents)
