# Competitive Landscape

## The Four Categories of Agent Marketplaces

The market fragments into four categories. OpenAgents is the only product that spans all four.

### Category 1: Consumer Personality Agents
**Players:** GPT Store, Character.AI, Poe

These are prompt wrappers — the agent is just a system prompt with a chat UI. No computer access, no tools, no real autonomy. The GPT Store has 3M+ GPTs but most creators earn zero. Character.AI has 20M MAU but only $32.2M revenue (valuation crashed from $2.5B to $1B). Discovery is broken across all of them.

**OpenAgents advantage:** Our Agents actually DO things. They run in real containers with real tools.

### Category 2: Developer Skill Registries
**Players:** ClawHub, SkillsMP, SkillHub.club

These are package managers, not marketplaces. No monetization for creators. No curation. And critically — ClawHub has a **13.4% critical security issue rate** (Snyk ToxicSkills, Feb 2026). 534 skills with malware, prompt injection, or credential theft. The barrier to publish: a 1-week-old GitHub account.

**OpenAgents advantage:** Cryptographic signing, security scanning, verified publishers, and creator payments.

### Category 3: Enterprise Orchestration Platforms
**Players:** OpenAI Frontier, Salesforce Agentforce, Google Gemini Enterprise, AWS Bedrock AgentCore

These cost 6-7 figures annually. They're for Fortune 500 companies automating business processes, not for individuals hiring AI assistants. Salesforce charges $2/conversation or $0.10/action. No consumer play.

**OpenAgents advantage:** $9/month starting price. For humans, not enterprises.

### Category 4: Workflow Automation
**Players:** Relevance AI, n8n, Gumloop

These are low-code/no-code builder tools for business teams. You build your own agent from scratch using a visual canvas. There's no marketplace of pre-built agents to hire.

**OpenAgents advantage:** You don't build — you browse and hire.

---

## Head-to-Head: OpenAI

OpenAI is our most important competitor. Here's exactly what they're doing:

### OpenAI Frontier (launched Feb 5, 2026)
- Enterprise-only agent platform
- Build, deploy, manage agents across vendors (even non-OpenAI)
- Launch customers: HP, Intuit, Oracle, State Farm, Uber
- Pricing: undisclosed, estimated 6-7 figure annual contracts
- **NOT a consumer marketplace.** Not self-serve. Not for individuals.

### OpenAI AgentKit (launched Oct 2025)
- Visual agent builder (drag-and-drop canvas)
- Connector Registry (MCP-based data integrations)
- ChatKit (embeddable chat UI)
- Free with standard API pricing
- **A builder tool, not a marketplace.**

### OpenAI GPT Store
- 3M+ GPTs created, ~159K active
- Revenue: ~$0.03/conversation (opaque engagement bonus)
- Most creators earn <$500/month
- Discovery completely broken
- US-only payouts
- **The cautionary tale we learn from, not the model we follow.**

### Agentic Commerce Protocol (launched Feb 16, 2026)
- Co-developed with Stripe
- 4% fee on agent-completed purchases
- Live on Etsy, coming to 1M+ Shopify merchants
- **Commerce layer, not agent marketplace.**

### Peter Steinberger Acqui-hire (Feb 15, 2026)
- OpenClaw creator joined OpenAI
- OpenClaw stays open source under a Foundation
- Foundation board NOT YET FORMED as of Feb 17, 2026
- OpenAI will "support" the Foundation (financial terms undisclosed)
- Steinberger: "the future is extremely multi-agent"

**What this means for us:** OpenAI will eventually build OpenClaw-style agent capabilities natively into ChatGPT. But "eventually" means 12-18 months for a company that size. We have a 6-week window to launch and a 12-month window to build an ecosystem moat.

---

## Head-to-Head: ClawHub

ClawHub is the official OpenClaw skill registry. 5,705+ skills, 15K+ daily installs.

| Dimension | ClawHub | OpenAgents |
|-----------|---------|------------|
| Security | 13.4% critical issues, no signing | Ed25519 signing, Snyk scanning |
| Creator monetization | None | 80-85% revenue share |
| Agent hosting | None (BYO server) | Managed Fly.io containers |
| User target | Developers | Everyone |
| Discovery | CLI-only | App Store UI |
| Relay support | BYO | Built-in Telegram/WhatsApp/Slack/Discord |

---

## The Market Gap

No existing product combines:
- Agent runtimes (not just prompts or skills)
- Creator monetization (transparent, immediate payouts)
- Security verification (signed, scanned, audited)
- Consumer-friendly UX (no tech jargon)
- Multi-platform relay (Telegram, WhatsApp, Slack, Discord)

This is the gap OpenAgents fills.

---

## Key Market Data Points

- SKILL.md (Anthropic open standard, Dec 2025) adopted by Claude Code, OpenAI Codex CLI, ChatGPT, Cursor — 200K+ skills on SkillsMP
- MCP: 97M+ monthly SDK downloads, donated to Linux Foundation
- A2A: 150+ organizations, merged with IBM's ACP under Linux Foundation
- 41% of consumers have used AI platforms for product discovery (Jan 2026)
- Market norm for platform commission: 15-30% (we take 15-20%)
- Fly.io Machines: ~$0.85/user/month for compute + storage
- GPT Store lesson: distribution without monetization = worthless

---

*Next: [Why Now →](./why-now.md)*
