# Features

## Priority Tiers

### P0 — MVP (Must ship in 6 weeks)

**Marketplace**
- [ ] Landing page with bento grid of featured Agents
- [ ] Discovery page with search and category filtering
- [ ] Agent preview page/drawer
- [ ] Google OAuth login
- [ ] One-click "Hire" flow with Agent provisioning
- [ ] Credit system: free trial (50 credits), Basic ($9), Pro ($29), Power ($79)
- [ ] Credit top-up purchases

**Workspace**
- [ ] Dashboard home with stats and quick actions
- [ ] Projects and Teams hierarchy
- [ ] Agent library within a Team
- [ ] Web chat interface with streaming responses
- [ ] Real-time tool use visibility (thinking, searching, coding)
- [ ] Agent status page (online/suspended/stopped)
- [ ] Usage dashboard (credits consumed, breakdown by Agent)
- [ ] Billing page (plan management, payment method, invoices)

**Platform**
- [ ] GitHub OAuth login for creators
- [ ] "Import from GitHub" flow (Vercel-style)
- [ ] Repo validation (agent.yaml, .skills/, openagents.yaml, README.md)
- [ ] Split-panel editor (Monaco YAML + live card preview)
- [ ] Agent publishing with security scan
- [ ] Creator dashboard (earnings, users, sessions)
- [ ] Stripe Connect onboarding for payouts

**Infrastructure**
- [ ] Fly.io Machine provisioning per user-Agent pair
- [ ] Suspend/resume for cost management
- [ ] SSE proxy from Vercel → Fly.io gateway → Agent machine
- [ ] Supabase RLS for multi-tenant isolation
- [ ] Trigger.dev jobs: provisioning, health checks, idle shutdown, billing aggregation
- [ ] Skill signing pipeline (Ed25519)

### P1 — Post-Launch (Month 2-3)

**Relay Integrations**
- [ ] Telegram bot integration (webhook-based)
- [ ] Agent status page: configure relay connections
- [ ] Per-user relay routing (Telegram user → correct Fly.io machine)

**Power User Features**
- [ ] VS Code-style file tree in Agent status page
- [ ] Monaco editor for Agent config files (SOUL.md, skills, agent.yaml)
- [ ] SSH access: give Agent your SSH credentials, it can control your PC
- [ ] SSH audit log: every command the Agent ran on your machine
- [ ] Model selection per Agent (Claude/GPT/Gemini/auto)
- [ ] Custom skill installation (upload SKILL.md)

**Marketplace Enhancements**
- [ ] Ratings and reviews system
- [ ] "Today's Picks" editorial curation
- [ ] Agent collections / lists
- [ ] Creator profiles

### P2 — Growth (Month 3-6)

**More Relays**
- [ ] WhatsApp Business API integration
- [ ] Slack bot integration
- [ ] Discord bot integration (HTTP interactions + Gateway WebSocket)

**Group Chat & Multi-Agent**
- [ ] Group chat with multiple Agents (Claude Cowork-style)
- [ ] @mention Agents by name
- [ ] Agent-to-agent communication within a Team
- [ ] Team-level shared memory

**Self-Improving Agents**
- [ ] Runtime skill discovery and installation
- [ ] Automatic model switching based on task complexity
- [ ] User preference learning (persistent across sessions)
- [ ] Performance self-optimization

**Creator Tools**
- [ ] Per-Agent analytics (detailed)
- [ ] A/B testing for Agent descriptions
- [ ] Webhook notifications for new hires and reviews
- [ ] Agent versioning (like app updates)

### P3 — Ecosystem (Month 6+)

**Enterprise**
- [ ] Team management (invite members to a Project)
- [ ] Role-based access control
- [ ] SSO/SAML
- [ ] Usage quotas per team member
- [ ] Invoice billing

**Ecosystem**
- [ ] `.skills` package format specification
- [ ] Skill marketplace (within the Agent marketplace)
- [ ] Agent-to-agent marketplace discovery (A2A Agent Cards)
- [ ] /.well-known/agent-card.json for every published Agent
- [ ] API for programmatic Agent management
- [ ] CLI tool for creators

**Advanced**
- [ ] BYOK (Bring Your Own API Key) for power users
- [ ] Custom domain per Agent (agent-name.openagents.app)
- [ ] White-label deployments
- [ ] Agent marketplace API (third parties can embed our marketplace)

---

## Feature: SSH Access (P1)

One of the most powerful features. Users can give their Agent SSH credentials, and the Agent (running in Fly.io cloud) can SSH into the user's actual PC and run commands.

**How it works:**
1. User goes to Agent status page → SSH Access section
2. Enters: hostname, port, username, SSH private key
3. Credentials are encrypted and stored in Supabase Vault (pgsodium)
4. The Agent's OpenClaw instance receives the SSH config as a tool
5. When the Agent needs to run a command on the user's machine, it uses the SSH tool
6. Every SSH command is logged in an audit trail visible to the user

**Security:**
- Credentials never leave Supabase Vault unencrypted
- Agent can only SSH when explicitly requested by the user in conversation
- Audit log shows every command with timestamp
- User can revoke access instantly (deletes credentials from Vault)
- Rate limiting: max 10 SSH commands per minute

**Use cases:**
- "Deploy my latest code to production"
- "Check the logs on my server"
- "Install this package on my machine"
- "Run the test suite and tell me what failed"

---

## Feature: VS Code File Tree (P1)

Power users can browse and edit their Agent's configuration files directly in the browser.

**How it works:**
1. Agent status page shows a collapsible "Configuration" section
2. Clicking it reveals a VS Code-style file tree of the Agent's `/data` directory
3. Files are fetched via the Fly.io Machine exec API or a custom HTTP endpoint on the Agent
4. Clicking a file opens it in a Monaco editor (same engine as VS Code)
5. Save writes the file back to the Agent's volume
6. Changes take effect immediately (OpenClaw watches for config changes)

**Visible files:**
```
/data/
  ├── openclaw.json          # Agent configuration
  ├── SOUL.md                # Personality definition
  ├── IDENTITY.md            # External presentation
  ├── USER.md                # User context
  ├── MEMORY.md              # Persistent memory
  ├── agent.yaml             # Agent capabilities
  └── skills/
      ├── web-search/
      │   └── SKILL.md
      ├── code-review/
      │   └── SKILL.md
      └── ...
```

**Security:**
- Only the user who hired the Agent can see/edit files
- Some files are read-only (system files, signed skills)
- Editor has syntax highlighting for YAML, Markdown, JSON
