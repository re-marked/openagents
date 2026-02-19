# Phase 6: Launch (Week 6)

## Goal
Seed the marketplace with quality Agents, launch publicly, monitor everything.

---

## Day 1-2: Seed Agents

### Build 10-15 Launch Agents
Create GitHub repos with full config for each. Cover every category:

**Productivity**
- [ ] "Daily Planner" — Organizes your day, sets reminders, tracks tasks
- [ ] "Email Drafter" — Writes professional emails in your voice

**Research**
- [ ] "Research Pro" — Deep web research with citations
- [ ] "Market Analyst" — Competitor research and market analysis

**Writing**
- [ ] "Blog Writer" — Writes blog posts in your style
- [ ] "Copy Editor" — Proofreads and improves any text

**Coding**
- [ ] "Code Reviewer" — Reviews PRs, suggests improvements
- [ ] "Bug Hunter" — Analyzes codebases for bugs and security issues

**Business**
- [ ] "Legal Doc Reviewer" — Reviews contracts and legal documents
- [ ] "Financial Analyst" — Analyzes financial data and reports

**Creative**
- [ ] "Story Writer" — Collaborative fiction writing
- [ ] "Social Media Manager" — Creates social media content

**Personal**
- [ ] "Study Buddy" — Helps with learning and exam prep
- [ ] "Travel Planner" — Plans trips with itineraries and bookings
- [ ] "Fitness Coach" — Personalized workout and nutrition plans

### For Each Agent
- [ ] Create GitHub repo with agent.yaml, openagents.yaml, .skills/, SOUL.md, README.md
- [ ] Write compelling marketplace description
- [ ] Create icon (use AI image generation)
- [ ] Publish through the Platform (eat our own dogfood)
- [ ] Test: hire → chat → verify quality of responses
- [ ] Test: Telegram relay works

---

## Day 3: Monitoring + Observability

### Application Monitoring
- [ ] Vercel Analytics (built-in)
- [ ] Supabase Dashboard monitoring (query performance, auth events)
- [ ] Fly.io Dashboard (machine status, resource usage)
- [ ] Trigger.dev Dashboard (task success/failure rates)

### Custom Alerts
- [ ] Trigger.dev job: alert if any Machine is in "error" state for >10 min
- [ ] Stripe webhook monitoring: alert on failed payments
- [ ] Credit balance alerts: notify users at 20% and 5% remaining
- [ ] Health check failure rate: alert if >5% of machines fail health check

### Error Tracking
- [ ] Sentry or similar (Vercel integration)
- [ ] Server-side error capture in route handlers
- [ ] Client-side error boundary reporting
- [ ] Unhandled promise rejection tracking

### Logging
- [ ] Structured logging in all route handlers
- [ ] Trigger.dev task logging (built-in)
- [ ] Machine provisioning audit trail
- [ ] Credit transaction audit trail

---

## Day 4: Launch Prep

### Content
- [ ] Product Hunt listing: title, tagline, description, screenshots, maker comment
- [ ] Hacker News post draft
- [ ] X/Twitter launch thread (5-10 tweets with demos)
- [ ] Reddit posts: r/OpenClaw, r/ChatGPT, r/SideProject, r/artificial
- [ ] Blog post: "Introducing OpenAgents" on the website

### Legal
- [ ] Privacy Policy page (use template, customize for agent data)
- [ ] Terms of Service page
- [ ] Acceptable Use Policy (what agents can/cannot do)

### Final Checks
- [ ] All seed Agents work correctly (hire → chat → streaming)
- [ ] Telegram relay works for all seed Agents
- [ ] Stripe checkout works (test mode → live mode)
- [ ] Credit system: trial → subscribe → top-up flow
- [ ] Creator flow: publish → dashboard → payouts configured
- [ ] Security: no exposed env vars, no API key leaks, RLS verified
- [ ] Performance: <3 second time-to-first-stream for warm machines
- [ ] Mobile: spot-check all critical flows on iPhone and Android

---

## Day 5: Launch Day

### Morning
- [ ] Switch Stripe to live mode
- [ ] Final deploy with all launch content
- [ ] Verify production: signup → hire → chat → pay → creator publish
- [ ] Warm up pre-warm pool (20 machines in iad)

### Launch Sequence
1. **Product Hunt** — Submit at 12:01 AM PST (first thing in the morning)
2. **Hacker News** — "Show HN: OpenAgents — The App Store for AI Agents" (post at ~8 AM EST)
3. **X/Twitter** — Launch thread (as soon as HN is posted)
4. **Reddit** — r/SideProject, r/artificial, r/OpenClaw (staggered over the day)

### Monitor
- [ ] Watch Vercel/Supabase/Fly.io dashboards for errors
- [ ] Respond to HN comments within 30 minutes
- [ ] Respond to Product Hunt comments
- [ ] Watch Stripe dashboard for payment issues
- [ ] Monitor credit consumption (are free trials converting?)
- [ ] Track: signups, hires, chat sessions, revenue

### Post-Launch (Day 5-7)
- [ ] Fix any bugs reported by first users
- [ ] Engage with community feedback
- [ ] Track metrics: conversion rate, session count, NPS
- [ ] Plan Week 7 priorities based on user feedback

---

## End of Week 6 Checklist

- [ ] 10-15 quality Agents on the marketplace
- [ ] Launched on Product Hunt, Hacker News, X/Twitter, Reddit
- [ ] Monitoring and alerting active
- [ ] First paying users
- [ ] First creator earnings (even if from our own seed Agents)
- [ ] Zero critical bugs
- [ ] Community engagement started (Discord, social media)
