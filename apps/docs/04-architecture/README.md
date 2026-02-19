# 04 — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OpenAgents Platform                               │
│                                                                             │
│  ┌───────────────────┐    ┌────────────────────┐    ┌───────────────────┐   │
│  │   Next.js 15 App  │    │     Supabase       │    │   Trigger.dev v3  │   │
│  │   (Vercel)        │    │  ┌──────────────┐  │    │                   │   │
│  │                   │◄──►│  │ Postgres+RLS │  │    │  - Provisioning   │   │
│  │  - Marketplace    │    │  │ Auth (OAuth)  │  │    │  - Health checks  │   │
│  │  - Workspace      │    │  │ Realtime      │  │    │  - Idle shutdown  │   │
│  │  - Platform       │    │  │ Edge Fns      │  │    │  - Billing agg.   │   │
│  │  - Stripe billing │    │  │ Vault         │  │    │                   │   │
│  └────────┬──────────┘    │  └──────────────┘  │    └────────┬──────────┘   │
│           │               └────────┬───────────┘             │              │
│           │                        │                         │              │
│           │  SSE Proxy             │ DB Webhooks             │ Fly.io API   │
│           ▼                        ▼                         ▼              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        Fly.io (6PN Network)                          │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐                                                │   │
│  │  │  SSE Gateway App │ ◄── Vercel SSE requests                       │   │
│  │  │  (fly-replay)    │                                                │   │
│  │  └────────┬─────────┘                                                │   │
│  │           │ fly-replay to specific machine                           │   │
│  │           ▼                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │  Agent VM   │  │  Agent VM   │  │  Agent VM   │  ...              │   │
│  │  │  (OpenClaw) │  │  (OpenClaw) │  │  (OpenClaw) │                  │   │
│  │  │  user-abc   │  │  user-def   │  │  user-ghi   │                  │   │
│  │  │  1vCPU/512M │  │  1vCPU/512M │  │  1vCPU/512M │                  │   │
│  │  │  Volume 1GB │  │  Volume 1GB │  │  Volume 1GB │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐                                                │   │
│  │  │ Discord Gateway  │ (persistent WebSocket, autostop: off)          │   │
│  │  └──────────────────┘                                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Messaging Platforms                               │   │
│  │  Telegram → Edge Fn → Queue → Trigger.dev → Fly.io 6PN → respond    │   │
│  │  WhatsApp → Edge Fn → Queue → Trigger.dev → Fly.io 6PN → respond    │   │
│  │  Slack    → Edge Fn → Queue → Trigger.dev → Fly.io 6PN → respond    │   │
│  │  Discord  → Gateway Bot Machine → Fly.io 6PN → respond              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Documents

- [System Design](./system-design.md) — Component-by-component architecture
- [Data Model](./data-model.md) — Database schema and relationships
- [Agent Lifecycle](./agent-lifecycle.md) — Provisioning, runtime, suspend, stop, destroy
- [Relay Integrations](./relay-integrations.md) — Telegram, WhatsApp, Slack, Discord
- [Security](./security.md) — Container isolation, skill signing, API key management
- [Streaming](./streaming.md) — SSE proxy, Supabase Realtime, buffering fixes
