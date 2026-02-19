# Monetization Model Research for OpenAgents
Research date: 2026-02-19

## Platform Comparison: Exact Fee Numbers

### GPT Store (OpenAI)
- Revenue model: Engagement-based, not percentage split
- Payout: ~$0.03/conversation (estimated, not disclosed by OpenAI)
- Threshold: 25 unique conversations/week to qualify
- Typical earnings: <$100/quarter for median creator; $500-$15K/month for top 0.01%
- Problem: Discovery is broken — store SEO generates <25 weekly convos for most creators
- No percent split — OpenAI keeps all subscription revenue, creators get a "bonus pool"

### Poe by Quora
- Price-per-message model: creators set price in compute points
- Creator subscription referral: 100% of first month sub, 50% of annual sub
- Maximum referral: $20/user brought to platform
- Minimum payout: $10 via Stripe
- 23 countries supported
- "Tens of millions/year" total creator payout pool (their claim, 2025)

### Apify Actor Store — BEST REFERENCE FOR OPENAGENTS
- Revenue split: 80% creator / 20% Apify (before platform usage deduction)
- Net: 80% of revenue MINUS compute costs used running the Actor
- So if Actor generates $100 revenue and uses $10 of Apify compute: payout = $72
- Pricing models available:
  1. Pay-per-result (PPR): set price per dataset item (most common: $1-$10/1K results)
  2. Pay-per-event (PPE): custom events, most flexible
  3. Pay-per-usage: standard Apify credits consumed
  4. Rental: flat monthly fee, user pays their own compute separately
- Credit system: Free plan = $5/month credits; Starter $39/mo; Scale $199/mo; Business $999/mo
- Compute unit = 1 GB-hour of RAM; $0.30/CU (Starter) → $0.20/CU (Business)
- Credits do NOT roll over (expire monthly)
- Payouts: automatic invoice on 11th of each month, ~$10K+/month for top creators
- $1M Challenge: Apify bets they can get you to $1M ARR on their platform

### Relevance AI — Split Credit Model
- Split credits into: Actions (compute) + Vendor Credits (LLM tokens — zero markup)
- Actions cost: 4 credits/run (Free/Pro), 3 credits/run (Team), 2 credits/run (Business)
- Vendor Credits: roll over indefinitely; zero markup on AI model costs
- Plans: Free (100 credits/day), Pro ($19/mo), Team (middle), Business ($599/mo, 300K credits)
- Transparency play: "We pass through exact AI costs" — builds trust

### Salesforce Agentforce
- Legacy: $2/conversation
- Current: Flex Credits at $0.10/action (20 credits = $2)
- Enterprise: $125/user/month add-on

## App Store Models

### Apple App Store
- Standard: 30% commission on digital goods and IAP
- Small Business Program: 15% for developers earning <$1M/year
- Subscriptions: 30% year 1 → 15% year 2+ for retained subscribers
- EU (alternative terms): 10% for Small Business + 2nd-year subscriptions
- App Store search/promotion: separate paid advertising

### Google Play Store
- Standard: 30% commission
- Small Business Program: 15% on first $1M/year revenue (requires enrollment)
- Subscriptions: 15% after subscriber's first 12 months
- Very similar to Apple's structure after DOJ antitrust pressure

### Key Insight from App Stores
- Both use 30/15 split structure tied to revenue thresholds
- Both recently reduced to 15% under antitrust pressure
- Both treat subscriptions more favorably (long-term subscriber = 15%)
- Neither pass infrastructure costs to developers (dev pays for their own build/distribution)
- Neither split compute costs — they are software marketplaces, not runtime marketplaces

## Infrastructure Cost Math (Fly.io)

### Machine Pricing (2026, per second billing)
- shared-cpu-1x 256MB: ~$0.0027/hour = ~$0.000000750/second (~$1.94/month continuous)
- shared-cpu-1x 512MB: ~$3.19/month continuous
- shared-cpu-1x 1GB: ~$5.70/month continuous
- shared-cpu-2x 2GB: ~$11-12/month continuous
- performance-1x 2GB: ~$0.0313/hour
- performance-2x 4GB: ~$0.0626/hour
- Storage: $0.15/GB/month for stopped machine rootfs
- Bandwidth: $0.02/GB (N. America, EU)
- Reservations: 40% discount on pre-paid compute blocks

### GPU (CRITICAL: being deprecated July 31, 2026)
- A10/L40S: $1.25/hour (prices were cut in half)
- A100 40G: ~$2.50/hour
- A100 80G: ~$3.50/hour
- RECOMMENDED: Don't build GPU dependency on Fly.io. Use Modal, RunPod, or API providers instead.

### Container Lifecycle Cost Model
- Active session (running): charged per second for CPU+RAM
- Idle/stopped: ~$0.15/GB/month rootfs only (negligible)
- Suspended (snapshot): same as stopped billing but faster resume (hundreds of ms)
- Autostop: stops machine when no traffic; autostart: starts on first request (sub-second)
- Best strategy: autostop/suspend all agent machines between conversations

