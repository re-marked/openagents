# OpenClaw Platform: Technical Deep-Dive Research

Research date: 2026-02-18 (updated with full architecture, skills, config, runtime details)

## Identity & History
- Original name: Clawdbot (renamed after Anthropic trademark complaint about similarity to "Claude")
- Second name: MoltBot (abandoned after crypto scammer attacks exploiting rebrand window)
- Current name: OpenClaw (openclaw.ai)
- Creator: Peter Steinberger (Austrian developer, solo project)
- Acqui-hire: Steinberger joined OpenAI Feb 15, 2026; project stays open source under foundation model
- GitHub: github.com/openclaw/openclaw — 204K+ GitHub stars, 3,670+ forks
- License: MIT
- Runtime: Node.js 22+, TypeScript (tsx executor)
- Package: `npm install -g openclaw@latest`
- Platforms: macOS, Linux, Windows (WSL2)

## Architecture: Hub-and-Spoke

### Gateway Control Plane
- WebSocket RPC server at ws://127.0.0.1:18789 (default, loopback-only)
- Single Node.js process (launchd/systemd daemon)
- TypeBox-validated JSON-RPC protocol (src/gateway/protocol.ts)
- Platform supervisors: launchd (macOS), systemd (Linux)
- Hot-reload config without restart for safe changes
- Canvas/A2UI separate server at port 18793
- Config validation: JSON5 parsing → Zod schema (src/config/zod-schema.ts) → cross-field refinements

### Agent Runtime (Pi Agent Core)
- Uses @mariozechner/pi-agent-core library (`runEmbeddedPiAgent`)
- streamSimple for streaming from model providers
- 14 built-in providers: OpenAI, Anthropic, Google Gemini, Google Vertex, OpenCode Zen, Z.AI (GLM),
  Vercel AI Gateway, OpenRouter, xAI, Groq, Cerebras, Mistral, GitHub Copilot, custom
- Local inference: Ollama (auto-detected at 127.0.0.1:11434/v1), vLLM, LM Studio, text-generation-webui
- Model string format: `provider/model` (e.g., `anthropic/claude-opus-4-6`, `openrouter/anthropic/claude-sonnet-4.5`)
- API types: `openai-completions` (most third-party), `anthropic-messages` (Anthropic-native)
- Default recommended model: Anthropic Pro/Max + Opus 4.6

### Message Flow (7 phases)
1. Channel adapter receives platform message (Baileys/WhatsApp, grammY/Telegram, discord.js)
2. Normalize to MessageEnvelope
3. Access control (pairing codes, allowlists, DM policy)
4. Session key resolved: `agent:{agentId}:{channel}:{scope}:{identifier}`
5. Context assembly: session history JSONL + SOUL.md + AGENTS.md + skills + memory search
6. Model invocation (streaming) → tool execution (Docker-sandboxed for non-main)
7. Response delivery + session persistence (JSONL append)

### Session Model
- Session keys: `agent:{agentId}:{channel}:{scope}:{identifier}`
- Scopes: main (full host), dm:telegram:123456 (per-peer), group:whatsapp:xxx@g.us (group)
- Storage: JSONL append-only transcripts + sessions.json index
- Session compaction: configurable `compaction.reserveTokensFloor` (default 20000)
- Memory flush before compaction: silent agentic turn writes to MEMORY.md

### Tool Policy Resolution (deny-wins cascade)
1. Global Profile (`tools.profile`): minimal | coding | messaging | full
2. Global allow/deny (`tools.allow`, `tools.deny`)
3. Provider policy (`tools.byProvider`)
4. Agent policy (`agents.list[].tools`)
5. Group/sender policy (per-channel)
6. Sandbox policy (`sandbox.tools`)

### Tool Inventory
**Core:**
- `read`, `write`, `edit`, `apply_patch` — filesystem operations
- `exec`, `bash`, `process` — shell/command execution
- Tool groups: `group:fs`, `group:runtime`, `group:sessions`, `group:memory`, `group:web`, `group:ui`, `group:automation`

