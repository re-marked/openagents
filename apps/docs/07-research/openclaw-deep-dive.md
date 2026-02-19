# OpenClaw Deep Dive

Research into OpenClaw's source code, architecture, configuration, and integration points relevant to the OpenAgents marketplace.

---

## 1. Architecture Overview

OpenClaw is a **local-first AI agent gateway** — a Node.js 22+ process that manages agent sessions, tool execution, memory, and multi-provider LLM routing.

### Core Components

```
┌─────────────────────────────────────────┐
│              OpenClaw Gateway             │
│                                          │
│  ┌──────────┐  ┌────────────────────┐   │
│  │ Agent     │  │ Session Manager    │   │
│  │ Config    │  │  - Context window  │   │
│  │           │  │  - Compaction      │   │
│  └──────────┘  └────────────────────┘   │
│                                          │
│  ┌──────────┐  ┌────────────────────┐   │
│  │ Tool      │  │ Memory System      │   │
│  │ Executor  │  │  - SQLite + vec    │   │
│  │           │  │  - MMR re-ranking  │   │
│  └──────────┘  └────────────────────┘   │
│                                          │
│  ┌──────────┐  ┌────────────────────┐   │
│  │ LLM      │  │ Channel Manager    │   │
│  │ Router    │  │  - Telegram, Slack │   │
│  │           │  │  - Discord, etc.   │   │
│  └──────────┘  └────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Plugin System (in-process)        │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Key Runtime Facts

- **Process model**: Single Node.js process per Gateway instance
- **State directory**: `~/.openclaw/` by default, overridable with `OPENCLAW_STATE_DIR`
- **Per-agent storage**: `~/.openclaw/agents/<agentId>/`
- **Memory database**: SQLite + sqlite-vec per agent at `~/.openclaw/memory/<agentId>.sqlite`
- **Config format**: JSON5 (`openclaw.json`), Zod-validated, hot-reloadable
- **Config schema**: Split across 7 Zod schema files
- **System prompt assembly**: Up to 9 files in order, with `bootstrapMaxChars` (20,000 default) truncation

---

## 2. Workspace Files

The system prompt is assembled from these files in priority order:

| File | Purpose | Loaded In |
|---|---|---|
| `SOUL.md` | Personality, identity, tone | Private sessions only |
| `IDENTITY.md` | Public identity | All sessions |
| `AGENTS.md` | Behavior rules, tool policies | All sessions |
| `TOOLS.md` | Tool-specific instructions | All sessions |
| `USER.md` | Per-user preferences | Private sessions |
| `MEMORY.md` | Persistent facts | Private sessions only |
| `CONTEXT.md` | Session context | All sessions |
| `memory/YYYY-MM-DD.md` | Daily memory files | Private sessions |

**Critical for marketplace**: MEMORY.md is only loaded in private sessions (not group chats). Sub-agents only get AGENTS.md + TOOLS.md injected (no SOUL.md, IDENTITY.md, USER.md).

---

## 3. Configuration (`openclaw.json`)

### Full Config Structure

```json5
{
  model: {
    primary: "anthropic/claude-opus-4-6",
    fallbacks: ["anthropic/claude-sonnet-4-6"]
  },
  agents: {
    list: [
      {
        id: "main",
        default: true,
        workspace: "./workspace",
        tools: { profile: "coding", allow: ["exec"], deny: ["browser"] }
      }
    ],
    defaults: {
      sandbox: {
        mode: "non-main",        // "off" | "non-main" | "all"
        scope: "agent",          // "session" | "agent" | "shared"
        workspaceAccess: "none", // "none" | "ro" | "rw"
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          network: "none",
          readOnlyRoot: true,
          capDrop: ["ALL"],
          pidsLimit: 256,
          memory: "1g",
          cpus: 1
        }
      },
      models: {
        "anthropic/claude-opus-4-6": {
          alias: "opus",
          params: { temperature: 0.7, maxTokens: 8192 }
        }
      }
    }
  },
  skills: {
    allowBundled: ["github", "slack"],
    entries: {
      github: { enabled: true, env: { GITHUB_TOKEN: "${GITHUB_TOKEN}" } }
    }
  },
  channels: {
    telegram: { token: "${TELEGRAM_TOKEN}", allowlist: ["@myhandle"] }
  },
  gateway: {
    bind: "loopback",     // "loopback" | "lan" | "0.0.0.0"
    auth: { mode: "token", token: "..." },
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
        responses: { enabled: true }
      }
    }
  },
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    mappings: [...]
  }
}
```

### Hot-Reload Behavior

- **Application-layer settings** (agents, skills, tools, channels): hot-reloadable, no restart needed
- **Infrastructure settings** (port, bind, TLS): require Gateway restart
- **`$include` directives**: allow splitting large configs into multiple files

### Startup Flags

- `--allow-unconfigured`: allows startup before config exists (critical for marketplace provisioning)
- `--bind lan`: required on Fly.io (without it, binds to loopback and Fly's proxy can't reach it)
- `--port 3000`: set listening port

---

## 4. Skills System

### What Is a Skill?

A skill is a directory containing a `SKILL.md` file with YAML frontmatter. That's it.

```
my-skill/
├── SKILL.md          # Required: YAML frontmatter + markdown body
├── scripts/          # Optional: referenced by skill
├── config/           # Optional: skill configuration
└── README.md         # Optional: human docs
```

### SKILL.md Format

```markdown
---
name: web-search
description: Search the web and return relevant results
version: 1.0.0
tools:
  - name: search
    description: Search the web
    parameters:
      query:
        type: string
        description: The search query
