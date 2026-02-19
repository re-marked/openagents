# Monetization Research

Research into credit-based pricing models, platform revenue sharing, payment infrastructure (Stripe, Polar.sh), creator economics, and infrastructure cost modeling.

---

## 1. Pricing Model Precedents

### 1.1 Platform Comparison

| Platform | Model | Creator Gets | Platform Gets | Compute Treatment |
|---|---|---|---|---|
| GPT Store | Engagement bonus ~$0.03/conv | Engagement bonus | Everything else | N/A (prompt only) |
| Poe | Price-per-message (creator sets) | Creator price | Processing + spread | N/A (prompt only) |
| Apify | Credit-based PAYG | 80% minus compute | 20% + compute at cost | Deducted from creator |
| HuggingFace | None | 0% | 100% | N/A |
| Apple App Store | Revenue share | 70-85% | 15-30% | N/A |
| Salesforce Agentforce | Enterprise contract | 0% (internal) | 100% | — |

**Critical distinction**: App Stores have zero per-session infrastructure cost — developers pay for build infra. Agent marketplaces have ongoing compute costs per session. Apify's "80% minus compute" is the only precedent that handles this correctly.

### 1.2 Why Credit-Based PAYG Wins

Research from m3ter, Lago, and agenticaipricing.com confirms:

- **67% of SaaS companies** now use usage-based pricing (structural shift, not trend)
- Credits create **psychological commitment** — users spend pre-purchased credits more freely than real-time dollar amounts
- Credits enable **gamification** (progress bars, "credits remaining" urgency)
- Credits **abstract volatile costs** — LLM API prices change, but 1 credit = 1 credit
- Monthly subscription credits create **pull behavior** (use-it-or-lose-it)

### 1.3 Apify Actor Store — Direct Precedent

Apify is the closest architectural precedent for OpenAgents:

- **Credit system**: 1 unit = $0.001 (configurable per Actor)
- **Creator split**: 80% of revenue after compute costs deducted
- **Compute metering**: CPU seconds + memory + data transfer, deducted at cost before split
- **Pricing flexibility**: Creators set their own per-run or per-result pricing
- **Creator Plan**: $0/month, zero platform fee on first $1,000/month, then standard split
- **Minimum payout**: Not disclosed, but monthly cycle

---

## 2. Recommended Credit System

### 2.1 Credit Economics

```
1 credit = $0.01 platform value

Cost stack for a standard 10-minute agent session:
  Raw compute (Fly.io shared-cpu-1x):  600s × $0.0044/3600  = $0.00073
  LLM tokens (~30K in, ~15K out):
    Input:  30,000 × $0.000003                               = $0.00009
    Output: 15,000 × $0.000015                               = $0.000225
  Total raw cost:                                             = $0.001045
  Platform overhead (+50%):                                   = $0.00157
  Desired margin (+67%):                                      = $0.00261

  Priced at: 20 credits ($0.20) → ~19× gross margin over raw cost
```

The 20-credit standard session gives:
- Healthy margin headroom for cost fluctuations
- Still feels "cheap" at $0.20 for 10 minutes of AI work
- Room to absorb 2-3× LLM API price increases without going negative

### 2.2 Subscription Plans

| Plan | Monthly | Credits/Month | Best For | Rollover |
|---|---|---|---|---|
| Free Trial | $0 | 50 credits (7-day expiry) | First experience | None |
| Basic | $9/month | 1,000 credits | Casual users (~50 sessions) | None |
| Pro | $29/month | 4,000 credits | Regular users (~200 sessions) | Up to 500 |
| Power | $79/month | 15,000 credits | Heavy users, power workflows | Up to 2,000 |

### 2.3 Top-Up Bundles

| Bundle | Price | Credits | Per-Credit Cost |
|---|---|---|---|
| Starter | $5 | 600 | $0.0083 |
| Regular | $15 | 2,000 | $0.0075 |
| Value | $40 | 6,000 | $0.0067 |
| Bulk | $100 | 18,000 | $0.0056 |

**Top-up credits never expire** (unlike subscription credits). This is the loyalty reward.

### 2.4 Session Cost Display