**OpenClaw-specific:**
- `memory_search`, `memory_get` — semantic search over workspace
- `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn` — session control
- `browser`, `canvas` — web automation (CDP/Chromium) + A2UI
- `cron`, `gateway` — scheduling and system control
- `message`, `nodes` — messaging and device nodes
- `web_search`, `web_fetch` — internet access (web_fetch = plain HTTP GET, no JS execution)
- `image` — visual understanding
- Owner-only: `gateway` (restart/update), `whatsapp_login`

### exec Tool Details
- Shell selection: uses SHELL env var; prefers bash/sh if fish detected
- Execution targets: `sandbox` (Docker), `gateway` (host), `node` (remote paired device)
- Security modes: `deny`, `allowlist`, `full`
- Approval: `ask` field — `off`, `on-miss`, `always`
- Sandboxing: OFF by default for main session
- Background: `yieldMs` triggers process tool for polling
- `apply_patch` subtool: experimental multi-file structured edits

### Sandbox (Docker) Architecture
- Mode: `off` | `non-main` | `all`
- Scope: `session` (1 container/session) | `agent` (1/agent) | `shared` (1 global)
- Workspace access: `none` | `ro` | `rw`
- Resource: 256MB-2GB RAM per container; ephemeral filesystem
- Group chats default to sandboxed execution
- Cannot mount Docker socket or system directories
- Debug: `openclaw sandbox explain`, `openclaw sandbox effective-policy`

### Sub-Agent System
- Tool: `sessions_spawn` — non-blocking, returns `{status:"accepted", runId, childSessionKey}` immediately
- Session key: `agent:<agentId>:subagent:<uuid>`
- Default max depth: 1 (sub-agents cannot spawn sub-agents)
- Configurable: `maxSpawnDepth: 2` enables orchestrator pattern (max 5 levels)
- Max children per agent: 5 (concurrent)
- Concurrency lane: `subagent`, default limit 8 concurrent runs
- Auto-archive: 60 minutes after completion
- Context isolation: sub-agents only get AGENTS.md + TOOLS.md (no SOUL.md, IDENTITY.md, USER.md)
- Results: announced back to originating chat channel
- Cost: sub-agents have own context/token usage; configure cheaper models for workers

### Multi-Agent Configuration
- Multiple agents in single Gateway via `agents.list[]`
- Each agent: unique `id`, own workspace, own state dir (`~/.openclaw/agents/<agentId>/`), own session store
- Bindings: route inbound by channel, accountId, chatType, peer (specificity-based priority)
- Auth profiles: per-agent (`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`)
- Default agent: first with `default: true`, or first in list, or synthetic "main"
- Create: `openclaw agents add <name>`

## Storage Layout
```
~/.openclaw/
├── openclaw.json              # Main config (JSON5, Zod-validated)
├── openclaw.json.bak          # Auto-backup before each write
├── .env                       # Environment variables
├── credentials/               # Channel auth tokens (mode 0600)
├── agents/<agentId>/
│   ├── agent/auth-profiles.json
│   └── sessions/              # JSONL event logs
├── memory/<agentId>.sqlite    # SQLite vector DB (sqlite-vec extension)
└── workspace/ (default agent workspace)
    ├── AGENTS.md              # Primary instruction contract
    ├── SOUL.md                # Personality/tone/values
    ├── USER.md                # User preferences
    ├── IDENTITY.md            # Structured profile (name, role, goals)
    ├── TOOLS.md               # Tool conventions and env notes
    ├── HEARTBEAT.md           # Periodic maintenance config
    ├── BOOT.md                # Startup ritual (needs hooks.internal.enabled: true)
    ├── BOOTSTRAP.md           # First-run interview script
    ├── MEMORY.md              # Long-term curated facts (private sessions only)
    ├── skills/                # Workspace-priority skills
    └── memory/YYYY-MM-DD.md   # Daily append-only logs (always loaded)
```

