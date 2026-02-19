# Technology Stack

## Decision Matrix

Every technology choice optimizes for: **speed of iteration** (solo dev), **simplicity** (fewer moving parts), and **scalability** (grows with users).

---

## Frontend

| Technology | Role | Why This |
|-----------|------|----------|
| **Next.js 15** | Framework | App Router, Server Components for SEO, Route Handlers for SSE, best React framework |
| **React 19** | UI library | Industry standard, huge ecosystem |
| **TypeScript** | Language | Type safety, better DX with Claude Code |
| **shadcn/ui** | Component library | Copy-paste components, fully customizable, Tailwind-based |
| **Tailwind CSS 4** | Styling | Utility-first, fast iteration, consistent design |
| **Monaco Editor** | YAML/MD editor | VS Code engine, syntax highlighting, autocomplete, used for the split-panel Agent editor and power user file editing |
| **Framer Motion** | Animations | Landing page animations, page transitions |

### Rejected Alternatives
- **Remix/SvelteKit:** Great frameworks but smaller ecosystem. Next.js has the most examples, templates, and Claude Code support.
- **Radix/MUI:** shadcn/ui gives the same components with full control over styling.
- **CSS Modules:** Tailwind is faster for solo dev iteration.

---

## Backend / Infrastructure

| Technology | Role | Why This |
|-----------|------|----------|
| **Vercel** | Frontend hosting | Zero-config deploys, preview URLs, edge network, Next.js creators |
| **Supabase** | Database + Auth + Realtime | Postgres, RLS, OAuth, Realtime Broadcast, Edge Functions, Vault. One service replaces 5 separate tools. |
| **Fly.io Machines** | Agent compute | Firecracker microVMs, suspend/resume, per-second billing, 6PN network, fly-replay routing. Purpose-built for per-user isolated containers. |
| **Trigger.dev v3** | Background jobs | CRIU checkpointing (no timeouts), cron scheduling, concurrency control. Replaces Bull/BullMQ + custom cron. |
| **Stripe** | User payments | Subscriptions, one-time purchases, customer portal. Industry standard. |
| **Stripe Connect Express** | Creator payouts | KYC, tax reporting, global bank transfers. Purpose-built for marketplace payouts. |
| **Upstash Redis/QStash** | Queue + cache | Serverless Redis for caching, QStash for reliable message queuing from Edge Functions to Trigger.dev. |

### Rejected Alternatives
- **Polar.sh:** Explicitly prohibits marketplace models in their AUP. Cannot be used for creator payouts.
- **Railway/Render:** Good hosting but lack Fly.io's fly-replay routing and Firecracker isolation.
- **BullMQ:** Requires Redis management. Trigger.dev is fully managed with better DX.
- **Firebase:** Inferior Postgres alternative. Supabase gives raw SQL, RLS, and better developer experience.
- **AWS/GCP:** Overkill for a solo dev. Would add weeks to setup.

---

## Agent Runtime

| Technology | Role | Why This |
|-----------|------|----------|
| **OpenClaw** | Agent framework | The most capable open-source AI agent. Gateway pattern, multi-model, tool execution, persistent memory, skill system. MIT licensed. |
| **Docker** | Containerization | OpenClaw provides official Docker images. Fly.io builds from Dockerfile. |

### Key OpenClaw Config for OpenAgents
```toml
# fly.toml per Agent Machine
[processes]
  app = "node dist/index.js gateway --allow-unconfigured --port 18789 --bind lan"

[env]
  NODE_ENV = "production"
  OPENCLAW_STATE_DIR = "/data"
  NODE_OPTIONS = "--max-old-space-size=1536"

[[vm]]
  size = "shared-cpu-1x"
  memory = "512mb"

[mounts]
  source = "agent_data"
  destination = "/data"
```

### Critical: No GPU on Fly.io
Fly.io is **deprecating GPU Machines on July 31, 2026**. All LLM inference MUST go through API providers (Anthropic, OpenAI, Google). Never self-host models on Fly.io. This is actually simpler — OpenClaw handles provider routing natively.

---

## Development Tools

| Tool | Role |
|------|------|
| **pnpm** | Package manager (monorepo workspaces) |
| **Turborepo** | Monorepo build orchestration |
| **ESLint + Prettier** | Code quality |
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |
| **GitHub Actions** | CI/CD |
| **Claude Code** | AI-assisted development (the secret weapon) |

---

## Monorepo Structure

```
openagents/
├── apps/
│   ├── marketplace/          # Next.js 15 app (Vercel)
│   │   ├── app/
│   │   │   ├── (public)/     # Landing, discover, agent preview
│   │   │   ├── (workspace)/  # Dashboard, chat, settings
│   │   │   ├── (platform)/   # Creator tools (platform.openagents.com)
│   │   │   └── api/          # Route handlers (SSE, webhooks, Stripe)
│   │   ├── components/
│   │   ├── lib/
│   │   └── trigger/          # Trigger.dev task definitions
│   ├── docs/                 # This documentation
│   └── sse-gateway/          # Fly.io SSE gateway app (thin router)
├── packages/
│   ├── ui/                   # Shared shadcn components
│   ├── db/                   # Supabase client, types, migrations
│   ├── config/               # Shared ESLint, TypeScript config
│   └── agent-sdk/            # OpenAgents ↔ OpenClaw integration layer
├── supabase/
│   ├── migrations/           # SQL migrations
│   ├── functions/            # Edge Functions (webhooks)
│   └── config.toml
├── docker/
│   ├── agent-base/           # Base OpenClaw image for agents
│   └── sse-gateway/          # SSE gateway Dockerfile
├── .github/
│   └── workflows/            # CI/CD
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```
