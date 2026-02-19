# Agent Standards, Protocols & Platform Research
Research date: 2026-02-19

## AIOS — AI Agent Operating System (Academic)
- Repo: github.com/agiresearch/AIOS (not an industry standard — academic project)
- Paper: arxiv.org/abs/2403.16971 — accepted at COLM 2025
- Architecture: 3-tier: Application Layer (Cerebrum SDK) → Kernel Layer → Hardware Layer
- Kernel services: scheduling (FIFO/Round Robin/priority), context management (preemptive multitasking
  with LLM state preservation), memory management, storage management, access control
- AIOS v0.2 splits into AIOS Kernel repo + Cerebrum (Agent SDK) repo
- Remote Kernel: agent users can connect to remote AIOS server
- Internet of AgentSites: planet.aios.foundation — DHT + Gossip-based discovery, AgentHub + AgentChat
- Uses MCP for agent-agent and human-agent communication on AIOS Server
- NOT a production industry standard — blueprint/research system

## Agent-OS Blueprint (Academic Paper, Sept 2025)
- Preprint: preprints.org/manuscript/202509.0077
- Proposes layered architecture: Kernel → Services → Agent Runtime → Orchestration → User
- Latency classes: Hard Real-Time (HRT), Soft Real-Time (SRT), Delay-Tolerant (DT)
- "Agent Contracts" for portability and enforcement
- Described as "architectural North Star" not a realizable system today

## Amdocs aOS — Enterprise "Agentic OS" (Commercial)
- Announced: Feb 3, 2026; telco-specific, not open standard
- 3 components: Cognitive Core (LLM foundation) + CES26 (BSS/OSS/Network suite) + Agentic Operations
- Partners: NVIDIA, Microsoft, Google, AWS
- Supports 350+ operators, billions of daily transactions

## Builder Methods Agent OS (Developer Tooling)
- github.com/buildermethods/agent-os
- NOT an OS — a CLAUDE.md/spec injection system for spec-driven development
- Converts coding standards into Claude Code Skills
- v3.0 (2026) refocused as Claude Code matured

## SKILL.md — The Cross-Platform Skill Standard
- Created by: Anthropic (internal, then open-sourced Dec 18, 2025)
- Spec repo: github.com/agentskills/agentskills (Apache 2.0) + agentskills.io
- Adopted by: Anthropic Claude Code, OpenAI Codex CLI, OpenAI ChatGPT, Cursor, VS Code (GitHub Copilot),
  OpenClaw (pre-dates Anthropic standard, compatible), Microsoft

Required frontmatter fields (only 2):
  name: (1-64 chars, lowercase-hyphens, matches folder name)
  description: (when to trigger)

Optional fields:
  license, compatibility (env requirements), metadata (author, version etc.),
  allowed-tools (pre-approved tool list)

Directory structure:
  my-skill/
    SKILL.md     # required: YAML frontmatter + markdown instructions
    scripts/     # optional: executable code
    references/  # optional: additional docs
    assets/      # optional: templates, images, data

Paths:
  Claude Code: ~/.claude/skills/ (personal) or .claude/skills/ (project)
  OpenAI Codex CLI: ~/.codex/skills/
  OpenClaw: ~/.openclaw/skills/ or workspace/skills/

SkillsMP: skillsmp.com — 200K+ skills aggregated from GitHub (2-star filter), no payments
Anthropics/skills: github.com/anthropics/skills — official Anthropic skills catalog
OpenAI/skills: github.com/openai/skills — official OpenAI skills catalog

## A2A Protocol (Agent2Agent)
- Origin: Google, Apr 2025; donated to Linux Foundation
- v0.3 (Jul 2025): gRPC support, signed security cards
- Late 2025: Merged with IBM ACP under Linux Foundation
- Agent Card location: /.well-known/agent-card.json (HTTPS only, TLS 1.3+)
- Agent Card fields: name, description, version, url, capabilities, defaultInputModes,
  defaultOutputModes, skills (AgentSkill objects), authentication schemes
- Proto spec: spec/a2a.proto is normative definition
- JSON-RPC 2.0 inside HTTP POST; state via context IDs + TaskStore