| Session Type | Credits | Example |
|---|---|---|
| Quick task | 5 credits | Answer a question, summarize a doc |
| Standard session | 20 credits | 10-minute conversation with tools |
| Deep work | 60 credits | 30-minute research or coding session |
| Background task | 3 credits/10min | Scheduled monitoring, overnight research |

Labels are non-technical. Users understand "quick task" vs "deep work", not "tokens."

### 2.5 Free Discovery (Loss Leader)

- First 2 messages with any new agent = free (platform absorbs cost)
- Cap: 5 different agents per user per month on free preview
- Cost to platform: ~$0.02 per preview (negligible)
- Browsing, reading descriptions, seeing reviews — all free (no compute)

---

## 3. Creator Revenue Model

### 3.1 Revenue Split Formula

```
session_revenue    = credits_consumed × $0.01
compute_cost       = actual_compute_cost (at cost, no markup)
creator_earnings   = (session_revenue - compute_cost) × 0.80
platform_earnings  = (session_revenue - compute_cost) × 0.20 + compute_cost
```

**Worked example (20-credit standard session):**
- Session revenue: 20 × $0.01 = $0.20
- Compute cost: ~$0.001
- Remainder: $0.199
- Creator gets: $0.199 × 0.80 = **$0.159**
- Platform gets: $0.199 × 0.20 + $0.001 = **$0.041**
- Platform gross margin: 20.5%

### 3.2 Creator Tiers

| Tier | Requirement | Split | Perks |
|---|---|---|---|
| New Creator | Default | 80/20 | — |
| Verified Creator | 100+ MAU sustained | 82/18 | Verified badge |
| Top Creator | 1,000+ MAU, 4.5+ rating | 85/15 | Featured placement, priority support |
| Partner | Negotiated | 88/12 | Co-marketing |

**Launch incentive**: All creators at 85/15 for first 6 months, normalizing to 80/20 with 30-day notice.

### 3.3 Payout Mechanics

- **Method**: Stripe Connect Express
- **Schedule**: Monthly, 15th of each month
- **Minimum**: $25 USD
- **International**: 40+ countries via Stripe Connect
- **Tax**: Stripe handles 1099 generation for US creators at $600+
- **Dashboard**: Real-time earnings display (sessions, credits consumed, earnings accrued)

### 3.4 Revenue Split Benchmarks

