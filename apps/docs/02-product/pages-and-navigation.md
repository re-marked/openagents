# Pages & Navigation

## Navigation Structure

```
Site Header (always visible):
  [Logo: OpenAgents]  [Discover]  [Workspace]  [Login/Avatar]

Workspace Sidebar (visible in /workspace):
  [Home]
  [Projects]
    └─ [Project Name]
       └─ [Teams]
          ├─ [Team A]
          │  ├─ Agents
          │  ├─ Chat
          │  └─ Settings
          └─ [Team B]
  [Usage]
  [Settings]
```

---

## PUBLIC PAGES

### `/` — Landing Page
**Purpose:** Convert visitors to sign-ups.

- Big title + logo + captivating animation (TRAE.ai-style)
- Tagline: "Hire an AI assistant for anything."
- CTA: "Browse Assistants" → `/discover`
- Scroll down: Apple-style bento grid
  - "Today's Top Assistants"
  - "OpenAgents Team Picks"
  - "Trending This Week"
  - "New Arrivals"
- Each card links to Agent preview or `/discover` with filter
- **No sidebar.** Site header only: [Discover] [Workspace]

### `/discover` — The Marketplace
**Purpose:** Browse and search Agents. The core of the product.

- First visit: large search input (Namecheap-style). "What do you need help with?"
- After search: grid of Agent cards matching query
- Category chips/tabs: "Productivity", "Research", "Writing", "Coding", "Business", "Creative", "Personal"
- Each card shows: Agent icon, name, tagline, rating, price (free / X credits), creator name
- Clicking a card → Agent preview (drawer or dedicated page)
- **Full screen.** No sidebar. Site header with category navigation.
- Filters: free/paid, rating, category, model compatibility
- Sort: trending, newest, highest rated, most hired

### `/agents/:id` — Public Agent Preview
**Purpose:** Convince the user to hire this Agent.

- Hero section: Agent icon (large), name, tagline, creator badge
- "Hire This Assistant" CTA button (one click)
- Tabs: Overview | Skills | Reviews | Creator
- **Overview:** Long description, screenshots/examples of what the Agent can do, supported relays (Telegram, WhatsApp, etc.)
- **Skills:** List of installed skills with descriptions (what the Agent can do)
- **Reviews:** User ratings and written reviews
- **Creator:** Creator profile, other Agents by this creator
- Price display: "Free" or "X credits per session" or "Included in Pro"
- Could also be a large drawer over `/discover` instead of a full page

### `/login` — Login Page
- Social buttons: Google, GitHub, Apple (optional later: X)
- Toggle between "Sign In" and "Create Account"
- Clean, centered, minimal

### `/privacy` — Privacy & Legal
- Privacy policy, terms of service, acceptable use policy

### `/upgrade-plan/:tier` — Marketplace Plans
- `/upgrade-plan/basic` — $9/mo
- `/upgrade-plan/pro` — $29/mo
- `/upgrade-plan/power` — $79/mo
- Comparison table, feature list, CTA

### `/purchase/agent/:id` — Purchase a Paid Agent
- Confirmation screen before hiring a paid Agent
- Shows: Agent name, price in credits, what you get
- "Hire Now" button → deducts credits, provisions machine

---

## WORKSPACE PAGES

### `/workspace/home` — Dashboard
**Purpose:** Welcome back, show next actions and overview.

- Greeting: "Good morning, [Name]"
- Quick stats: active Agents, credits remaining, sessions this week
- Recent activity feed: last conversations, Agent status changes
- Quick actions: "Hire a new Assistant", "Chat with [last Agent]"
- **Has sidebar + site header.**

### `/workspace/project/:id/team/:id/agents` — Agent Library
**Purpose:** Your hired Agents in this Team.

- Grid of Agent cards (your instances, not marketplace cards)
- Each card: Agent icon, name, status (online/suspended/stopped), last active
- "+" card that links to `/discover`
- Click an Agent → `/workspace/project/:id/team/:id/agents/:id` (status page)
- **Has sidebar + site header.**

### `/workspace/project/:id/team/:id/chat` — The Chat Hub
**Purpose:** Chat with your Agent team. THE core experience.

- Group chat interface (like Claude Cowork / Slack)
- Left panel: conversation list (individual agents + group chats)
- Right panel: message stream
- @mention agents by name in group chat
- File attachments (drag and drop)
- See agent "thinking" / tool use in real-time (collapsible sections)
- Model selector per message (optional, power user)
- **Full screen chat layout. Sidebar collapses.**

### `/workspace/project/:id/team/:id/agents/:id` — Agent Status Page
**Purpose:** Monitor and manage a specific Agent instance.