## ACP (Agent Communication Protocol)
- Origin: IBM BeeAI, March 2025; donated to Linux Foundation
- REST-based (vs A2A's JSON-RPC); simpler for async/sync
- Merged with A2A late 2025 — ACP's RESTful simplicity + A2A's Agent Cards + task lifecycle
- Discovery: embedded in agent decorator; Docker registries for offline

## MCP (Model Context Protocol)
- Origin: Anthropic, Nov 2024; donated to AAIF/Linux Foundation, Dec 2025
- AAIF co-founders: Anthropic, Block, OpenAI
- 97M+ monthly SDK downloads; 10K+ active servers
- Nov 2025 spec: OAuth 2.1 auth, long-running workflows, production governance
- Clients: Claude, ChatGPT, Cursor, Gemini, Microsoft Copilot, VS Code
- Role: agent-to-tool/data (NOT agent-to-agent)

## OpenAI Platform Strategy (2026)
### AgentKit (launched Oct 2025)
- Agent Builder: visual drag-and-drop canvas, versioning, sequential/parallel node patterns
- Connector Registry: admin panel for all data connectors + MCP servers; Dropbox, Drive, SharePoint
- ChatKit: embed customizable chat experiences
- Pricing: included with standard API pricing (no extra fees as of Oct 6, 2025)

### OpenAI Frontier (launched Feb 5, 2026)
- Enterprise: build + deploy + manage agents; open platform (non-OpenAI agents too)
- Customers: HP, Intuit, Oracle, State Farm, Thermo Fisher, Uber (+ BBVA, Cisco, T-Mobile pilots)
- Pricing: undisclosed; estimated six-to-seven figure annual enterprise contracts
- Bundled: ChatGPT Enterprise/Business + Agents SDK + AgentKit
- NOT a consumer marketplace — enterprise orchestration only

### Agentic Commerce Protocol (launched Feb 16, 2026)
- Co-spec: OpenAI + Stripe; github.com/agentic-commerce-protocol/agentic-commerce-protocol
- 4% fee on completed transactions (Shopify merchants, 30-day free trial)
- Live: Etsy sellers; coming: 1M+ Shopify merchants (Glossier, SKIMS, Spanx, Vuori)
- Checkout flow: product found in ChatGPT → tap "Buy" → confirm order/shipping/payment → done

### GPT Store (lessons learned)
- 3M+ GPTs created; ~159K public and active (<<1% conversion to public)
- Revenue: ~$0.03/conversation; need 33K+ conversations/week for $1K/month
- Most creators earn <$500/month; top 0.01% earn $15K–six figures
- Minimum: 25 conversations/week, US-only, public GPT
- Key failures: broken discovery (no SEO, no social proof), creator trust destroyed (OpenAI
  can replicate any popular GPT), analytics capped at 10K chats visible
- Smart creators bypassed revenue program entirely (direct monetization via SaaS/API keys)

## agentfile (ragapp) — YAML Agent Format
- github.com/ragapp/agentfiles — run agents from single YAML file
- Superset of CrewAI YAML; fields: name, backstory, goal, role, tools
- CrewAI standard: config/agents.yaml; fields: role, goal, backstory, llm
- Google ADK: launched YAML-based agent config Aug 2025; brief description → run ADK agent
- None of these are open standards — framework-specific configs

## Security Landscape (ClawHub / Skills)
- Snyk ToxicSkills (Feb 5, 2026): scanned 3,984 skills from ClawHub + skills.sh
  - 13.4% (534 skills): critical-level issues (malware, prompt injection, exposed secrets)
  - 36.8% (1,467 skills): at least one security flaw
  - 76 confirmed malicious payloads (credential theft, backdoors, exfiltration)
  - 8 malicious skills still live on clawhub.ai at time of publication
- ClawHavoc (Jan 2026): 341 malicious skills, Atomic Stealer AMOS malware
- Barrier to publish: 1-week-old GitHub account; no code signing; no security review
- Opportunity for OpenAgents: cryptographic signing, verified publishers, security scanning