---

# Web Search Skill

Instructions for the agent on how to use the web search tool...
```

**Required fields**: `name`, `description`
**The `description` field directly controls LLM triggering** — it's what the model reads to decide when to invoke the skill.

### Skill Loading

- Skills in `{workspace}/skills/` take priority over all other sources
- Gateway's file watcher picks up new SKILL.md files within ~1.5 seconds (debounce)
- Changes only affect the NEXT agent turn (not mid-conversation)
- ClawHub-installed skills land in `{workspace}/skills/{skill-name}/`

### ClawHub CLI

```bash
clawhub search "calendar integration"   # vector-powered semantic search
clawhub install github                  # installs into {workspace}/skills/
clawhub update --all                    # update all installed skills
clawhub publish ./my-skill              # creates new version
clawhub login                           # browser or token auth
```

- Lock file: `.clawhub/lock.json`
- Environment: `CLAWHUB_REGISTRY` overrides the endpoint (enables private registries)
- Publishing requires: GitHub account >= 1 week old

---

## 5. LLM Provider Support

### 14 Built-In Providers

| Provider | Env Var | Notable Models |
|---|---|---|
| Anthropic | `ANTHROPIC_API_KEY` | claude-opus-4-6, claude-sonnet-4-6 |
| OpenAI | `OPENAI_API_KEY` | gpt-4o, o3-mini |
| Google Gemini | `GOOGLE_GENERATIVE_AI_API_KEY` | gemini-2.0-flash |
| OpenRouter | `OPENROUTER_API_KEY` | Any via openrouter/* prefix |
| xAI | `XAI_API_KEY` | grok-3 |
| Groq | `GROQ_API_KEY` | llama-3.3-70b |
| Cerebras | `CEREBRAS_API_KEY` | - |
| Mistral | `MISTRAL_API_KEY` | - |
| GitHub Copilot | OAuth | - |
| Vercel AI Gateway | `AI_GATEWAY_API_KEY` | Any proxied model |
| Ollama | none | Any local model at 127.0.0.1:11434 |
| HuggingFace | `HF_API_KEY` | - |
| Z.AI (GLM) | `ZAI_API_KEY` | GLM-4 |
| OpenCode Zen | OAuth | - |

**Model reference format**: `provider/model-id` (e.g., `anthropic/claude-opus-4-6`)

**Multi-key rotation**: `ANTHROPIC_API_KEYS=key1,key2,key3` — round-robins on 429 errors

**Custom providers**: Any OpenAI or Anthropic-compatible endpoint via config

**Failover behavior**: Only triggers on rate limit (429) or quota exhaustion. Auth failures and model errors do NOT trigger failover.

---

## 6. API Endpoints (Integration Points)

### HTTP Chat Completions (Primary for Marketplace)

```typescript
const response = await fetch('http://localhost:18789/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-gateway-token',
    'x-openclaw-agent-id': 'main',
    'x-openclaw-session-key': 'user:alice:session-1'
  },
  body: JSON.stringify({
    model: 'openclaw',
    messages: [{ role: 'user', content: 'Hello' }],
    stream: true
  })
});
// Returns SSE: "data: {...}\n\n" chunks, ending with "data: [DONE]"
```

**Session persistence**: The `user` field creates stable session keys. Same value → same session.

### OpenResponses API

`POST /v1/responses` — richer event streams with tool use events and structured output. Item-based input format.

### Webhook Ingress

```json5
{
  hooks: {
    mappings: [{
      match: { path: "/hooks/github" },
      action: "agent-run",
      agentId: "main",
      sessionKey: "webhook:github:{{event.repository.name}}",
      messageTemplate: "New PR: {{event.pull_request.title}}",
      wakeMode: "now"
    }]
  }
}
```

### WebSocket RPC (Full Protocol)

Full programmatic control: `sessions.list`, `sessions.send`, `sessions.spawn`, `config.get`, `config.patch`, `gateway.health`, `channels.status`.

### Plugin SDK (Custom Channels)

```typescript
export default {
  slot: "channel",
  id: "openagents",
  schema: Type.Object({ apiKey: Type.String(), webhookUrl: Type.String() }),
  init: async (config, { logger, rpc }) => ({
    start: async () => { /* connect */ },
    stop: async () => { /* cleanup */ },
    send: async (envelope) => { /* deliver response */ },
    onReceive: (callback) => { /* register message handler */ }
  })
} satisfies PluginDefinition;
```

**Warning**: Plugins run in-process with full trust. Never allow users to install arbitrary plugins.

---

## 7. Sub-Agent System

- `sessions_spawn` is non-blocking — returns `{status: "accepted", runId, childSessionKey}` immediately
- Sub-agents run in isolated sessions with only AGENTS.md + TOOLS.md injected
- Default max depth: 1 (configurable up to 5)
- Useful for parallel task execution, background processing

---

## 8. Self-Improvement Capabilities

**What agents CAN do at runtime:**
- Write to `MEMORY.md` and `memory/YYYY-MM-DD.md` (using write/edit tools)
- Modify `SOUL.md`, `AGENTS.md`, `USER.md` (if workspace `rw` access)
- Create new skill files at `{workspace}/skills/{name}/SKILL.md` — auto-detected in ~1.5s
- Modify `openclaw.json` via the `gateway` tool (`config.apply`, `config.patch`)
- Install ClawHub skills via `clawhub install` (if exec tool available)

**What they CANNOT do:**
- Modify their own weights
- Modify the agent core runtime (pi-mono package)
- Install npm packages without exec access
- Persist changes across sandboxed sessions when `workspaceAccess: "none"`

**Pre-compaction memory flush**: Before context is cleared, the system prompts the agent to write durable facts to MEMORY.md. This is the primary mechanism for persistent knowledge accumulation.

**Community patterns**: "self-improving-agent" skill logs LEARNINGS.md, ERRORS.md, FEATURE_REQUESTS.md. "capability-evolver" skill inspects session history and writes new SKILL.md files autonomously.

---

## 9. Docker & Container Support

### Two Distinct Docker Setups

1. **Gateway container** — runs the full Gateway
   - Built as `openclaw:local` from included Dockerfile
   - Non-root `node` user (uid 1000)
   - Volumes: `~/.openclaw/` (config), `~/.openclaw/workspace` (workspace)

2. **Sandbox containers** — isolated tool execution
   - `openclaw-sandbox:bookworm-slim` (default, Debian slim)
   - `openclaw-sandbox-common:bookworm-slim` (with build tools)
   - `openclaw-sandbox-browser:bookworm-slim` (Chromium + CDP + noVNC)

### Sandbox Configuration

```json5
{
  sandbox: {
    mode: "all",              // sandbox everything
    scope: "session",         // per-session isolation
    workspaceAccess: "ro",    // read-only workspace
    docker: {
      network: "none",        // fully isolated
      readOnlyRoot: true,
      capDrop: ["ALL"],
      user: "1000:1000",
      pidsLimit: 256,
      memory: "1g",
      cpus: 1,
      tmpfs: ["/tmp", "/var/tmp", "/run"]
    }
  }
}
```

**Scope behavior:**
- `session`: One container per session — maximum isolation (recommended for marketplace)
- `agent`: One container per agent — shared between sessions
- `shared`: Single global container — cheapest, least isolated

### Fly.io Deployment

```toml
app = "my-openclaw"
primary_region = "iad"