## Memory System
- Architecture: plain Markdown files = source of truth; SQLite sqlite-vec for search
- Daily logs: `memory/YYYY-MM-DD.md` — always loaded at session start
- MEMORY.md: long-term curated facts — loaded only in private/DM sessions
- Vector backends: builtin (SQLite + sqlite-vec) or QMD (external sidecar)
- Embedding providers: OpenAI (text-embedding-3-small), Gemini, Local (GGUF via node-llama-cpp), Auto
- Hybrid search: vector similarity + BM25 keyword (exact IDs/code symbols work too)
- Advanced ranking: MMR (Maximal Marginal Relevance), temporal decay, evergreen markers
- Index paths: `~/.openclaw/memory/{agentId}.sqlite`
- Triggers: file watcher (1.5s debounce), lazy on search, scheduled
- Memory flush: before context compaction, silent agentic turn writes to MEMORY.md
- Sync config: `agents.defaults.memorySearch.deltaBytes` (~100KB), `deltaMessages` (50 JSONL lines)
- `openclaw memory index --all` / `openclaw memory search "query"`

## Gateway API (RPC Methods)
- config.get / config.set / config.apply / config.patch
- agent.send / agent.execute
- sessions.list / sessions.history / sessions.send / sessions.spawn
- channels.status / channels.login
- gateway.health / gateway.status / gateway.restart
- node.invoke / node.pair.request / node.pair.verify

## Model Failover System
- Format: `provider/model` (e.g., `anthropic/claude-sonnet-4-20250514`)
- Error classification: auth failure, billing, rate limit (all trigger failover); context overflow → compaction
- Auth profile rotation: tries next credential before moving to fallback model
- Cooldown timers for billing failures; escalating wait times up to `billingMaxHours`
- CLI: `openclaw models set primary <model>`, `openclaw models add-fallback <model>`

## Plugin/Extension System
- Discovery: scans workspace packages for `openclaw.extensions` in package.json
- Extension types: channels, memory backends, custom tools, provider plugins
- Registration: `api.registerTool(toolName, toolDefinition)`
- Install: npm packages, validated against JSON Schema
- Tool policy: plugin tools subject to same cascade as built-in tools
- Reference via `group:plugin-name` notation in policy rules

## Self-Improvement / Skill Modification
- Agents can install, write, and modify skill files (SKILL.md) if given fs tools
- File watcher: Gateway auto-detects SKILL.md changes and reloads skills snapshot
- Agents can rewrite openclaw.json config (with sufficient permissions) — persists across restarts
- "self-improving-agent" community skill: logs LEARNINGS.md, ERRORS.md, FEATURE_REQUESTS.md
- "capability-evolver" skill: inspects runtime history, autonomously writes new code
- NOT true recursive self-improvement — no closed-loop evaluation or weight modification

## Security Issues
- CVE-2026-25253 (CVSS 8.8): Critical RCE via auth token theft through URL parameters
- 135,000+ exposed instances (security researchers)
- Skills have NO cryptographic signing — ClawHub requires only week-old GitHub account to publish
- ClawHavoc incident (Jan 2026): 341 malicious skills deploying Atomic Stealer (AMOS) malware
  (~12% of 2,857 skills at that time)
- Main session has full host access by default — sandboxing OFF by default
- Memory poisoning attacks via SOUL.md/MEMORY.md injection
- Snyk MCP-Scan recommended for supply chain scanning

## Deployment Patterns
1. Local dev: `openclaw gateway` foreground, loopback-only
2. Production macOS: LaunchAgent + menu bar app + iOS companion
3. Remote VPS: systemd + SSH tunnel/Tailscale + auth token
4. Fly.io: Docker container + persistent volume (community pattern for us)
5. Docker image: `alpine/openclaw` on Docker Hub
6. Docker resource baseline: 150-300MB Gateway + 256MB-2GB per sandbox container

## Resource Requirements
| Scenario | CPU | RAM | Storage |
|----------|-----|-----|---------|
| Minimal | 1 vCPU | 512MB | 1GB |
| Standard | 1-2 vCPU | 1-2GB | 5GB |
| Production | 2-4 vCPU | 4-8GB | 20GB+ |
- Primary port: 18789 (Gateway WebSocket/HTTP)
- Canvas port: 18793

## Supported Channels (13+)
WhatsApp (Baileys), Telegram (grammY), Discord (discord.js), Slack, Signal, iMessage (BlueBubbles legacy),
Google Chat, Microsoft Teams, Matrix, Mattermost, Zalo, Zalo Personal, WebChat

