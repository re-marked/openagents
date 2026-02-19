# Agent Lifecycle

## States

```
                    ┌──────────────┐
                    │ provisioning │ ← User hires Agent
                    └──────┬───────┘
                           │ Machine created + started
                           ▼
                    ┌──────────────┐
              ┌────►│   running    │◄──── User sends message (auto-start)
              │     └──────┬───────┘
              │            │ No activity for 5-30 min
              │            ▼
              │     ┌──────────────┐
              │     │  suspended   │ ← CRIU snapshot, ~500ms resume
              │     └──────┬───────┘
              │            │ No activity for 24 hours
              │            ▼
              │     ┌──────────────┐
              └─────│   stopped    │ ← Full stop, 1-3s restart
                    └──────┬───────┘
                           │ User explicitly destroys
                           ▼
                    ┌──────────────┐
                    │  destroyed   │ ← Machine + Volume deleted
                    └──────────────┘

Special state:
                    ┌──────────────┐
                    │    error     │ ← Machine crashed, provision failed
                    └──────────────┘
                    Health check → restart → running
```

---

## Provisioning Flow

**Trigger:** User clicks "Hire This Assistant" on the marketplace.

```
1. Frontend creates purchase record in Supabase
2. Supabase DB webhook fires → triggers Edge Function
3. Edge Function triggers Trigger.dev task: provision-agent-machine

4. Trigger.dev task:
   a. Creates Fly.io App: agent-{agentSlug}-{userId8chars}
      - Optional: custom 6PN network for isolation
   b. Creates 1GB Volume in target region (iad default)
   c. Creates Machine:
      - Image: agent's Docker image (base OpenClaw + creator config)
      - Size: shared-cpu-1x, 512MB (or as defined by Agent)
      - Env: OPENCLAW_STATE_DIR=/data, ANTHROPIC_API_KEY, GATEWAY_TOKEN
      - Mount: volume → /data
      - Services: port 18789, autostop=suspend, autostart=true
      - skip_launch: false (start immediately)
   d. Waits for machine state: "started" (up to 60s)
   e. Seeds initial config to /data (SOUL.md, agent.yaml, skills)
   f. Updates agent_instances record: status=running, fly_machine_id, etc.

5. Frontend polls agent_instances status
6. When status=running: redirects to chat interface

Total time: 5-15 seconds (mostly Docker image pull if not cached in region)
```

**Pre-warming optimization:** Maintain a pool of 10-20 suspended machines with the OpenClaw base image already pulled. On hire:
1. Claim a pre-warmed machine from the pool
2. Inject Agent-specific config via exec API
3. Resume from suspended state (~500ms)
4. Replenish pool asynchronously

With pre-warming, hire-to-first-message drops to **~2-3 seconds**.

---

## Suspend / Resume

**When:** Machine idle for 5-30 minutes (configurable per plan tier).

**What happens:**
- Fly.io takes a CRIU snapshot of the entire process state
- Machine transitions to "suspended" state
- CPU billing stops immediately
- Only storage is billed ($0.15/GB/month for rootfs + volume)
- In-memory state (conversation context, OpenClaw session) is preserved

**On next request:**
- Fly Proxy detects request for suspended machine
- Holds the request while machine resumes from CRIU snapshot
- Resume takes ~200-500ms
- Request is forwarded to the now-running machine
- From user's perspective: response appears within ~1 second

**Cost:** A suspended Agent with 1GB volume costs ~$0.225/month total. Negligible.

---

## Stop / Start

**When:** Machine idle for 24+ hours.

**What happens:**
- Machine fully stops (process killed)
- In-memory state is lost (but persistent state on volume is preserved)
- Only rootfs + volume storage billed

**On next request:**
- Machine boots from scratch (1-3 seconds)
- OpenClaw reinitializes, loads config from /data volume
- Conversation history restored from session JSONL files on volume
- From user's perspective: 3-5 second wait with "Waking up your assistant..." message

---

## Destroy

**When:** User explicitly removes an Agent from their workspace, or account deleted.

**What happens:**
1. Machine stopped if running
2. Machine deleted via Fly.io API
3. Volume snapshot taken (backup, retained 30 days)
4. Volume deleted
5. Fly.io App deleted (if no other machines)
6. agent_instances record: status=destroyed
7. Sessions and messages preserved in Supabase (user data)

---

## Health Checks

**Cron:** Every 5 minutes via Trigger.dev.

For each agent_instance with status=running:
1. GET /health on the Agent Machine (via 6PN)
2. If responds 200: update last_active_at
3. If timeout or error:
   a. Retry once after 30 seconds
   b. If still failing: restart Machine (stop + start)
   c. If restart fails: mark status=error, alert user
   d. After 3 consecutive failures: stop Machine, notify user

---

## Idle Shutdown

**Cron:** Every hour via Trigger.dev.

```sql
-- Find machines inactive for >2 hours (stopped tier)
SELECT * FROM agent_instances
WHERE status = 'running'
AND last_active_at < NOW() - INTERVAL '2 hours';
```

For each idle instance:
1. Stop Machine via Fly.io API
2. Update status: stopped
3. Note: autostop=suspend handles the first tier (5-30 min → suspended). This job handles the second tier (2+ hours → fully stopped).

---

## Agent Updates (Creator Pushes New Version)

When a creator pushes to their GitHub repo:
1. GitHub webhook fires → Platform endpoint
2. Platform validates new repo state (same checks as initial publish)
3. Security scan on changed files
4. If passes: new Docker image built
5. For each existing user instance of this Agent:
   a. Trigger.dev task: deploy-agent-update
   b. Stop machine
   c. Update machine config (new image)
   d. Start machine
   e. If user is in active session: delay update, queue for next idle period
6. Agent version record created in agent_versions table
