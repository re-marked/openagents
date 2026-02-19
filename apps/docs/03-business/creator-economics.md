# Creator Economics

## The Promise

Publish an Agent. Users hire it. You earn money. Transparently, immediately, globally.

---

## Revenue Split

### The Formula

```
session_revenue    = credits_consumed × $0.01
compute_cost       = actual infrastructure cost (at cost, no markup)
creator_earnings   = (session_revenue - compute_cost) × creator_rate
platform_earnings  = (session_revenue - compute_cost) × (1 - creator_rate) + compute_cost
```

### Creator Tiers

| Tier | Requirement | Revenue Split | Perks |
|------|------------|---------------|-------|
| New Creator | Default | 85/15 (launch period) → 80/20 | Basic analytics |
| Verified Creator | 100+ MAU sustained, 3 months | 82/18 | Verified badge, priority review |
| Top Creator | 1,000+ MAU, 4.5+ rating | 85/15 | Featured placement, priority support |
| Partner | Negotiated | 88/12 | Co-marketing, dedicated account |

**Launch incentive:** ALL creators get 85/15 for the first 6 months. Normalizes to 80/20 with 30-day notice. Creates urgency to publish early.

### Worked Example

A creator publishes a "Legal Document Reviewer" Agent priced at 30 credits/session.

User hires it and runs 10 sessions in a month:
```
Session revenue:    10 × 30 credits × $0.01 = $3.00
Compute cost:       10 × ~$0.001 = $0.01
Remainder:          $2.99
Creator gets (85%): $2.54
Platform gets (15%):$0.45
Platform + compute: $0.46
```

If the creator has 100 active users doing 10 sessions/month each:
```
Monthly creator earnings: $254.00
Annual: $3,048
```

With 500 active users: **$1,270/month = $15,240/year**

---

## Creator Pricing Options

Creators set how their Agent charges. Three models available:

### 1. Per-Session (Default)
Creator sets a credit price per session. "This Agent costs 20 credits per session."
- Simplest to understand
- Works for: general-purpose assistants, chat-based Agents

### 2. Per-Task
Creator sets a credit price per completed task. "This Agent costs 50 credits per research report."
- Best for: Agents with discrete deliverables
- Platform enforces: credits deducted only when task completes (or after timeout)

### 3. Free (Community)
No charge. Creator publishes for reputation, portfolio, or community contribution.
- Platform still absorbs compute cost
- Creator earns nothing but gets analytics, badge, visibility
- Good for: open source creators, portfolio pieces

**Note:** We do NOT support subscription pricing per-Agent. Users already pay for OpenAgents subscription (Basic/Pro/Power). We don't want users managing multiple subscriptions. Credits are the universal currency.

---

## Payout Mechanics

### Setup
1. Creator connects Stripe account during Platform onboarding
2. Stripe Connect Express handles KYC, ID verification, tax info
3. Creator links bank account
4. Done. No ongoing maintenance.

### Schedule
- Payouts processed **monthly, on the 15th**
- Covers all earnings from the previous calendar month
- Minimum payout: **$25 USD** (if below threshold, rolls to next month)
- Stripe handles 1099 generation for US creators at $600+/year

### Supported Countries
Stripe Connect Express supports 40+ countries. Full list shown during onboarding.

Not supported: Russia, Iran, North Korea, Cuba (sanctions). Creators in unsupported countries are informed clearly during registration.

### Payout Fees
- Stripe transfer fee: 0.25% (capped at $25) per payout
- Deducted from creator's payout, not from gross
- For a $254 payout: $0.64 fee → creator receives $253.36

---

## Creator Dashboard

What creators see:

**Revenue Tab:**
- Total earnings (this month / all time)
- Daily earnings chart
- Per-Agent earnings breakdown
- Pending vs. paid out balance
- Next payout date and estimated amount

**Users Tab:**
- Total unique users
- New users this week
- Retention: users who returned after first session
- Churn: users who stopped using

**Sessions Tab:**
- Total sessions
- Average session duration
- Average credits consumed per session
- Peak usage times

**Reviews Tab:**
- Average rating
- Recent reviews (with ability to respond)
- Rating distribution (1-5 stars)

---

## Creator Acquisition Strategy

### Why Would a Developer Build for OpenAgents?

1. **Real revenue:** Unlike GPT Store ($0.03/conversation opaque bonus), our payouts are transparent and immediate. 85% of every session at launch.

2. **Existing skills work:** If you've already built SKILL.md files for Claude Code, OpenAI Codex, or OpenClaw, they work on OpenAgents with zero modifications. 200K+ existing skills.

3. **No infrastructure management:** Just define agent.yaml + skills. We handle hosting, scaling, payments, security. You focus on the Agent's capabilities.

4. **Distribution:** SEO, social proof (ratings), editorial curation, search. Your Agent gets discovered by non-technical users who would never find it on GitHub.

5. **Security badge:** Being listed on OpenAgents (with our signing and scanning) is a trust signal. "Verified by OpenAgents" means something when ClawHub has a 13.4% malware rate.

### Launch Targets

- **Month 1:** 20-30 seed Agents. Built by us, invited creators, and converted ClawHub skills.
- **Month 3:** 100+ Agents. Open Platform registration. First Verified Creators.
- **Month 6:** 500+ Agents. Top Creators earning $1,000+/month. Partner program launched.

---

## Comparison to Other Platforms

| Platform | Creator Take | Discovery | Infrastructure | Payout Timing |
|----------|-------------|-----------|---------------|--------------|
| **OpenAgents** | **85% (launch) → 80%** | **Search + curation + SEO** | **Managed (Fly.io)** | **Monthly** |
| GPT Store | ~$0.03/conv (opaque) | Broken | N/A (prompt only) | Quarterly |
| Poe | Creator-set price/msg | Moderate | N/A (prompt only) | Monthly ($10 min) |
| Apify | 80% minus compute | Good | Managed | Monthly |
| ClawHub | 0% | CLI search only | None | Never |
| App Store | 70-85% | Good | N/A | Monthly |
