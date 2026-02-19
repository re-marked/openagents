# Why Now — The 6-Month Window

## The Perfect Storm

Five things happened simultaneously in late 2025 / early 2026 that create a once-in-a-decade opportunity:

### 1. OpenClaw Went Viral (Jan 2026)
204K+ GitHub stars. The first truly autonomous AI agent that normal people heard about. But using it requires a terminal, API keys, Docker, and self-hosting. The demand exists. The supply (easy access) doesn't.

### 2. Peter Steinberger Left (Feb 15, 2026)
OpenClaw's creator joined OpenAI. The Foundation board hasn't formed. The project has no product manager, no community manager, no business development. The ecosystem is leaderless during the highest-growth period in its history.

### 3. ClawHub's Security Crisis (Feb 2026)
Snyk's ToxicSkills report revealed 13.4% of skills have critical security issues. 76 confirmed malicious payloads. The ClawHavoc campaign distributed 341 malicious skills. Enterprises are actively blocking ClawHub. Trust is shattered.

### 4. SKILL.md Became Universal (Dec 2025 → Feb 2026)
Anthropic published SKILL.md as an open standard. Within 60 days, OpenAI adopted it for Codex CLI and ChatGPT. Now Claude Code, ChatGPT, Cursor, and VS Code all use the same skill format. A marketplace that supports SKILL.md gets access to 200K+ existing skills.

### 5. OpenAI is Enterprise-Only (Feb 2026)
Frontier is for HP, Oracle, and Uber. Not for your mum. The consumer agent marketplace is completely vacant.

## The Race

**OpenAI's timeline:** 12-18 months to build a consumer agent marketplace (corporate bureaucracy, enterprise focus, Frontier commitment).

**Our timeline:** 6 weeks to MVP, 3 months to product-market fit.

**Why we're faster:**
- Solo dev with Claude Code = no meetings, no PRDs, no approval chains
- OpenClaw is MIT-licensed and battle-tested — we wrap, not build
- Fly.io Machines API is purpose-built for per-user isolated containers
- Supabase + Next.js + Vercel = proven stack, zero DevOps
- Stripe Connect = payments from day one, no custom billing system

## The Moat

The code is open source. The moat is:

1. **Network effects** — More users attract more creators attract more users
2. **Security reputation** — Being the "safe" marketplace when ClawHub is the "wild west"
3. **Creator economics** — 80-85% revenue share + transparent payments = creator loyalty
4. **Ecosystem standards** — `.skills` packages, `openagents.yaml`, signing infrastructure
5. **Community** — Fast iteration, public roadmap, open source, community input

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| OpenAI ships consumer marketplace in <6 months | Low (20%) | Critical | Launch fast, build network effects |
| ClawHub adds monetization | Medium (40%) | High | Security differentiation they can't quickly match |
| OpenClaw Foundation becomes OpenAI-controlled | Medium (50%) | Medium | Position as truly independent, multi-model |
| Supply chain attack on OpenAgents | Medium (30%) | Critical | Signing pipeline before opening to external creators |
| SKILL.md standard forks | Low (15%) | Medium | Support both OpenClaw extended and official spec |

---

*Back to [Vision Index](./README.md)*
