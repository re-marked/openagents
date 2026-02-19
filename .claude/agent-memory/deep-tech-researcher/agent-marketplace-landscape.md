# AI Agent Marketplace Landscape Research
Research date: 2026-02-18

## Existing Marketplaces

### OpenAI GPT Store
- 3M+ GPTs created, ~159K public and active
- Revenue sharing: ~$0.03/conversation; need 33K+/week for $1K/month
- Most creators earn <$500/month; top 0.01% earn $15K-six figures annually
- Engagement-based payout system (not simple revenue share %)
- 25 conversation/week minimum to qualify for revenue program
- Dominant niches in 2026: legal discovery, medical triage, cybersecurity MDR, industrial specs

### Poe by Quora
- Price-per-message model (creators set price) + subscription referral bonuses
- Up to $20/user brought to platform (100% of first month's sub, 50% of annual)
- Backed by $75M round led by a16z
- Works as multi-model aggregator (creators wrap any model)

### Character.AI
- ~20M MAUs, $32.2M annual revenue (2025), $1B valuation (down from $2.5B peak)
- Creator revenue sharing based on character usage, brand partnerships
- Mostly consumer/entertainment, 2hr/day avg session
- High operational costs relative to revenue — cautionary tale on freemium

### Coze (ByteDance)
- Open-sourced (Apache 2.0) — Coze Studio + Coze Loop
- Coze Space: multi-agent collaboration platform (Apr 2025)
- Revenue model: tiered plans, started free then restricted to 1 msg/user/day on free tier
- Volcano Engine (parent) targeting RMB 25B+ revenue in 2025
- Interesting: open-sourced the core to drive adoption, monetize cloud

### Google Gemini Enterprise (formerly AgentSpace)
- Rebranded Oct 2025, folded Agentspace into Gemini Enterprise
- 1,500+ partner-built agents in marketplace
- Accenture: 450+ agents; PwC: 120+ agents
- Enterprise focus, not consumer marketplace

### HuggingFace Spaces
- Not a true agent marketplace — model/demo hosting
- GPU pricing: $0.40/hr (T4 small) to $40/hr (8x H200)
- Inference endpoints from $0.03/hr
- Strong for ML community but no monetization model for creators

### Salesforce Agentforce
- $2/conversation legacy pricing
- New: Flex Credits ($0.10/action = 20 credits)
- Enterprise add-on: $125/user/month
- Agentforce 1 Edition: $550/user/month

### AWS Bedrock AgentCore (launched 2025)
- Purpose-built agent runtime: only bills active CPU (not I/O wait)
- Saves 30-70% vs. traditional hosting (agents spend most time waiting)
- Modular: Runtime, Gateway, Identity, Memory, Observability, Browser, Code Interpreter
- No upfront commitments, per-second billing

## Anthropic Agent Skills
- Launched as enterprise feature, then made open standard (Dec 2025)
- Donated to Linux Foundation alongside MCP
- 20K+ GitHub stars, tens of thousands community-contributed skills
- No revenue sharing yet — ecosystem play only
- Partners: Atlassian, Figma, Canva, Stripe, Zapier

## Agent Communication Protocols

### MCP (Model Context Protocol)
- Created by Anthropic Nov 2024, donated to Linux Foundation/AAIF Dec 2025
- 97M+ monthly SDK downloads
- Adopted by: Anthropic, OpenAI (Mar 2025), Google DeepMind (Apr 2025), Microsoft
- 75+ connectors in Claude alone
- De facto standard for tool/data integration layer

### A2A (Agent2Agent)
- Google's agent-to-agent protocol, Apr 2025
- Donated to Linux Foundation
- 150+ supporting organizations
- v0.3 (Jul 31, 2025): adds gRPC support, signed security cards
- Designed for inter-agent communication (vs. MCP which is agent-to-tool)
- Agent Card: JSON capability advertisement standard

## Deployment Infrastructure

### Fly.io Machines
- Firecracker microVMs, sub-second cold starts (advertised: "milliseconds")
- Shared CPU pricing: $0.0000075/sec for 1vCPU/256MB (~$1.94/month continuous)
- Suspend/resume: hundreds of ms vs. multi-second cold start
- 40% discount with reservations
- Regional pricing since Jul 2024
- Bandwidth: $0.02/GB (N. America, EU); dedicated IPv4: $2/month

### Modal.com
- Sub-second to 2-4s cold starts for GPU containers
- Free tier: $30/month credit
- Per-second billing, GPU and CPU
- No configuration — everything is code
- Best for: GPU-heavy ML workloads, burst compute

### E2B
- Firecracker microVMs, <200ms cold starts, "no cold starts" claim
- Hobby: free + $100 one-time credit, 20 concurrent sandboxes, 1hr max sessions
- Pro: $150/month, 24hr sessions, custom CPU/RAM
- Enterprise: custom, BYOC, on-prem
- ~$0.05/hour for 1vCPU sandbox
- Designed specifically for AI-generated code execution

### Railway
- Hobby: $5/month (includes $5 usage credits)
- Pro: $20/month
- Enterprise: custom
- Per-minute billing, Docker/GitHub/Registry deployment
- Simpler than Fly.io but less control over placement

### AWS Bedrock AgentCore Runtime
- Only bills active CPU — massive savings for I/O-bound agent workloads
- Per-second increments
- Integrated with AWS ecosystem (IAM, VPC, etc.)
- Best for: enterprises already on AWS

### Kubernetes (GKE, EKS, AKS)
- CNCF launched Kubernetes AI Conformance Program (Nov 2025)
- Google Agent Sandbox: open-source K8s controller for agent isolation
- Kagent framework for running agents in K8s
- Best for: 100K+ deployments, full control, compliance requirements

## Monetization Models Analysis

### What Works (evidence-based)
1. **Usage-based/credits** — most adopted in 2025 (OpenAI API, Modal, E2B)
2. **Per-conversation** — Salesforce $2/conversation proven at enterprise scale
3. **Subscription + usage** — hybrid, best retention (Poe model)
4. **Outcome-based** — rare but highest willingness to pay (legal, finance)
5. **Creator economy with marketplace fee** — 15-30% platform take is market norm
   - Developers keep 70-85% = higher innovation and retention
   - <15% take = marketplace struggles to fund itself
   - >30% take = developer backlash (Apple App Store problem)

### What Doesn't Work
- Pure freemium at scale (Character.AI cautionary tale — $1B valuation collapse)
- Premature monetization before 10K MAU threshold (30% lower LTG)
- Flat subscription without usage metering (misaligned incentives)

### Market Context
- AI agent market: $7.6B in 2025, projected 49.6% CAGR to 2033
- Average enterprise ROI on agentic AI: 171% (vs. 57% for traditional automation)
- <25% of organizations have successfully scaled agents to production (gap = opportunity)

## Scale Considerations (10K-100K agents)

### Infrastructure Decision Tree
- <1K concurrent agents: Fly.io Machines or Railway (simplicity wins)
- 1K-10K concurrent agents: Fly.io with reservations OR self-managed K8s
- 10K+ concurrent agents: Kubernetes (EKS/GKE) + Firecracker/Kata Containers
- Code execution sandboxing: E2B (managed) or Agent Sandbox on K8s (self-hosted)

### Key Architecture Patterns
- Stateless agent API + external state store (Redis/Postgres)
- Session-per-container vs. multiplexed sessions per container
- Suspend/resume for inactive agents (saves 60-80% compute cost)
- Regional deployment for latency (Fly.io's native strength)
- Separate runtime billing: only charge for active CPU, not I/O wait
