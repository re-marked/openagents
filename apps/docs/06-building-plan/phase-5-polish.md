# Phase 5: Polish + Security + Relay (Week 5)

## Goal
Production-quality security, first relay integration (Telegram), and UX polish.

---

## Day 1-2: Skill Signing Pipeline

### Signing Infrastructure
- [ ] Generate Ed25519 key pair (platform signing key)
- [ ] Store private key in environment (Trigger.dev, never in browser)
- [ ] Public key published at `openagents.com/.well-known/skill-signing-key`

### Signing Flow
- [ ] On Agent publish (after security scan passes):
  - Hash all SKILL.md contents + declared permissions
  - Sign hash with platform Ed25519 private key
  - Store signature in `skill_signatures` table
- [ ] Runtime verification: modify OpenClaw base image to check signatures at boot
- [ ] If signature mismatch: refuse to load skill, alert platform

### Agent Status Page (Power User Features)
- [ ] VS Code-style file tree showing Agent's /data directory
- [ ] Click file → opens in Monaco Editor
- [ ] Save → writes file to Agent's Fly.io Volume (via Machine exec API)
- [ ] Read-only indicator for signed/system files
- [ ] Changes take effect on next Agent restart (or immediately for some files)

---

## Day 3: Telegram Integration

### Bot Setup
- [ ] Create Telegram bot via BotFather
- [ ] Register webhook: `POST /setWebhook` → Supabase Edge Function URL
- [ ] Edge Function: receive update → immediate 200 → enqueue message

### Relay Connection Flow
- [ ] Agent status page → "Connect Telegram" button
- [ ] Generate unique link: `https://t.me/OpenAgentsBot?start={token}`
- [ ] User clicks link → Telegram opens → sends /start
- [ ] Bot receives token → validates → creates relay_connection in Supabase
- [ ] From now on: Telegram messages from this user route to this Agent

### Message Processing
- [ ] Trigger.dev task: receive Telegram message → look up relay_connection → get Machine
- [ ] If Machine suspended: auto-start (send "Waking up your assistant..." first)
- [ ] Forward message to Machine via 6PN
- [ ] Collect full response (no streaming on Telegram)
- [ ] Send response via Telegram Bot API
- [ ] Send `chatAction("typing")` while Agent is processing
- [ ] Split long responses into multiple messages (4096 char limit)

### Testing
- [ ] Test full flow: user connects Telegram → sends message → gets response
- [ ] Test with suspended machine (verify wake-up message appears)
- [ ] Test with non-connected user (show "Link your account" message)

---

## Day 4-5: UX Polish + Performance

### Landing Page
- [ ] Hero animation (TRAE.ai-style or subtle particle effect)
- [ ] Bento grid with real data (top agents, trending, new)
- [ ] Social proof section (user count, session count, creator count)
- [ ] Footer: links, privacy, terms

### Performance
- [ ] Pre-warm pool: 10 suspended machines in iad region
- [ ] Agent card image optimization (next/image, WebP)
- [ ] Skeleton loading states on every data-fetching page
- [ ] Suspense boundaries for streaming data
- [ ] Database query optimization (check slow query log)

### Mobile
- [ ] Test all pages on mobile (375px width)
- [ ] Chat interface mobile-optimized (full screen, bottom input)
- [ ] Marketplace cards responsive (1-column on mobile)
- [ ] Touch targets ≥ 44px

### Error Handling
- [ ] Global error boundary
- [ ] Network error states (retry button)
- [ ] Machine error recovery (auto-restart on health check failure)
- [ ] Credit insufficient state (clear upgrade CTA)
- [ ] Rate limiting (per-user, prevent abuse)

### Reviews System
- [ ] Submit review: 1-5 star rating + optional text
- [ ] One review per user per Agent
- [ ] Reviews displayed on Agent preview page
- [ ] Average rating updated (denormalized in agents table)

---

## End of Week 5 Checklist

- [ ] Skill signing pipeline active (Ed25519)
- [ ] VS Code file tree on Agent status page (power users)
- [ ] Telegram relay working end-to-end
- [ ] Landing page polished with real data
- [ ] Mobile responsive on all pages
- [ ] Pre-warm pool active (fast first-hire experience)
- [ ] Reviews system working
- [ ] Error handling comprehensive