[env]
  NODE_ENV = "production"
  OPENCLAW_STATE_DIR = "/data"
  NODE_OPTIONS = "--max-old-space-size=1536"

[processes]
  app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

[[vm]]
  size = "shared-cpu-2x"
  memory = "2048mb"    # 512MB causes SIGABRT

[mounts]
  source = "openclaw_data"
  destination = "/data"
```

**Critical deployment notes:**
- `--bind lan` is required — without it, Fly's proxy can't reach the gateway
- `OPENCLAW_STATE_DIR=/data` persists all state to the volume
- 2GB RAM is the practical minimum (1GB causes silent restarts)
- `auto_stop_machines: false` needed for webhook delivery
- Stale lock files from crashes: `rm -f /data/gateway.*.lock`

### Machine Sizing

| Use Case | Size | RAM | Notes |
|---|---|---|---|
| Minimal (no sandbox) | shared-cpu-1x | 512MB | Demo/test only |
| Recommended (sandbox) | shared-cpu-2x | 2GB | Standard marketplace agent |
| Power user (browser) | performance-2x | 4GB | Browser automation skills |

---

## 10. Security Model

### Authentication Layers

**Gateway auth modes:**
- `token` (default): Bearer token for all connections
- `password`: env var-based
- `trusted-proxy`: identity-aware reverse proxy
- Tailscale: accepts Tailscale Serve identity headers

**Inbound identity (channels):**
- `pairing` (default): unknown senders get approval code (1-hour expiry)
- `allowlist`: explicit user list
- `open`: accepts all (requires `"*"` opt-in)
- `disabled`: ignore all

**Rate limiting**: 10 attempts / 60s → 5-minute lockout (loopback exempt)

### Known Vulnerabilities

**CVE-2026-25253** (CVSS 8.8, HIGH):
- Cross-Site WebSocket Hijacking (CSWSH)
- The Control UI accepted `?gatewayUrl=` query parameter and opened WS connection, leaking auth token
- WS server didn't validate Origin header — any website could connect to `ws://localhost:18789`
- Impact: arbitrary tool calls (shell, config) from any website via victim's browser
- Fixed: `v2026.1.29` — removed parameter, added Origin validation
- **Action**: Rotate all auth tokens after patching

