# Monetization Model

## Philosophy

Users spend credits, not dollars. Credits are psychological — spending 20 credits feels lighter than spending $0.20. Pre-purchasing credits creates commitment. Monthly refresh creates urgency.

The model is inspired by **Apify** (credit-based compute marketplace) and **Poe** (creator-set pricing). We reject the **GPT Store** model (opaque engagement bonuses) because it destroyed creator trust.

---

## Credit System

### What is a Credit?

1 credit = $0.01 of platform value. Credits are the universal currency across OpenAgents.

### How Credits Are Consumed

| Session Type | Credits | Description | Example |
|-------------|---------|-------------|---------|
| Quick task | 5 | Short Q&A, simple lookup | "What's the weather in Tokyo?" |
| Standard session | 20 | 10-minute conversation with tool use | "Research competitors for my startup" |
| Deep work | 60 | 30-minute intensive session | "Review this codebase and write tests" |
| Background task | 3/10min | Scheduled monitoring, overnight work | "Watch this stock and alert me" |

These labels are shown to users. Not "tokens" or "compute units" — just "Quick task" vs "Deep work."

Estimated cost is shown BEFORE each session starts. Users always know what they'll spend.

### Credit Cost Stack (internal)

For a standard 20-credit ($0.20) session:
```
Raw compute cost (10 min, shared-cpu-1x):      $0.00073
LLM tokens (~30K in, ~15K out, Claude Sonnet):  $0.00032
Platform overhead (ops, bandwidth, support):     +50% → $0.00157
                                                 ─────────────
Total cost:                                      $0.00157
Revenue:                                         $0.20
Gross margin:                                    ~99.2%
```

This extreme margin is intentional — it provides headroom for:
- LLM price volatility (2-3x increase buffer)
- Free trial costs
- Customer support
- Infrastructure scaling
- Creator payouts (80-85% of session revenue goes to creator)

After creator payout (80% of $0.20 = $0.16), platform keeps $0.04. Still healthy.

---

## Subscription Plans

### Free Trial (no card required)
- **50 credits** on signup
- Expires in **7 days**
- Enough for ~2-3 standard sessions
- Goal: get user to first "aha moment"
- Requires Google OAuth (reduces abuse vs. email-only)

### Basic — $9/month
- **1,000 credits/month** (~50 standard sessions)
- Credits refresh monthly (do not roll over)
- For casual users who use 1-2 Agents occasionally

### Pro — $29/month
- **4,000 credits/month** (~200 standard sessions)
- Credits roll over up to 500
- Priority container resume (warm pool allocation)
- For regular users with a few active Agents

### Power — $79/month
- **15,000 credits/month** (~750 standard sessions)
- Credits roll over up to 2,000
- Priority container resume
- Extended session limits
- SSH access feature
- For power users and small teams

### Credit Top-Ups (available to all plans)

| Bundle | Price | Credits | Per-Credit Cost |
|--------|-------|---------|----------------|
| Starter | $5 | 600 | $0.0083 |
| Regular | $15 | 2,000 | $0.0075 |
| Value | $40 | 6,000 | $0.0067 |
| Bulk | $100 | 18,000 | $0.0056 |

Top-up credits **never expire** (unlike subscription credits). This is the loyalty reward.

---

## Free Discovery Mechanisms

Not all usage costs credits. To drive discovery:

- **Marketplace browsing:** Free. Browse, search, read descriptions, check reviews — no credits consumed.
- **Agent preview:** First 2 messages with any NEW Agent = free (platform absorbs cost). Max 5 different Agents per user per month on free preview.
- **Featured Agents program:** Platform negotiates reduced credit cost for homepage-featured Agents (platform subsidizes the difference).

---

## Payment Infrastructure

```
┌─────────────────────────────────────────────────┐
│                   USER PAYS                      │
│                                                  │
│  Stripe Checkout / Stripe Billing                │
│  ├── Subscription plan billing                   │
│  ├── Credit top-up one-time purchases            │
│  └── Invoice generation                          │
│                                                  │
│  (Polar.sh considered but prohibited for         │
│   marketplace models per their AUP)              │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              PLATFORM EARNS                      │
│                                                  │
│  Stripe (platform account)                       │
│  └── All revenue flows into platform account     │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              CREATOR EARNS                       │
│                                                  │
│  Stripe Connect Express (creator connected acct) │
│  └── Monthly transfer: 80-85% share after        │
│      compute cost deduction                      │
└─────────────────────────────────────────────────┘
```

### Why Not Polar.sh?

Polar.sh's Acceptable Use Policy explicitly prohibits: "Marketplaces: Selling others' products or services using Polar against an upfront payment or with an agreed upon revenue share."

Polar.sh is great for solo SaaS billing, but cannot be used for a two-sided marketplace with creator payouts. We use Stripe directly for user billing and Stripe Connect Express for creator payouts.

---

## Keep-Alive Economics (The Aternos Insight)

Like Aternos (free Minecraft servers), we manage container lifecycle to control costs:

- **Free trial users:** Cold-started containers (3-5 second startup). Acceptable for trial.
- **Basic plan:** Containers suspended after 30 minutes of inactivity. ~500ms resume.
- **Pro/Power plan:** Containers suspended after 2 hours of inactivity. ~500ms resume. Priority warm pool.
- **No activity for 24 hours:** Container stopped completely (1-3 second restart).
- **No activity for 7 days:** Container preserved but deprioritized.

Storage cost per suspended Agent: ~$0.075/month (negligible).

---

## Revenue Projections (Conservative)

| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Users | 500 | 5,000 | 25,000 |
| Paid users (10%) | 50 | 500 | 2,500 |
| Avg. revenue/paid user | $15 | $20 | $22 |
| Gross revenue | $750 | $10,000 | $55,000 |
| Creator payouts (80%) | $600 | $8,000 | $44,000 |
| Platform revenue | $150 | $2,000 | $11,000 |
| Infra costs | $100 | $800 | $3,500 |
| Net | $50 | $1,200 | $7,500 |

These are conservative. The key metric is **paid conversion rate** — industry benchmark for freemium is 2-5%, we target 10% with the credit trial funnel.
