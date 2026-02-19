# OpenClaw Integration

## How OpenAgents Wraps OpenClaw

Every Agent on OpenAgents is an OpenClaw instance. The user never sees or interacts with OpenClaw directly. OpenAgents provides:

1. **Marketplace UX** — Browsing, hiring, managing Agents
2. **Infrastructure** — Fly.io Machines, suspend/resume, networking
3. **Security** — Skill signing, scanning, API key management
4. **Payments** — Credits, subscriptions, creator payouts
5. **Relays** — Telegram, WhatsApp, Slack, Discord routing

OpenClaw provides:
1. **Agent runtime** — LLM orchestration, tool execution, session management
2. **Provider abstraction** — Claude, GPT, Gemini, Llama via unified interface
3. **Gateway** — HTTP API for sending/receiving messages
4. **Memory** — Persistent memory across sessions
5. **Skills** — SKILL.md loading and execution
6. **Context management** — Token limit handling, context compaction

---

## OpenClaw Architecture (What Runs Inside Each Machine)

```
┌──────────────────────────────────────────────────────┐
│                   Fly.io Machine                      │
│                   (Firecracker microVM)               │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │              OpenClaw Gateway                    │ │
│  │              Port 18789                          │ │
│  │                                                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │  Agent   │  │  Session  │  │    Tool      │  │ │
│  │  │  Config  │  │  Manager  │  │   Executor   │  │ │
│  │  │          │  │  (JSONL)  │  │              │  │ │
│  │  │ SOUL.md  │  │           │  │  - CLI       │  │ │
│  │  │ agent.y  │  │  Context  │  │  - Web Search│  │ │
│  │  │ skills/* │  │  Compact. │  │  - File I/O  │  │ │
│  │  │          │  │           │  │  - SSH       │  │ │
│  │  └──────────┘  └──────────┘  │  - MCP       │  │ │
│  │                               │  - API calls │  │ │
│  │  ┌──────────┐  ┌──────────┐  └──────────────┘  │ │
│  │  │  Memory  │  │  LLM     │                     │ │
│  │  │  System  │  │  Router  │                     │ │
│  │  │          │  │          │                     │ │
│  │  │ save_mem │  │ Claude   │                     │ │
│  │  │ search   │  │ GPT      │                     │ │
│  │  │          │  │ Gemini   │                     │ │
│  │  └──────────┘  └──────────┘                     │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  /data/ (Fly.io Volume, persistent)                  │
│  ├── openclaw.json                                    │
│  ├── agents/main/sessions/*.jsonl                     │
│  ├── memory/                                          │
│  └── workspace/                                       │
└──────────────────────────────────────────────────────┘
```

---

## Key OpenClaw APIs We Use

### POST /v1/responses (Streaming)
Primary API for chat. Returns SSE stream of response tokens.

```typescript
const response = await fetch(`http://${machineId}.${appName}.internal:18789/v1/responses`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${gatewayToken}`,
  },
  body: JSON.stringify({
    input: [
      { role: "user", content: "Research the latest AI trends" }
    ],
    stream: true,
  }),
});
// Returns SSE stream with semantic events (token, tool_use, tool_result, etc.)
```

### POST /v1/chat/completions (OpenAI-Compatible)
Alternative API for non-streaming use (relay integrations).

### Session Management Tools
- `sessions_list` — List all active sessions
- `sessions_history` — Get message history for a session
- `sessions_send` — Send a message to a specific session
- `sessions_spawn` — Create a new session
- `session_status` — Get session state

### Memory Tools
- `save_memory` — Persist a fact to long-term memory
- `memory_search` — Search memory (semantic + keyword)

---

## OpenClaw Configuration for OpenAgents

Each Agent Machine gets a customized `openclaw.json`:

```json5
{
  // Model configuration (platform-managed API keys)
  model: {
    primary: "anthropic/claude-sonnet-4-6",
    fallbacks: ["openai/gpt-4o"]
  },

  // Agent identity
  agents: {
    list: [{
      id: "main",
      default: true,
      workspace: "/data/workspace",
      tools: {
        profile: "coding",
        allow: ["exec", "web_search", "file_read", "file_write"],
        deny: ["browser"]
      }
    }]
  },

  // Skills from creator's repo
  skills: {
    allowBundled: [],
    entries: {
      // Dynamically populated from .skills/ directory
    }
  },

  // Sandbox (all agents run sandboxed)
  sandbox: {
    mode: "always",
    scope: "session",
    workspace: "rw"
  },

  // Gateway config
  gateway: {
    http: {
      port: 18789,
      bind: "lan",
      endpoints: {
        responses: true,
        completions: true
      }
    }
  }
}
```

---

## Self-Improving Agents

One of OpenAgents' key differentiators. Agents adapt to users at runtime.

### How It Works

1. **Memory accumulation:** OpenClaw's `save_memory` tool persists facts about the user. Over time, the Agent builds a knowledge base about the user's preferences, projects, and communication style.

2. **SOUL.md evolution:** The Agent can modify its own SOUL.md (via file_write tool) to refine its personality based on user feedback. Example: user says "be more concise" → Agent updates SOUL.md to include "keep responses under 3 paragraphs."

3. **Skill discovery:** When an Agent encounters a task it can't handle, it can:
   - Search the OpenAgents marketplace for relevant skills (future API)
   - Recommend the user install additional skills
   - With permission, install and load new skills at runtime

4. **Model switching:** Agent can request a model upgrade for complex tasks. Example: simple Q&A uses Claude Haiku (cheaper), deep analysis automatically escalates to Claude Opus.

### Constraints
- Self-modification is logged (audit trail)
- Users can review and revert any changes
- Critical files (signed skills, system config) cannot be modified
- Model switching respects the user's credit budget (estimated cost shown)
