# Phase 4: Platform (Week 4)

## Goal
Developers can publish Agents on the marketplace. The creator economy starts.

---

## Day 1-2: Platform Shell + GitHub Integration

### Platform Routing
- [ ] Subdomain routing: `platform.openagents.com` → Platform pages
- [ ] Platform layout: different nav, creator-focused
- [ ] Platform login: GitHub OAuth (primary), Google (secondary)
- [ ] Creator role assignment on Platform signup

### GitHub Integration
- [ ] GitHub App creation (for repo access)
- [ ] "Import from GitHub" flow (list user's repos, select one)
- [ ] Repo validation on selection:
  - Check for `agent.yaml` → show green/red
  - Check for `.skills/` directory → show green/red
  - Check for `openagents.yaml` → show green/red (or offer to create)
  - Check for `README.md` → show green/red
- [ ] Inline fix suggestions: "Missing agent.yaml — here's a template"
- [ ] GitHub webhook registration for push events (auto-update on push)

---

## Day 3: Split-Panel Editor

### The YAML + Card Preview Editor
- [ ] Left panel: Monaco Editor loading `openagents.yaml` from repo
- [ ] Right panel: Live Agent card preview (exactly matches marketplace card)
- [ ] Real-time sync: edit YAML → card updates instantly
- [ ] Visual mode: click on card elements to edit (name, tagline, description, icon)
- [ ] Visual edits → YAML updates automatically
- [ ] Category selector dropdown
- [ ] Icon upload (resize to 512x512, store in Supabase Storage)
- [ ] Pricing configuration (per_session / per_task / free + credit amount)
- [ ] Save: commit openagents.yaml back to GitHub repo (via GitHub API)

### Monaco Editor Config
- [ ] YAML syntax highlighting
- [ ] Schema validation (red squiggles for invalid fields)
- [ ] Autocomplete for known fields (name, slug, category, pricing, etc.)
- [ ] Dark/light theme matching the app

---

## Day 4: Publishing Pipeline

### Security Scan
- [ ] On publish: clone repo, scan all SKILL.md files
- [ ] Semgrep rules for common injection patterns
- [ ] Check for suspicious tool declarations
- [ ] If dependencies: run Snyk scan (npm audit / pip audit)
- [ ] Show scan results to creator (green checkmarks / red warnings)
- [ ] Auto-approve if all checks pass, queue for manual review if warnings

### Docker Image Build
- [ ] Build Docker image: base OpenClaw + creator's config files
- [ ] Push to Fly.io registry
- [ ] Store image reference in `agents` table

### Publishing
- [ ] Creator clicks "Publish" → status changes to "published"
- [ ] Agent appears on marketplace immediately (if auto-approved)
- [ ] Creator notified: "Your Agent is live!"
- [ ] Initial stats: 0 hires, 0 reviews

---

## Day 5: Creator Dashboard + Stripe Connect

### Creator Dashboard
- [ ] Earnings overview: this month, all time
- [ ] Earnings chart (daily)
- [ ] Per-Agent breakdown: users, sessions, revenue
- [ ] Published Agents list with status

### Stripe Connect Onboarding
- [ ] Stripe Connect Express onboarding flow
- [ ] KYC verification (Stripe handles)
- [ ] Bank account linking
- [ ] Payout status: "connected" / "pending verification"
- [ ] Payout history table

### Monthly Payout Job
- [ ] Trigger.dev cron (1st of each month)
- [ ] Aggregate creator_earnings where paid_out=false
- [ ] For each creator above $25 threshold: create Stripe transfer
- [ ] Mark records as paid_out=true
- [ ] Send email notification to creator

---

## End of Week 4 Checklist

- [ ] Creator can connect GitHub repo
- [ ] Repo validation with clear error messages
- [ ] Split-panel editor: YAML ↔ card preview (live sync)
- [ ] Security scan runs on publish
- [ ] Agent published and visible on marketplace
- [ ] Creator dashboard with earnings
- [ ] Stripe Connect onboarding working
- [ ] Monthly payout job configured
