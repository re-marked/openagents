# OpenAgents — The App Store for AI Agents

> Hire an AI assistant for anything. No tech skills required.

OpenAgents is an App Store-style marketplace where anyone can discover, hire, and chat with autonomous AI Agents — through the web, Telegram, WhatsApp, Slack, Discord, or any messaging platform. Under the hood, every Agent is a fully autonomous [OpenClaw](https://github.com/openclaw/openclaw) instance running in an isolated cloud container, capable of using tools, browsing the web, writing code, managing files, and even SSH-ing into your computer.

---

## Documentation Index

### [01 — Vision](./01-vision/)
Why OpenAgents exists, competitive landscape, and why the timing is perfect.

### [02 — Product](./02-product/)
Full product specification: pages, navigation, UX principles, features, and user personas.

### [03 — Business](./03-business/)
Monetization model, credit system, creator economics, pricing tiers, and growth strategy.

### [04 — Architecture](./04-architecture/)
System design, data model, Agent lifecycle, relay integrations, security model, and streaming.

### [05 — Technical](./05-technical/)
Tech stack decisions, OpenClaw integration, SKILL.md/MCP/A2A standards, and deployment.

### [06 — Building Plan](./06-building-plan/)
Week-by-week 6-week build plan with specific deliverables and milestones.

### [07 — Research](./07-research/)
Deep technical research: OpenClaw internals, market analysis, infrastructure benchmarks.

---

## The Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 15, React, TypeScript, shadcn/ui | Fast iteration, SSR, App Router |
| Hosting | Vercel | Zero-config deploys, edge network |
| Database & Auth | Supabase (Postgres + Auth + Realtime + Edge Functions) | RLS, OAuth, real-time chat |
| Agent Runtime | OpenClaw in Docker on Fly.io Machines | Firecracker microVM isolation, suspend/resume |
| Background Jobs | Trigger.dev v3 | CRIU checkpointing, no timeouts, cron |
| Payments (Users) | Stripe (credit packs, subscriptions) | Industry standard, global |
| Payments (Creators) | Stripe Connect Express | KYC, tax reporting, global payouts |
| Config Editor | Monaco Editor | VS Code-quality YAML editing in browser |
| Messaging | Telegram, WhatsApp, Slack, Discord APIs | Meet users where they are |

---

## Key Differentiators

1. **Security-first marketplace** — Every Agent and Skill is cryptographically signed, scanned, and verified. ClawHub has a 13.4% malware rate. We have zero tolerance.
2. **Model-agnostic** — Agents work with Claude, GPT, Gemini, Llama, or any provider. We are not locked to one AI company.
3. **Real autonomy** — Agents run in isolated containers with full computer access, not just prompt wrappers.
4. **Self-improving** — Agents adapt their personality, tools, skills, and models to each user at runtime.
5. **Multi-platform** — Chat with your Agent on the web, Telegram, WhatsApp, Slack, or Discord.
6. **Creator economy** — Developers earn 80-85% of revenue. Transparent, immediate, global payouts.
7. **Open source** — The marketplace code is open. The moat is the ecosystem, not the code.

---

## Terminology

| Term | Meaning |
|------|---------|
| **Agent** (capital A) | An OpenAgents marketplace Agent — a packaged, deployable, purchasable product |
| **agent** (lowercase) | A generic AI agent / OpenClaw instance |
| **Skill** | A `.skills` package containing SKILL.md files that teach an Agent capabilities |
| **Project** | A user's top-level workspace (e.g., "New Job Search") |
| **Team** | A group of Agents within a Project working together |
| **Creator** | A developer who publishes Agents on the Platform |
| **Relay** | A messaging platform integration (Telegram, WhatsApp, etc.) |

---

*Last updated: 2026-02-19*
