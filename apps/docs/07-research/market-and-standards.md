# Market & Standards Research

Research into AIEOS concepts, agent standards (SKILL.md, MCP, A2A), marketplace landscape, OpenAI strategy, and 2026 trends.

---

## 1. Agent Standards Landscape

### 1.1 SKILL.md — The Cross-Platform Agent Skill Standard

**Origin**: Anthropic, December 2025 ([agentskills.io](https://agentskills.io/specification))

SKILL.md is a Markdown + YAML frontmatter format for packaging agent capabilities. It is the first cross-platform agent standard to achieve universal adoption.

**Adoption (as of Feb 2026):**
- Claude Code (native)
- OpenAI Codex CLI (adopted Jan 2026)
- ChatGPT (adopted Feb 2026)
- Cursor (adopted Jan 2026)
- OpenClaw (superset — predates the standard with extended fields)

**Format:**
```markdown
---
name: web-search
description: Search the web and return relevant results
version: 1.0.0
tools:
  - name: search
    description: Search the web
    parameters:
      query:
        type: string
        description: The search query
---

# Web Search Skill

Instructions for the agent on how to use this skill...
```

**Official spec required fields**: `name`, `description` (6 total fields)
**OpenClaw extended fields**: 11+ fields (superset of official spec)

**Important divergence**: The official agentskills.io spec is minimal (6 fields), while OpenClaw uses a richer format (11+ fields). If the OpenClaw Foundation standardizes on one direction, marketplace compatibility may break.

### 1.2 MCP — Model Context Protocol

**Origin**: Anthropic, November 2024. Major update November 2025.

MCP defines how agents connect to tools and data sources. It is the **vertical** standard (agent → tool).

**November 2025 spec updates:**
- OAuth 2.1 authorization (replacing informal API key patterns)
- Expanded to long-running, governed workflows
- Production-grade governance hooks

**Three primitives:**
- **Resources**: Data an agent can read (files, DB rows, API responses)
- **Tools**: Functions an agent can call (write email, book flight)
- **Prompts**: Reusable prompt templates with parameters

**Transport**: stdio (local), SSE (streaming HTTP), WebSocket

**Production adoption (Feb 2026):**
- 97M+ monthly SDK downloads (Python + TypeScript)
- 10,000+ active MCP servers
- 75+ connectors in Claude alone
- Clients: Claude, ChatGPT, Cursor, Gemini, Microsoft Copilot, VS Code

### 1.3 A2A — Agent2Agent Protocol

**Origin**: Google, April 2025. V0.3 (July 2025) added gRPC + signed security cards.

A2A defines how agents communicate with other agents. It is the **horizontal** standard (agent → agent).

**Agent Card** (`/.well-known/agent-card.json`):
```json
{
  "name": "Flight Booking Agent",
  "version": "1.0.0",
  "url": "https://agent.example.com/a2a",
  "capabilities": { "streaming": true, "pushNotifications": true },
  "skills": [{
    "id": "book-flight",
    "name": "Book a Flight",
    "description": "Search and book airline tickets"
  }]
}
```

**Late 2025**: ACP (IBM) merged into A2A under Linux Foundation. The protocol wars are mostly over.

### 1.4 Protocol Decision Map

```
Use MCP when:      Agent needs to connect to tools, databases, APIs, file systems
Use A2A when:      One agent needs to delegate tasks to another agent
Use SKILL.md when: Packaging reusable agent capabilities for installation
```

MCP is vertical (agent→tool), A2A is horizontal (agent→agent), SKILL.md is the packaging format.

---

## 2. Marketplace Landscape

### 2.1 Four Categories of Agent Marketplaces

**Category 1: Consumer Personality Agents**
- GPT Store (OpenAI), Character.AI, Poe
- Monetization: engagement payout or ad-based; creator economics are poor
- Discovery: broken across all platforms

**Category 2: Developer Skill Registries**
- ClawHub, SkillsMP, SkillHub.club, LangChain Hub
- Monetization: none built-in
- Focus: code/text skills for AI coding assistants

**Category 3: Enterprise Orchestration Platforms**
- OpenAI Frontier, Salesforce Agentforce, Google Gemini Enterprise, AWS Bedrock AgentCore
- Monetization: enterprise contracts; no third-party creator economy
- Focus: business process automation

**Category 4: Workflow Automation Agents**
- Relevance AI, Wordware, Dust, Gumloop, n8n
- Monetization: subscription SaaS
- Focus: no-code/low-code agent building

**OpenAgents gap**: No marketplace combines (a) agent runtimes + (b) creator monetization + (c) security verification + (d) consumer-friendly UX.

### 2.2 GPT Store Post-Mortem

The GPT Store (Jan 2024) is the most documented marketplace failure:

**Scale**: 3M+ GPTs created, only ~159K public and active (94%+ abandonment rate)

**Revenue program failure:**
- Payout: ~$0.03 per conversation
- 33,000+ conversations/week needed for $1,000/month
- US-only, public GPT required
- Revenue program launched May 2024 — 6 months after store opened
- Top 0.01%: $15K–six figures annually
- Everyone else: $0–$500/month

**Discovery failure:**
- No SEO (GPTs not indexed by Google)
- No social proof propagation
- Featured section hand-curated with no criteria
- New creators get zero visibility

**Creator trust destroyed:**
- OpenAI releases native features that compete with top GPTs
- Multiple creators publicly bypassed the store
- Analytics limited to last 10,000 conversations

**What worked:**
- Long-tail SEO arbitrage (external blog posts)
- Direct API monetization (bypassing revenue program)
- Enterprise niches (legal, medical, cybersecurity)
- GPT Store worked as **marketing channel**, not revenue channel

**Key lesson**: Distribution without monetization infrastructure is worthless. Creators build for platforms with credible income paths.

### 2.3 Other Marketplaces

**SkillsMP** ([skillsmp.com](https://skillsmp.com)):
- 200,000+ SKILL.md skills aggregated from public GitHub repos
- No payments, no curation beyond 2-star minimum, no security scanning
- Organized by SDLC phase (interesting UX paradigm)

**Poe (Quora)**:
- Best creator economics in consumer AI: price-per-message (creator sets price up to $1/message)
- Subscription referral: 100% of first month, 50% of annual
- ~2M paid subscribers, backed by $75M (a16z)

**Relevance AI**:
- Curated agents from "trusted builders"
- Built on AWS Bedrock, enterprise focus
- Agents can be imported and modified

**Coze (ByteDance)**:
- Open-sourced core (Apache 2.0) as Coze Studio + Coze Loop
- Multi-agent collaboration (Coze Space, Apr 2025)
- International users, Volcano Engine parent

**HuggingFace Spaces**:
- 300,000+ Spaces, GPU from $0.40/hr
- Not a true agent marketplace — ML model hosting
- No creator monetization

### 2.4 ClawHub Analysis

- Community skill registry for OpenClaw
- **13.4% critical security issue rate** (Snyk ToxicSkills, Feb 2026)
- ClawHavoc incident: 341 malicious skills deploying AMOS macOS stealer
- Only 1-week-old GitHub account required to publish
- No cryptographic signing, no payments, no curation
- MIT licensed (TanStack Start + Convex stack) — can be self-hosted

---

## 3. OpenAI Strategy (Feb 2026)

### Three Major Bets

**Bet 1: Frontier (Feb 5, 2026) — Enterprise Control Plane**
- Manages agents from any vendor (including Google and Anthropic agents)
- Business Context + Agent Execution + Governance
- Launch customers: HP, Intuit, Oracle, State Farm, Uber
- Currently enterprise-only — no self-serve tier

**Bet 2: AgentKit (Oct 2025) — Developer Builder**
- Visual canvas for agent composition (nodes: Agent, Tool, Logic)
- Connector Registry (centralized MCP server management)
- ChatKit (embeddable chat UI)
- Free with standard API usage

**Bet 3: Agentic Commerce Protocol (Feb 16, 2026) — Commerce Layer**
- Co-developed with Stripe
- ChatGPT as "digital personal shopper"
- 4% transaction fee (vs Apple's 30%)
- Live: Etsy; announced: 1M+ Shopify merchants
- Signals: OpenAI building commerce moat, not just API revenue

### Peter Steinberger / OpenClaw Acqui-Hire

**Timeline:**
- Nov 2025: "Clawdbot" published on GitHub
- Jan 27, 2026: Renamed "Moltbot" (Anthropic trademark complaint)
- Jan 29-30, 2026: Renamed "OpenClaw" (crypto scam exploitation of name changes)
- Late Jan 2026: Goes viral — 100K+ stars in under a week, eventually 204K+
- Feb 14-15, 2026: Peter Steinberger joins OpenAI

**Steinberger's stated vision**: "Build an agent even my mum can use." He valued changing the world over building a company.

**OpenAI commitments:**
- OpenClaw stays MIT licensed
- Foundation to be established (OpenAI as sponsor)
- Steinberger drives "next generation of personal agents" at OpenAI

**Foundation status (Feb 19, 2026):** NOT YET FORMED. No board, no legal entity, no governing docs. OpenAI sponsorship confirmed verbally, terms undisclosed. Typically takes 3-6 months to formalize.

---

## 4. 2026 Trends

### Trend 1: Agent Commerce
ACP protocol + ChatGPT Instant Checkout signals agents completing transactions, not just tasks. Marketplaces without payment handling will be disintermediated.

### Trend 2: Security Scanning as Table Stakes
Snyk ToxicSkills put every skills marketplace on notice. 13.4% malware rate will trigger enterprise blocklists. First marketplace with verified, signed skills becomes enterprise default.

### Trend 3: Multi-Agent Orchestration
GPT Store's failure was partly architectural — single-agent model. Multi-agent systems show 171% average ROI vs 57% for single-agent. Marketplaces need agent composition.

### Trend 4: Agent OS as Infrastructure
Frontier (manage agents from any vendor), A2A (cross-company agent communication), AIOS (agent scheduling as OS service) — agents managed at infrastructure level, not application level.

### Trend 5: Verified Agent Identity
A2A v0.3 added signed security cards. AAIF working on agent identity standards. Critical as agents take consequential actions (purchases, file deletions, email sends).

---

## 5. AIOS — Academic Agent Operating System

AIOS (LLM Agent Operating System) from Rutgers University proposes OS-like scheduling for LLM agents: context switching, preemptive scheduling, memory management, agent communication.

**Status**: Academic, not production-ready. GitHub: agiresearch/AIOS.

**Useful for**: Conceptual vocabulary (scheduler, kernel, context manager) when talking to technical audiences. Not useful as actual infrastructure.

**Commercial "Agent OS" products** (Amdocs aOS, Builder Methods Agent OS): marketing terms meaning completely different things. For OpenAgents, the "Agent OS" is the Fly.io + OpenClaw stack.

---

## 6. Key Findings

- **SKILL.md is the real standard**: adopted by every major AI coding platform in 60 days. Any marketplace supporting SKILL.md gets access to 200K+ skills.
- **OpenClaw Foundation is unformed**: 18-month window where OpenClaw has no institutional direction
- **ClawHub security crisis**: 13.4% critical issues, no enterprise trust
- **GPT Store proved creator monetization is the hardest problem**: most creators earn zero
- **OpenAI building commerce, not just completions**: ACP (4% fee) signals the trillion-dollar prize
- **No marketplace combines runtime + payments + security + curation**: the gap is real
- **A2A + MCP converging under Linux Foundation**: protocol wars mostly over
- **AIOS is academic, not production**: don't plan infrastructure around it

---

## 7. Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| OpenAI ChatGPT absorbs OpenClaw user base | Medium (18-month horizon) | High | Focus on power users, privacy-conscious, multi-model |
| ClawHub pivots to add monetization | Medium | High | Move fast, security differentiation |
| SKILL.md standard forks | Low-Medium | Medium | Support both specs, track closely |
| OpenAI Frontier expands downmarket | Low (near-term) | High | Out-compete on community and creator economics |
| Supply chain attack on marketplace | Medium | Critical | Mandatory scanning + signing before launch |

---

## Sources

- [Agent Skills Specification (agentskills.io)](https://agentskills.io/specification)
- [Anthropic Agent Skills Engineering Blog](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [MCP Specification (Nov 2025)](https://modelcontextprotocol.io/specification/2025-11-25)
- [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/)
- [Introducing OpenAI Frontier](https://openai.com/index/introducing-openai-frontier/)
- [Introducing AgentKit | OpenAI](https://openai.com/index/introducing-agentkit/)
- [Agentic Commerce Protocol (GitHub)](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol)
- [Stripe: Agentic Commerce](https://stripe.com/blog/developing-an-open-standard-for-agentic-commerce)
- [OpenClaw, OpenAI and the Future (steipete.me)](https://steipete.me/posts/2026/openclaw)
- [Snyk ToxicSkills Report](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
- [SkillsMP](https://skillsmp.com)
- [GPT Store Analysis (Medium)](https://medium.com/@ginozambe/was-the-gpt-store-a-failure-d2a2379fdfc1)
- [Poe Creator Monetization](https://creator.poe.com/docs/resources/creator-monetization)
- [AIOS (GitHub)](https://github.com/agiresearch/AIOS)
- [Simon Willison: Agent Skills](https://simonwillison.net/2025/Dec/19/agent-skills/)
