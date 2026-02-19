# Phase 1: Foundation (Week 1)

## Goal
Everything needed before you can build features: database, auth, Fly.io provisioning, project scaffold.

---

## Day 1-2: Project Scaffold + Supabase

### Monorepo Setup
- [ ] Clean pnpm monorepo with Turborepo
- [ ] `apps/marketplace` — Next.js 15 with App Router
- [ ] `apps/sse-gateway` — Minimal Fly.io SSE router app
- [ ] `packages/ui` — shadcn/ui shared components
- [ ] `packages/db` — Supabase client, types, helpers
- [ ] ESLint + Prettier + TypeScript config
- [ ] GitHub repo, branch protection on main

### Supabase Project
- [ ] Create Supabase project
- [ ] Run initial migration: users, projects, teams, agents, agent_instances, sessions, messages, credit_balances, credit_transactions, usage_events, creator_earnings, agent_reviews, relay_connections
- [ ] Enable RLS on ALL tables
- [ ] Write RLS policies (see data-model.md)
- [ ] Create indexes (search, foreign keys, common queries)
- [ ] Set up Auth: Google OAuth provider, GitHub OAuth provider
- [ ] Configure auth hook for custom JWT claims (user_role, org_id)

### Auth Flow
- [ ] Supabase SSR middleware in Next.js (cookie-based sessions)
- [ ] Login page with Google + GitHub OAuth buttons
- [ ] Auth callback route handler
- [ ] Protected route middleware (redirect to /login if unauthenticated)
- [ ] User profile creation on first login

---

## Day 3-4: Fly.io + Trigger.dev

### Fly.io Setup
- [ ] Create Fly.io organization
- [ ] Generate API token
- [ ] Build base OpenClaw Docker image (from official + our config overlay)
- [ ] Push base image to Fly.io registry
- [ ] Create SSE Gateway app on Fly.io (thin fly-replay router)
- [ ] Test: manually create a Machine, send a message, get a response
- [ ] Test: suspend → resume cycle (verify <500ms)

### Trigger.dev Setup
- [ ] Create Trigger.dev project
- [ ] Install SDK in marketplace app
- [ ] Write `provision-agent-machine` task:
  - Create Fly.io App
  - Create Volume
  - Create Machine with OpenClaw image
  - Wait for started state
  - Update agent_instances in Supabase
- [ ] Write `health-check-machines` cron (every 5 min)
- [ ] Write `shutdown-idle-machines` cron (every hour)
- [ ] Test: trigger provisioning from a Supabase DB webhook

### Integration Test
- [ ] User signs up → Supabase creates user record
- [ ] Manually trigger provisioning → Machine starts on Fly.io
- [ ] Send message to Machine via HTTP → Get response
- [ ] Machine suspends after timeout → Resumes on next request

---

## Day 5: Environment + CI/CD

### Environment Variables
- [ ] Set up .env.local template with all required vars
- [ ] Vercel project: connect GitHub repo, set env vars
- [ ] Supabase Edge Function secrets
- [ ] Trigger.dev env vars (Fly.io token, Supabase service role key)

### CI/CD
- [ ] GitHub Actions: lint + type-check on PR
- [ ] Vercel auto-deploys on push to main
- [ ] Preview deploys on PR branches

### Deploy
- [ ] First deploy to Vercel (even if just a blank page with auth)
- [ ] Verify: login flow works on production URL
- [ ] Verify: Supabase connection works from Vercel

---

## End of Week 1 Checklist

- [ ] Can sign up with Google OAuth
- [ ] User record created in Supabase with correct RLS
- [ ] Can manually provision an OpenClaw Machine on Fly.io
- [ ] Machine responds to HTTP messages
- [ ] Machine auto-suspends and auto-resumes
- [ ] Trigger.dev tasks run successfully
- [ ] CI/CD pipeline working
- [ ] Deployed to Vercel (even if minimal UI)