## Canvas / A2UI
- Separate server on port 18793
- Agent-generated HTML with A2UI attributes → declarative interactive elements
- Renders on macOS (WebKit), iOS (SwiftUI), Android (WebView), web

## Post-Acqui-Hire Status (Feb 15, 2026)
- Peter Steinberger joins OpenAI to "drive next generation of personal agents"
- Sam Altman: "future is extremely multi-agent... important to support open source"
- OpenClaw moved to open-source foundation — no single entity controls it
- OpenAI sponsoring but not owning the project
- Steinberger goal: "build an agent even my mum can use"
- No ChatGPT integration announced yet; community expects public roadmap
- Changelog continues normally: 2026.2.15 added Discord Components v2, nested sub-agents, memory MMR
- 2026.2.17 added Anthropic 1M context beta, Sonnet 4.6 support, iOS Talk Mode improvements

## HTTP API (External App Integration)

### Chat Completions Endpoint (OpenAI-compatible)
- Must enable: `gateway.http.endpoints.chatCompletions.enabled: true`
- Endpoint: `POST http://<host>:<port>/v1/chat/completions`
- Auth: `Authorization: Bearer <token>` (uses gateway.auth.token)
- Agent selection: `"model": "openclaw:<agentId>"` OR header `x-openclaw-agent-id: <agentId>`
- Session control: header `x-openclaw-session-key: <key>` for persistent sessions
- Streaming: `"stream": true` returns SSE events (`data: <json>`, terminates with `data: [DONE]`)
- Sessions: stateless by default; set OpenAI `user` field to get stable session key
- Rate: 429 + Retry-After on auth failures

### OpenResponses Endpoint
- Must enable: `gateway.http.endpoints.responses.enabled: true`
- Endpoint: `POST /v1/responses`
- Semantic streaming events (item-based input, richer than chat completions)

### WebSocket RPC (Full Protocol)
- Endpoint: `ws://<host>:<port>/` (same port as Gateway, 18789 default)
- Three-phase auth: server sends challenge nonce → client sends connect message → server sends hello-ok
- Message framing: `{type:"req", id, method, params}` / `{type:"res", id, ok, payload|error}` / `{type:"event", event, payload, seq?, stateVersion?}`
- Roles: operator (config/session control) | node (device capabilities)
- Key RPC methods: config.get/set/apply/patch, agent.send, sessions.list/history/send/spawn, gateway.health/status/restart, node.pair.request/verify/invoke, device.token.rotate/revoke

### Webhook Ingress
- Path: `/hooks` (default)
- Auth: shared secret token header
- Routes: configurable `hooks.mappings[]` match on path + source fields
- Presets: Gmail, GitHub, Stripe, etc.
- Template variables: `{{event.field}}` substitution in messageTemplate
- Transform scripts: JavaScript in `hooks.transformsDir` for complex extraction

## Fly.io Deployment (Official Pattern)
```toml
[env]
  NODE_ENV = "production"
  OPENCLAW_STATE_DIR = "/data"          # persist to volume
  NODE_OPTIONS = "--max-old-space-size=1536"

[processes]
  app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

[[vm]]
  size = "shared-cpu-2x"
  memory = "2048mb"

[mounts]
  source = "openclaw_data"
  destination = "/data"
```
- Secrets: `OPENCLAW_GATEWAY_TOKEN`, `ANTHROPIC_API_KEY`, channel bot tokens
- Min 2GB RAM recommended (512MB too small)
- `--bind lan` required for Fly proxy to reach the gateway
- State dir on mounted volume survives container restarts
- Remove stale lock files after restart: `rm -f /data/gateway.*.lock`
- Cost: ~$10-15/month for shared-cpu-2x + 2GB