**Supply chain (ClawHub):**
- No cryptographic skill signing
- ClawHavoc incident (Jan 2026): 341 malicious skills deploying AMOS macOS stealer
- Only 1-week-old GitHub account required to publish
- Snyk MCP-Scan is the recommended scanning tool

### Marketplace Hardened Config

```json5
{
  gateway: {
    bind: "loopback",
    auth: { mode: "token", token: "long-random-string" }
  },
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        scope: "session",
        workspaceAccess: "ro",
        docker: { network: "none" }
      }
    }
  },
  tools: {
    deny: ["gateway", "cron", "group:automation"]
  },
  channels: {
    defaults: { dmPolicy: "disabled" }
  }
}
```

### Security Audit CLI

```bash
openclaw security audit        # static config analysis
openclaw security audit --deep # + live gateway probe
```

---

## 11. Marketplace Integration Recommendations

1. **One Fly Machine per user account** — each gets its own volume, Gateway, credentials
2. **Use HTTP Chat Completions API** (`/v1/chat/completions`) as backend↔OpenClaw interface
3. **Never expose machine IP or gateway token to the browser** — proxy everything through Next.js
4. **Force secure defaults**: `sandbox.mode: "all"`, `scope: "session"`, `workspaceAccess: "ro"`
5. **Deny self-modification tools**: `["gateway", "cron", "group:automation"]`
6. **Build skill approval workflow** before opening ClawHub integration
7. **Consider custom channel plugin** for bidirectional streaming control

---

## Sources

- [GitHub - openclaw/openclaw](https://github.com/openclaw/openclaw)
- [OpenClaw Configuration Reference](https://docs.openclaw.ai/gateway/configuration-reference)
- [OpenClaw Skills Documentation](https://docs.openclaw.ai/tools/skills)
- [OpenAI Chat Completions API - OpenClaw](https://docs.openclaw.ai/gateway/openai-http-api)
- [ClawHub - OpenClaw](https://docs.openclaw.ai/tools/clawhub)
- [GitHub - openclaw/clawhub](https://github.com/openclaw/clawhub)
- [Gateway Protocol - OpenClaw](https://docs.openclaw.ai/gateway/protocol)
- [Docker - OpenClaw](https://docs.openclaw.ai/install/docker)
- [Fly.io - OpenClaw](https://docs.openclaw.ai/platforms/fly)
- [Model Providers - OpenClaw](https://docs.openclaw.ai/concepts/model-providers)
- [Security - OpenClaw](https://docs.openclaw.ai/gateway/security)
- [Memory - OpenClaw](https://docs.openclaw.ai/concepts/memory)
- [Plugins - OpenClaw](https://docs.openclaw.ai/tools/plugin)
- [CVE-2026-25253 - NVD](https://nvd.nist.gov/vuln/detail/CVE-2026-25253)
- [DeepWiki: openclaw/openclaw Architecture](https://deepwiki.com/openclaw/openclaw)
- [Snyk ToxicSkills Study](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