- Status: Online / Suspended / Stopped (with indicator)
- Quick actions: Restart, Stop, Change Model
- Connected relays: which platforms this Agent is connected to (Telegram, Slack, etc.)
- Recent logs: last 50 messages (summarized)
- Usage stats: sessions this week, credits consumed, uptime
- **Configuration section (power users):**
  - VS Code-style file tree showing the Agent's config files
  - Click a file → Monaco editor opens
  - Editable files: SOUL.md, IDENTITY.md, USER.md, agent.yaml, skills/*
  - Changes are saved directly to the Agent's Fly.io volume
  - "These are YOUR files — you hired this Agent, you own its configuration"
- **SSH Access section (power users):**
  - "Give this Agent access to your computer"
  - Input: SSH host, port, username, key (stored encrypted in Supabase Vault)
  - When configured, the Agent can SSH into your machine and run commands
  - Status: Connected / Disconnected / Last connected at [time]
  - Audit log: every SSH command the Agent ran

### `/workspace/settings` — User Settings
- Profile (name, avatar, email)
- Connected accounts (Google, GitHub)
- Notification preferences
- Default relay settings
- Danger zone: delete account

### `/workspace/project/:id/settings` — Project Settings
- Project name, description
- Members (if shared Project — future feature)
- Default Team

### `/workspace/project/:id/team/:id/settings` — Team Settings
- Team name
- Default Agent for new conversations
- Relay configuration for the Team

### `/workspace/project/:id/team/:id/agents/:id/settings` — Agent Settings
- Display name (override marketplace name)
- Model preference (Claude/GPT/Gemini/auto)
- Personality tweaks (verbosity, formality, language)
- Connected relays
- Credit limit per session
- SSH configuration
- Skill management (add/remove skills)

### `/usage` — Usage Dashboard
**Purpose:** Claude.ai-style usage overview.

- Credit balance (prominently displayed)
- Usage chart: credits consumed per day/week/month
- Breakdown by Agent: which Agents consumed how many credits
- Breakdown by type: compute vs. tokens
- "Buy Credits" CTA
- Plan info: current plan, renewal date, included credits

### `/settings/billing` — Billing
- Current plan
- Payment method
- Invoice history
- "Change Plan" / "Cancel Plan"
- Credit purchase history

---

## PLATFORM PAGES (platform.openagents.com)

### `/` — Platform Landing
- Explains what OpenAgents is for developers/creators
- Revenue share info: "Earn 85% of every session"
- "Start Building" CTA → login

### `/login` — Platform Login
- GitHub OAuth (primary — needed for repo connection)
- Google OAuth (secondary)
- Redirects to `/dashboard` after login

### `/dashboard` — Creator Dashboard
- Overview: total earnings (this month / all time), active Agents, total users
- Revenue chart: daily/weekly/monthly earnings
- Quick actions: "Publish New Agent", "View Analytics"
- Recent activity: new hires, reviews, usage spikes

### `/agents` — Your Published Agents
- List view: all your published Agents
- Status: published / draft / under review / rejected
- Quick stats per Agent: users, sessions, revenue

### `/agents/publish` — Publish New Agent
**Purpose:** Connect a GitHub repo and publish an Agent. Dead simple, Vercel-like.

**Step 1: Connect Repo**
- GitHub repo selector (like Vercel's import flow)
- Auto-validates repo structure:
  - `agent.yaml` present (required)
  - `.skills/` folder present (required)
  - `openagents.yaml` present (required — marketplace metadata)
  - `README.md` present (required)
  - Validation errors shown inline with fix suggestions

**Step 2: Configure (Split Panel Editor)**
- **Right panel:** Live card preview (exactly how users will see it on the marketplace)
- **Left panel:** Monaco YAML editor for `openagents.yaml`
- Changes in either panel sync to the other in real-time
- Fields: name, description, tagline, icon, category, pricing, supported relays, model requirements
- "Visual mode" toggle: edit directly on the card preview (drag to reorder, click to edit text)

**Step 3: Review & Publish**
- Summary of what will be published
- Security scan results (auto-run on submission)
- "Publish" button → Agent enters review queue (initially: auto-approve with scan, manual review for flagged items)

### `/agents/:id/analytics` — Per-Agent Analytics
- Sessions chart (daily/weekly)
- Unique users (new vs. returning)
- Revenue breakdown (credits consumed, creator earnings)
- Average session duration
- User ratings distribution
- Top skills used
- Churn: users who hired then stopped using

### `/settings` — Creator Settings
- Profile (name, bio, avatar, website)
- Connected GitHub account
- Stripe Connect setup (for payouts)
- Payout history
- API keys (future: programmatic Agent management)

### `/docs` — Developer Documentation (docs.openagents.com)
- Complete guide on building Agents for the marketplace
- `agent.yaml` reference
- `openagents.yaml` reference
- `.skills` format reference
- SKILL.md specification
- API reference (future)
- Best practices: security, performance, user experience
