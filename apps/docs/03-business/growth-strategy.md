# Growth Strategy

## Core Principle

Fast iteration. Maximum deploy frequency. Community support. MRR is important but secondary to user count and ecosystem growth in the first 6 months.

---

## Go-to-Market: Three Phases

### Phase 1: Seed (Weeks 1-6)
**Goal:** 20-30 high-quality Agents, 500 users

- Build 5-10 Agents ourselves (dogfooding)
- Convert 10-15 popular ClawHub skills into OpenAgents Agents
- Invite 5-10 known OpenClaw/ClawHub developers to the Platform
- Launch on Hacker News, Product Hunt, r/OpenClaw, r/ChatGPT
- Post on X/Twitter with demos (video of Agent completing real tasks)
- SEO: each Agent gets a public page indexed by Google

### Phase 2: Community (Months 2-3)
**Goal:** 100+ Agents, 5,000 users, $10K MRR

- Open Platform registration to all creators
- Launch creator referral program (bonus credits for referring other creators)
- Weekly "Agent of the Week" editorial
- Discord community for creators (support, feedback, showcase)
- Blog posts: "How I Built a $1K/month Agent" case studies
- YouTube/TikTok demos: non-technical people using Agents
- SEO flywheel: every Agent = a landing page = organic traffic

### Phase 3: Ecosystem (Months 4-6)
**Goal:** 500+ Agents, 25,000 users, $55K MRR

- Partner program for high-volume creators
- Agent collections: "Best for Students", "Business Essentials"
- API launch: third-party integrations
- Enterprise outreach: small businesses with 5-50 employees
- ".skills" ecosystem: standalone skill marketplace within OpenAgents
- Agent-to-agent: Teams of Agents that work together

---

## Growth Loops

### Loop 1: Creator → User → Creator
```
Creator publishes Agent → Users hire it → Creator earns money →
Creator tells other devs → More creators → More Agents → More users
```

### Loop 2: User → Share → User
```
User hires Agent → Agent does impressive work → User shares on social →
New users see it → New users sign up → More users
```

### Loop 3: SEO → Discovery → SEO
```
Agent published → Public page created → Google indexes it →
User searches "AI research assistant" → Finds OpenAgents → Signs up →
More Agents published → More pages indexed → More organic traffic
```

### Loop 4: Free Trial → Convert → Expand
```
50 free credits → User has "aha moment" → Upgrades to Basic ($9) →
Uses more Agents → Needs more credits → Upgrades to Pro ($29) →
Tells colleagues → Team adopts → Power plan ($79)
```

---

## Community Strategy

### Open Source
Everything is open source. The marketplace code, the Agent runtime, the Platform code. Why?

1. **Trust:** Users and creators can audit the code
2. **Contributions:** Community PRs for features, bug fixes, Agents
3. **Moat is ecosystem, not code:** Anyone can fork the code. Nobody can fork the users, creators, reputation, and signed skill database.

### Discord / Community Server
- #general: announcements, discussion
- #showcase: creators show off their Agents
- #help: user support (community-driven)
- #creator-chat: creator-only channel
- #feature-requests: public roadmap input
- #bug-reports: community QA

### Iteration Velocity
- Deploy multiple times per day (Vercel + GitHub Actions)
- Public changelog (updated with every meaningful deploy)
- Weekly "What shipped" post
- Monthly community call (30 min, demo + Q&A)
- User feedback loop: in-app feedback widget → Supabase → Trigger.dev triage

---

## Key Metrics to Track

### North Star Metric
**Weekly Active Sessions** — The number of Agent sessions per week across all users. This measures actual value delivery, not just signups.

### Supporting Metrics

| Metric | Target (Month 3) | Why |
|--------|------------------|-----|
| WAU (Weekly Active Users) | 2,000 | Engagement |
| Paid conversion rate | 10% | Revenue health |
| Creator count (active) | 50+ | Supply side |
| Avg sessions/user/week | 5 | Stickiness |
| NPS | 50+ | Satisfaction |
| Churn rate (monthly) | <8% | Retention |
| Time to first session | <30 seconds | Activation |
| ARPU (monthly) | $20 | Revenue |
| Creator earnings (top 10) | $500+/mo each | Creator economy health |
