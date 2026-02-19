# 06 — Building Plan

## 6-Week Sprint to MVP

Solo dev. Claude Code. Ship fast. Iterate faster.

### Principles
- **Ship daily.** Every day should produce a deployable increment.
- **Demo weekly.** Every Friday: record a 2-minute demo of what shipped.
- **Cut scope, not quality.** If something takes too long, simplify it — don't skip tests or security.
- **Infrastructure first, polish last.** Get data flowing end-to-end before making it pretty.

### The Phases

| Phase | Week | Focus | Deliverable |
|-------|------|-------|-------------|
| [Foundation](./phase-1-foundation.md) | 1 | Infra + Auth + DB | Supabase schema, auth, Fly.io provisioning |
| [Core](./phase-2-core.md) | 2 | Chat + Streaming + Agents | Working chat with a real OpenClaw Agent |
| [Marketplace](./phase-3-marketplace.md) | 3 | Browse + Hire + Pay | Marketplace UI, credit system, Stripe |
| [Platform](./phase-4-platform.md) | 4 | Creator tools + Publishing | GitHub import, YAML editor, Agent publishing |
| [Polish](./phase-5-polish.md) | 5 | UX + Security + Relay | Telegram, skill signing, landing page |
| [Launch](./phase-6-launch.md) | 6 | Launch prep + Go live | Seed Agents, launch on HN/PH, monitoring |

### Success Criteria (Week 6)
- [ ] 10+ Agents published on marketplace
- [ ] User can: browse → hire → chat → see streaming response (under 10 seconds)
- [ ] Creator can: connect repo → configure → publish (under 5 minutes)
- [ ] Credit system working (free trial, Basic plan, top-ups)
- [ ] Creator payouts configured (Stripe Connect)
- [ ] Telegram relay working for at least 1 Agent
- [ ] Skill signing pipeline active
- [ ] Zero known security vulnerabilities
