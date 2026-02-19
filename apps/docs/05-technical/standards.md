# Standards & Formats

## The Three Standards That Matter

### 1. SKILL.md — How Agents Learn Capabilities

**Origin:** Anthropic (Dec 2025), open standard (Apache 2.0)
**Adopted by:** Claude Code, OpenAI Codex CLI, ChatGPT, Cursor, VS Code Copilot, OpenClaw
**Spec:** agentskills.io/specification

SKILL.md is to AI agents what `.app` is to macOS — the universal package format. A Skill teaches an Agent how to do something specific.

```markdown
---
name: web-research
description: |
  Use when the user asks to research a topic on the web.
  Searches multiple sources, cross-references, and summarizes.
metadata:
  author: "OpenAgents Team"
  version: "1.0.0"
allowed-tools:
  - Bash
  - WebSearch
  - Read
  - Write
---

# Web Research Skill

## When to Use
Activate when the user asks to research, investigate, or find information about any topic.

## Process
1. Break the research question into 3-5 sub-queries
2. Search each sub-query using WebSearch
3. Cross-reference findings across sources
4. Write a structured summary with citations

## Output Format
Always provide:
- Executive summary (2-3 sentences)
- Key findings (bullet points)
- Sources (with URLs)
```

### OpenClaw Extended Fields (superset, backward compatible)
```yaml
requires:
  tools: ["exec", "web_search"]
  binaries: ["curl", "jq"]
  env: ["SEARCH_API_KEY"]
install: "npm install -g search-cli"
user-invocable: true
command-dispatch: "/research"
emoji: "🔍"
```

### The `.skills` Package (OpenAgents Extension)

OpenAgents extends SKILL.md with a `.skills` compressed package format:

```
agent-name.skills.tar.gz
├── manifest.json         # Package metadata + signatures
├── skills/
│   ├── web-research/
│   │   └── SKILL.md
│   ├── code-review/
│   │   ├── SKILL.md
│   │   └── scripts/
│   │       └── lint.sh
│   └── data-analysis/
│       ├── SKILL.md
│       └── references/
│           └── pandas-cheatsheet.md
└── signatures/
    └── manifest.sig      # Ed25519 signature
```

**Why a package format?**
- Single file to distribute (like `.ipa` or `.apk`)
- Cryptographic signing covers all skills in the package
- Versioned as a unit (Agent v1.2.0 includes specific skill versions)
- Recognizable everywhere: OpenAgents, Claude Code, VS Code, OpenClaw

---

### 2. MCP — How Agents Connect to Tools

**Origin:** Anthropic (Nov 2024), donated to Linux Foundation (AAIF)
**Stats:** 97M+ monthly SDK downloads, 10K+ active servers
**Role:** Agent → tool/data connection (not agent → agent)

MCP defines how an Agent connects to external tools and data sources. It's the USB port of the AI world.

OpenClaw natively supports MCP. Agents on OpenAgents can use any MCP server:
- File system access
- Database queries
- API integrations (GitHub, Slack, Google Workspace)
- Web browsing

**OpenAgents doesn't need to implement MCP** — OpenClaw handles it. We just need to:
- Allow creators to declare MCP servers in their agent.yaml
- Ensure the container has network access to reach the MCP servers
- Document available MCP servers for creators

---

### 3. A2A — How Agents Talk to Each Other (Future)

**Origin:** Google (Apr 2025), merged with IBM ACP under Linux Foundation
**Role:** Agent → agent communication

A2A defines how agents discover and communicate with each other. Every A2A-compatible agent publishes an Agent Card at `/.well-known/agent-card.json`.

**Future OpenAgents integration:**
- Every published Agent gets an Agent Card automatically
- Agents within a Team can discover each other via A2A
- External A2A agents can discover OpenAgents Agents
- Enables: Google agents delegating tasks to OpenAgents Agents

---

## OpenAgents-Specific Formats

### openagents.yaml — Marketplace Metadata

This file lives in the creator's GitHub repo alongside agent.yaml. It defines how the Agent appears on the marketplace.

```yaml
# openagents.yaml — marketplace metadata
name: "Legal Document Reviewer"
slug: "legal-doc-reviewer"
tagline: "Review contracts, NDAs, and legal docs in minutes"
description: |
  A thorough legal document reviewer that analyzes contracts,
  identifies potential issues, and suggests improvements.
  Trained on thousands of legal templates.

category: "business" # productivity | research | writing | coding | business | creative | personal
icon: "./assets/icon.png" # 512x512 PNG

# Pricing
pricing:
  model: "per_session" # per_session | per_task | free
  credits: 30 # credits per session (null if free)

# Capabilities shown on marketplace card
capabilities:
  - "Contract analysis"
  - "Risk identification"
  - "Clause comparison"
  - "Plain English summaries"

# Supported relays
relays:
  - telegram
  - slack

# Model requirements
models:
  primary: "claude" # claude | gpt | gemini | any
  minimum: "claude-sonnet" # minimum model quality

# Screenshots/examples for the Agent preview page
screenshots:
  - path: "./assets/screenshot-1.png"
    caption: "Analyzing a commercial lease agreement"
  - path: "./assets/screenshot-2.png"
    caption: "Risk assessment summary"

# Tags for search
tags:
  - legal
  - contracts
  - compliance
  - business

# Version
version: "1.0.0"
```

### agent.yaml — Agent Capabilities (Platform-Agnostic)

This is the OpenClaw-compatible agent configuration. It defines what the Agent CAN do, not how it appears on the marketplace.

```yaml
# agent.yaml — platform-agnostic agent config
agents:
  - id: main
    name: "Legal Document Reviewer"
    workspace: "./workspace"
    tools:
      profile: "research" # coding | research | creative | minimal
      allow:
        - exec
        - web_search
        - file_read
        - file_write
      deny:
        - browser # no browser automation needed
    skills:
      allow_bundled:
        - document-analysis
        - legal-research
      entries:
        document-analysis:
          enabled: true
        legal-research:
          enabled: true

model:
  primary: "anthropic/claude-sonnet-4-6"
  fallbacks:
    - "openai/gpt-4o"

sandbox:
  mode: "always" # run all tool calls in sandbox
  scope: "session"
  workspace: "rw"
```

### Repository Structure (Creator's Repo)

```
my-agent/
├── agent.yaml              # REQUIRED: agent capabilities
├── openagents.yaml         # REQUIRED: marketplace metadata
├── README.md               # REQUIRED: documentation
├── .skills/                # REQUIRED: skill packages
│   ├── document-analysis/
│   │   └── SKILL.md
│   └── legal-research/
│       ├── SKILL.md
│       └── references/
│           └── legal-terms.md
├── SOUL.md                 # Personality definition
├── IDENTITY.md             # External presentation
├── assets/                 # Icons, screenshots
│   ├── icon.png
│   └── screenshot-1.png
└── .github/
    └── workflows/          # Optional: CI for the agent
```

**What's NOT in the repo:** OpenClaw itself. The creator only provides configuration. OpenAgents provides the runtime.