- **70/30** ("App Store territory"): triggers ecosystem backlash (Epic vs Apple)
- **80/20**: sweet spot for infrastructure-heavy platforms (Apify's model)
- **85/15**: growth-phase offer to attract early creators
- **90/10**: unsustainable for compute-providing platform

---

## 4. Payment Infrastructure

### 4.1 Polar.sh — Critical Limitation

**Polar.sh AUP explicitly prohibits marketplaces:**

> "Marketplaces: Selling others' products or services using Polar against an upfront payment or with an agreed upon revenue share."

**What Polar CAN do for OpenAgents:**
- Handle user subscriptions (Basic, Pro, Power)
- Handle credit top-up purchases (one-time products)
- Meter LLM token usage via ingestion SDK
- Generate invoices and handle global tax compliance
- Serve as Merchant of Record for user-facing billing

**What Polar CANNOT do:**
- Pay creators their revenue share
- Act as payment splitter between platform and creator
- Handle creator KYC/identity verification

### 4.2 Architecture: Polar + Stripe Connect

```
USER PAYS → Polar.sh (Merchant of Record)
            ├── Subscription plan billing
            ├── Credit top-up one-time purchases
            ├── Global tax compliance
            └── Invoice generation

PLATFORM EARNS → Stripe (platform account)
                 └── All revenue flows into platform Stripe account

CREATOR EARNS → Stripe Connect Express (creator's connected account)
                └── Monthly transfer of 80% share after compute deduction

METERING → Database + Polar Ingestion SDK
           ├── Per-session: compute seconds × rate
           ├── Per-session: tokens × rate
           └── Atomic credit deduction (prevents race conditions)
```

This satisfies Polar's ToS: Polar only touches user-to-platform transactions, never platform-to-creator.

### 4.3 Stripe Connect Express for Creator Payouts

```typescript
// Monthly creator payout job (Trigger.dev cron)
async function processCreatorPayouts() {
  const creators = await db.creatorEarning.groupBy({
    by: ['creatorId'],
    _sum: { amount: true },
    where: { paidOut: false, createdAt: { gte: startOfMonth } }
  });

  for (const creator of creators) {
    if (creator._sum.amount < MINIMUM_PAYOUT_USD) continue;

    const connectedAccountId = await getStripeConnectedAccount(creator.creatorId);

    await stripe.transfers.create({
      amount: Math.floor(creator._sum.amount * 100), // cents
      currency: 'usd',
      destination: connectedAccountId,
      transfer_group: `payout_${month}`,
    });

    await db.creatorEarning.updateMany({
      where: { creatorId: creator.creatorId, paidOut: false },
      data: { paidOut: true, paidOutAt: new Date() }
    });
  }
}
```

**Fee structure:**
- Stripe charges: 2.9% + $0.30 per user payment transaction
- Payout fee: 0.25% on transfer amount (capped at $25)
- Net creator take: ~77.6% of gross user spend (after Stripe + 20% platform fee)

### 4.4 Usage Metering (Database-First Pattern)

```typescript
async function runAgent(userId: string, agentId: string, message: string) {
  // Check credit balance before running
  const balance = await db.creditBalance.findFirst({ where: { userId } });
  if (balance.credits < MINIMUM_SESSION_CREDITS) {
    throw new Error("Insufficient credits");
  }

  const startTime = Date.now();
  const result = await openclaw.run(agentId, message);

  // Calculate actual usage
  const durationSeconds = (Date.now() - startTime) / 1000;
  const tokensUsed = result.usage.inputTokens + result.usage.outputTokens;
  const computeCredits = Math.ceil(durationSeconds * CREDITS_PER_SECOND);
  const tokenCredits = Math.ceil(tokensUsed * CREDITS_PER_TOKEN);
  const totalCredits = computeCredits + tokenCredits;

  // Atomic deduction (optimistic lock prevents race conditions)
  await db.$transaction([
    db.creditBalance.update({
      where: { userId, credits: { gte: totalCredits } },
      data: { credits: { decrement: totalCredits } }
    }),
    db.usageEvent.create({
      data: { userId, agentId, computeCredits, tokenCredits, totalCredits }
    }),
    db.creatorEarning.create({
      data: {
        creatorId: agent.creatorId,
        amount: totalCredits * CREATOR_RATE_PER_CREDIT,
        sessionId: result.sessionId
      }
    })
  ]);
}
```

---

## 5. Infrastructure Cost Modeling

### 5.1 Fly.io Pricing

| Machine Size | vCPU | RAM | Hourly | Monthly (continuous) |
|---|---|---|---|---|
| shared-cpu-1x | 1 shared | 256MB | $0.0027 | $1.94 |
| shared-cpu-1x | 1 shared | 512MB | $0.0044 | $3.19 |
| shared-cpu-1x | 1 shared | 1GB | $0.0079 | $5.70 |
| shared-cpu-2x | 2 shared | 2GB | $0.0158 | $11.40 |
| performance-1x | 1 perf | 2GB | $0.0313 | $22.50 |

**Storage**: $0.15/GB/month (volumes and rootfs of stopped machines)
**Bandwidth**: $0.02/GB outbound (N. America, Europe)
**IPv4**: $2/month per dedicated address
**Reservations**: 40% discount for pre-paid compute blocks per region

### 5.2 GPU Deprecation (Critical)

**Fly.io GPU Machines deprecated after July 31, 2026.** From their blog "We Were Wrong About GPUs": developers want LLM APIs, not GPU rentals.

**Implication**: All LLM inference must route through API providers (Anthropic, OpenAI, Gemini). For self-hosted inference, use Modal.com or RunPod, not Fly.io.

### 5.3 Cold Start vs Warm vs Suspend/Resume

| Strategy | UX | Monthly Cost (100 agents, 10 sessions/day) |
|---|---|---|
| Always cold (autostop) | 3-5s cold start every time | $22/month compute only |
| Warm pool (always running) | Instant for top N | $9.57/month per 3 warm machines |
| **Suspend/resume (recommended)** | **~300ms resume** | **$29.50/month ($22 compute + $7.50 storage)** |

**Recommendation**: Use `autostop = "suspend"` universally. Sub-500ms resume at negligible storage cost ($0.075/machine/month).

### 5.4 Keep-Alive Economics (Aternos Model)

Aternos provides free Minecraft servers to 125M+ users:
- Free tier funded by display advertising
- Premium removes ads + faster startup + priority queuing
- Structural lesson: free tier demonstrates value, doesn't replace paid tier

For OpenAgents:
- Subscription users get suspended machines (sub-second resume)
- Free trial users get cold-started containers (acceptable for 2-3 trial sessions)
- No ads — cleaner business model than Aternos

---

## 6. Revenue Projections (Conservative)

| Month | Users | Paid Users | Avg Revenue/Paid | Gross Revenue |
|---|---|---|---|---|
| 1 | 500 | 50 (10%) | $15 | $750 |
| 2 | 1,500 | 200 (13%) | $18 | $3,600 |
| 3 | 4,000 | 600 (15%) | $22 | $13,200 |
| 4 | 8,000 | 1,200 (15%) | $25 | $30,000 |
| 5 | 12,000 | 1,800 (15%) | $25 | $45,000 |
| 6 | 18,000 | 2,500 (14%) | $22 | $55,000 |

Assumes moderate virality from PH/HN launch, creator community growth, and word-of-mouth.

---

## 7. Risks & Concerns

| Risk | Mitigation |
|---|---|
| Compute cost underestimation | Hard session limits, credit pre-check, session timeout warnings at 80% consumption |
| Creator payout complexity (international KYC) | Be explicit about supported countries from day one |
| Polar.sh marketplace restriction | Confirm architecture with Polar support before building |
| LLM API cost volatility | 19× margin headroom over raw cost absorbs 2-3× price increases |
| Free tier abuse (multi-account farming) | Phone verification for free trial, not email |
| Credit expiry friction | Email at 80%/95% through billing period; auto-convert unused basic credits to "bonus credits" |
| Fly.io platform dependency | Abstract container orchestration behind interface; add Railway/Render as failover |

---

## 8. Open Questions

1. **Does Polar.sh restriction extend to separate billing?** If Polar only touches user-to-platform transactions and Stripe Connect handles platform-to-creator, is this compliant? Confirm with Polar support.

2. **Optimal free trial length?** 7 days assumed — too short to discover value, or does longer create dormant free accounts?

3. **BYOAPI tier?** Should OpenAgents offer "Bring Your Own API Key" where users connect their Anthropic key? Higher volume but lower per-session revenue.

4. **Minimum payout threshold?** $25 means small creators wait months. $10 converts more creators to "earning" faster but increases Stripe transfer fees.

5. **Is 80/20 right for LLM-heavy compute?** Apify's actors are mostly CPU (scraping), while OpenAgents agents are LLM-heavy. Model with actual token data before committing publicly.

---

## Sources

- [Apify Actor Monetization](https://docs.apify.com/academy/actor-marketing-playbook/store-basics/how-actor-monetization-works)
- [Apify Pricing 2026](https://apify.com/pricing)
- [GPT Store Revenue Program](https://gptstorerevenueprogram.com/)
- [Poe Creator Monetization](https://creator.poe.com/docs/resources/creator-monetization)
- [Polar.sh Acceptable Use Policy](https://polar.sh/docs/merchant-of-record/acceptable-use)
- [Polar.sh Usage-Based Billing](https://polar.sh/features/usage-billing)
- [Stripe Connect Marketplace Docs](https://docs.stripe.com/connect/marketplace)
- [Fly.io Resource Pricing](https://fly.io/docs/about/pricing/)
- [Fly.io Autostop/Autostart](https://fly.io/docs/launch/autostop-autostart/)
- [Fly.io GPU Deprecation](https://community.fly.io/t/gpu-migration-fly-io-gpus-will-be-deprecated-as-of-july-31-2026/27110)
- [m3ter: Credit Pricing in SaaS](https://www.m3ter.com/guides/credit-models-in-saas-pricing)
- [Lago: Credit-Based Pricing](https://getlago.com/blog/credit-based-pricing)
- [Claude API Pricing 2026](https://platform.claude.com/docs/en/about-claude/pricing)
- [Apple App Store Small Business Program](https://developer.apple.com/app-store/small-business-program/)
- [Aternos Business Model](https://www.oreateai.com/blog/the-business-model-behind-aternos-how-a-free-minecraft-server-provider-makes-money/7bef17bc07c752adc6a059d91da9a639)
