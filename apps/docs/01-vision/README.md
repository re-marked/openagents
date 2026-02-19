# 01 — Vision

## The One-Liner

OpenAgents is the App Store for AI Agents — where anyone can discover, hire, and chat with autonomous AI assistants that actually do things.

## The Problem

AI agents are the most powerful technology since the smartphone. But right now, using one requires:
- Installing software on your computer
- Managing API keys and configuration files
- Understanding Docker, terminals, and YAML
- Trusting unverified skills from ClawHub (13.4% malware rate)
- Running your own infrastructure

This is like asking someone to compile their own iPhone apps from source code. 99.9% of people will never do it.

## The Solution

OpenAgents makes AI agents as easy as downloading an app:

1. **Browse** the marketplace like the iOS App Store
2. **Hire** an Agent with one click (we say "hire", not "deploy")
3. **Chat** with your Agent on the web, Telegram, WhatsApp, Slack, or Discord
4. **Watch** your Agent use a computer, browse the web, write documents, and complete tasks

No API keys. No terminals. No Docker. No YAML.

## The Vision

We believe every person will have a team of AI agents working for them within 2 years. OpenAgents is the marketplace where they find and manage that team.

Think of it as:
- **App Store** — curated, secure, one-click install
- **Upwork** — you "hire" agents with specific skills for specific jobs
- **Slack** — your workspace where you chat with and manage your agent team

## Core Philosophy

### 1. Simple Agents (My Mum Test)
If your mum can't hire an Agent and start chatting in under 60 seconds, we failed. Zero tech jargon. No "deploy", no "container", no "agent". Use "assistant", "start using", "hire".

### 2. Robust Infrastructure
Agents are always online, always fast. Fly.io Firecracker microVMs with suspend/resume give sub-500ms cold starts. Users never see a loading spinner for more than a second.

### 3. The Standards (.skills & agent.yaml)
We don't just host agents — we define how agents are packaged and distributed. The `.skills` format is our App Store equivalent of `.ipa`. Signed, verified, versioned.

### 4. Self-Improving Agents
Agents aren't static. They adapt to the user at runtime:
- Learn your communication style and preferences
- Discover and install new skills when needed
- Switch models based on task complexity
- Build persistent memory of your projects and goals

Like lobsters adding butter to themselves. At runtime.

---

*Next: [Competitive Landscape →](./competitive-landscape.md)*