### Cost Per Agent Session (Estimate)
- A 5-minute agent conversation using shared-cpu-1x 512MB:
  - Compute: 5 min = 300s × $0.0027/3600 = $0.000225
  - LLM: ~50K tokens (Claude Sonnet 4.5 at $3/$15/M): ~$0.00075 in + ~$0.00150 out = ~$0.00225
  - Total raw cost: ~$0.0025 per session
  - With 3× markup for margin + ops: ~$0.008/session
  - Round up for pricing: $0.01/session or bundle into credits

## Payment Infrastructure

### Polar.sh Limitations for Marketplaces
- CRITICAL: Polar PROHIBITS selling others' products via revenue share
- "Marketplaces: Selling others' products or services using Polar against an upfront payment
  or with an agreed upon revenue share" — explicitly prohibited in acceptable use policy
- This means: Polar cannot be used as the CREATOR PAYOUT layer for a marketplace
- Polar CAN be used as: the PLATFORM'S billing system (charging users for platform credits)
- For creator payouts: need Stripe Connect, Dodo Payments, or direct bank transfer

### Stripe Connect (Correct Tool for Creator Payouts)
- No setup fee; standard processing: 2.9% + $0.30 per transaction
- Payout fee: 0.25% capped at $25
- Application fees: platform keeps configured % on each transfer
- Account types: Standard (dev manages KYC), Express (Stripe manages KYC), Custom (full control)
- Express recommended for creator payout: Stripe handles onboarding/KYC
- Platform earns "application fee" on each creator payment
- Funds held in platform account first, then split → payout to creator

### Alternative: Dodo Payments
- Newer MoR player with lower-friction international support
- Lower fees during beta; aimed at developer/SaaS markets
- Less proven at scale vs Stripe

### Recommended Architecture: Hybrid
- Polar.sh: user-facing billing (platform subscription + credit top-ups)
- Stripe Connect Express: creator payout layer (keep 20-30%, pay out 70-80%)
- This satisfies Polar's ToS: Polar charges USERS for the PLATFORM, Stripe pays CREATORS

## Credit-Based Pricing Best Practices

### Psychological Advantages
- Credits don't feel like "real money" — higher spend velocity
- Pre-purchase creates commitment (sunk cost effect)
- Platform gets float on unused credits
- Gamification potential (credit balance, milestones)

### Expiry Policy
- Most platforms: monthly expiry (creates urgency, no accumulation problem)
- Premium tiers: credits roll over (loyalty reward)
- Best practice: base credits expire monthly; bonus credits expire in 90 days
- Always show clear balance and expiry in UX

### Credit Conversion Ratios
- Best practice: abstract away from exact compute cost
- 100 credits = $1 is clean (1 credit = 1 cent)
- Or 1,000 credits = $10 (0.1 cent granularity without fractions)
- Avoid 1:1 credit:dollar (feels like just spending money)

## Monetization Model Recommendations

### Revenue Split Market Norms
- 70/30 (Apple/Google): developer backlash territory, feel entitled to revolt
- 80/20 (Apify, most tool marketplaces): sweet spot for infrastructure platforms
- 85/15 (newer platforms competing for developers): growth phase strategy
- Creator gets gross revenue BEFORE compute deduction in Apify model
- Our recommendation: 80/20 on subscription/usage revenue after compute costs

### What Makes Agent Marketplaces Different from App Stores
1. App Store: dev pays $99/year, Apple handles distribution — no per-session cost
2. Agent Marketplace: platform pays compute per session — cost is ongoing
3. Therefore: platform must recoup compute costs before splitting revenue
4. Formula: Creator Payout = (Revenue × 80%) - Agent Compute Costs
5. Or: Platform deducts compute at cost, applies 80/20 split on remainder

### The "Freemium Engine" Problem (Character.AI cautionary tale)
- 20M MAU but only $32.2M revenue = $1.6/user/year
- Too much free tier depletes compute budget without conversion
- Minimum: free tier should cost more than it generates in goodwill
- Better: free = limited credits, not unlimited access

## Recommended Hybrid Model for OpenAgents

### User-Facing Structure
1. Free Trial: 100 credits ($1 in compute value), no card required, 7-day expiry
2. Starter Pack: $12/month → 1,500 credits/month (~150 agent sessions)
3. Pro Pack: $39/month → 6,000 credits/month (~600 agent sessions) + priority queuing
4. Credit Top-ups: $10 = 1,100 credits, $25 = 3,000 credits, $50 = 6,500 credits

### Credit Consumption Model
- Light session (3 min, small model): 8 credits
- Standard session (10 min, Sonnet): 20 credits
- Heavy session (30 min, Opus): 80 credits
- Long-running background task (per 10 min compute): 5 credits

### Developer Revenue Sharing
- Platform takes: compute costs + 20% of remaining revenue
- Creator gets: 80% of revenue after compute costs are covered
- Example: User spends 100 credits ($1.00)
  - Compute cost: $0.025
  - Remaining: $0.975
  - Creator gets: $0.78
  - Platform gets: $0.22 (compute covered + 20% of remainder)
- Minimum payout: $25/month (held until threshold, then monthly auto-pay via Stripe Connect)

### Developer Tiers (to incentivize quality)
- Starter developer: 80/20 split
- Verified developer (100+ monthly active users): 82/18 split + featured placement
- Top Creator (1,000+ MAU): 85/15 split + dedicated support + early access