## Plugin SDK API Summary
Four slot types: `channel`, `tool`, `provider`, `memory`
Entry: `export default { slot, id, schema (TypeBox), metadata, init(config, deps) => handler }`
Deps: `{ logger, configDir, workspaceDir, rpc }`
Install: jiti loads TS at runtime — no transpile needed for development
SDK import: `import type { PluginDefinition } from "openclaw/plugin-sdk"`
Channel plugin adds: `start(), stop(), send(envelope), onReceive(callback)`
Tool plugin adds: `{ definition: { name, description, inputSchema }, execute(input) }`
Provider plugin adds: `{ models: [], stream(messages, model) }`
Memory plugin adds: `{ initialize(), search(query, opts), index(docs) }`

## SKILL.md Complete Format
```yaml
---
name: skill-identifier          # required, unique within workspace
description: "What this does"  # required, used for LLM triggering — be VERY specific
homepage: https://...           # optional, shown in macOS UI
user-invocable: true            # optional (default: true), expose as /slash-command
disable-model-invocation: false # optional (default: false), exclude from model prompt
command-dispatch: "tool"        # optional, for direct tool dispatch
command-tool: tool_name         # required if command-dispatch set
command-arg-mode: "raw"         # optional (default: "raw"), arg forwarding
metadata: '{"openclaw":{"always":false,"emoji":"🔍","os":["darwin","linux"],"requires":{"bins":["gh"],"env":["GITHUB_TOKEN"]},"install":[{"type":"brew","package":"gh"}]}}'
---
```
metadata.openclaw fields:
- `always` (bool): always inject into prompt, not just when relevant
- `emoji`: UI display
- `os`: platform filter ["darwin","linux","win32"]
- `requires.bins`: required system binaries (checked with `which`)
- `requires.anyBins`: at least one must be present
- `requires.env`: required environment variables
- `requires.config`: required openclaw.json paths
- `primaryEnv`: main env var (shown as config field in UI)
- `skillKey`: override the config key used in `skills.entries`
- `install[]`: array of install specs with types: brew, npm, go, uv, download

Loading precedence: workspace skills > managed skills > bundled skills
Skills inject as TOOLS.md section in system prompt on session start
Per-skill config in openclaw.json: `skills.entries.<skillKey>.enabled`, `.env`, `.apiKey`

## Complete Tool Reference
| Tool | Group | Description |
|------|-------|-------------|
| read | group:fs | Read file/list dir (path, offset, limit) |
| write | group:fs | Create/overwrite file |
| edit | group:fs | Search-replace edits (path, edits[], dryRun) |
| apply_patch | group:fs | Multi-file structured patches (experimental, OpenAI only) |
| exec | group:runtime | Shell command (command, yieldMs, background, timeout, elevated, host, security, ask, node, pty) |
| process | group:runtime | Manage background exec sessions (list/poll/log/write/kill/clear/remove) |
| bash | group:runtime | Alias/variant of exec |
| web_search | group:web | Brave Search API (query, count 1-10; needs BRAVE_API_KEY) |
| web_fetch | group:web | URL fetch → markdown, 50K char limit (url, extractMode, maxChars) |
| browser | group:ui | CDP browser control (status/start/stop/tabs/open/navigate/snapshot/screenshot/act...) |
| canvas | group:ui | A2UI canvas (present/hide/navigate/eval/snapshot/a2ui_push/a2ui_reset) |
| nodes | group:nodes | Device control (status/describe/camera_snap/camera_clip/screen_record/location_get) |
| image | group:nodes | Analyze images with imageModel |
| message | group:messaging | Send to any channel (send/poll/react/read/edit/delete/pin/thread-create/ban...) |
| cron | group:automation | Schedule jobs (status/list/add/update/remove/run/runs/wake) |
| gateway | group:automation | Config control (restart/config.get/config.apply/config.patch/update.run) |
| sessions_list | group:sessions | List active sessions |
| sessions_history | group:sessions | Get session transcript |
| sessions_send | group:sessions | Send to another session (with optional wait) |
| sessions_spawn | group:sessions | Launch sub-agent (non-blocking; returns {status,runId,childSessionKey}) |
| session_status | group:sessions | Get/update session + model override |
| agents_list | group:sessions | List agent IDs available for spawn |
| memory_search | group:memory | Hybrid vector+BM25 search (query, count, scope) |
| memory_get | group:memory | Read specific memory docs by ID |
