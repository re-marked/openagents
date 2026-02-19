# Phase 3: Marketplace (Week 3)

## Goal
Users can browse Agents, hire them, and pay with credits. The marketplace feels like an App Store.

---

## Day 1-2: Marketplace UI

### Discovery Page (`/discover`)
- [ ] Search bar (full-text search on Supabase, "What do you need help with?")
- [ ] Category chips: Productivity, Research, Writing, Coding, Business, Creative, Personal
- [ ] Agent card grid (responsive: 1-3-4 columns)
- [ ] Agent card component: icon, name, tagline, rating, price, creator
- [ ] Sort: trending, newest, highest rated
- [ ] Filter: free/paid, category
- [ ] Loading skeletons
- [ ] Empty state: "No agents found. Try a different search."

### Agent Preview (`/agents/:id`)
- [ ] Hero: large icon, name, tagline, creator badge
- [ ] "Hire This Assistant" CTA button
- [ ] Tabs: Overview, Skills, Reviews
- [ ] Overview: full markdown description, capabilities list
- [ ] Skills: list of skills with descriptions
- [ ] Reviews: rating distribution + review list
- [ ] Price display: "Free" or "X credits per session"

### Landing Page (`/`)
- [ ] Hero section: title + tagline + CTA
- [ ] Bento grid: Today's Picks, Team Picks, Trending, New
- [ ] Each section links to `/discover` with filter
- [ ] Responsive, mobile-friendly
- [ ] SSR for SEO (Server Components)

---

## Day 3-4: Credit System + Stripe

### Credit System
- [ ] `credit_balances` table with subscription + topup columns
- [ ] Credit check before session start (API middleware)
- [ ] Atomic credit deduction after session (transaction)
- [ ] Credit display in workspace header (always visible)
- [ ] "Insufficient credits" error → redirect to buy credits

### Free Trial
- [ ] On first signup: insert 50 credits (subscription type, 7-day expiry)
- [ ] Show trial badge in UI: "Free Trial: X credits remaining"
- [ ] After 7 days: expired credits zeroed out via Trigger.dev cron

### Stripe Integration
- [ ] Stripe customer creation on signup
- [ ] Subscription checkout: Basic ($9), Pro ($29), Power ($79)
- [ ] Credit top-up checkout: Starter ($5), Regular ($15), Value ($40), Bulk ($100)
- [ ] Stripe webhook handler: payment_intent.succeeded, customer.subscription.updated
- [ ] On subscription payment: refresh subscription credits
- [ ] On top-up payment: add to topup credits
- [ ] Billing page: current plan, payment method, invoices (Stripe Customer Portal)
- [ ] Usage page: credit balance, consumption chart, per-Agent breakdown

### "Hire" Flow
- [ ] Click "Hire This Assistant" on Agent preview
- [ ] If not logged in → redirect to login → redirect back
- [ ] If no credits → redirect to pricing page
- [ ] If free Agent → immediately provision
- [ ] If paid Agent → show credit cost confirmation → provision on confirm
- [ ] Create `agent_instances` record → Trigger.dev provisioning
- [ ] Show provisioning progress → redirect to chat when ready

---

## Day 5: Seed Data + Polish

### Seed Agents
- [ ] Create 5-10 Agent records manually in Supabase
- [ ] Build corresponding agent.yaml + skills repos on GitHub
- [ ] Build Docker images and push to Fly.io
- [ ] Categories covered: productivity, research, writing, coding, business
- [ ] Each with: name, tagline, description, icon, skills list

### Polish
- [ ] Search result ranking (relevance, rating, recency)
- [ ] Page transitions / loading states
- [ ] Mobile responsive check on all marketplace pages
- [ ] SEO: meta tags, og:image, structured data for Agent pages

---

## End of Week 3 Checklist

- [ ] Can browse marketplace, search, filter by category
- [ ] Can view Agent preview with description, skills, reviews
- [ ] Can hire an Agent with one click
- [ ] Credit system working: trial credits, subscription, top-ups
- [ ] Stripe checkout working (subscription + one-time)
- [ ] Billing page with plan management
- [ ] Usage dashboard showing credit consumption
- [ ] 5-10 seed Agents published and working
