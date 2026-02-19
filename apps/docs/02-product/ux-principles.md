# UX Principles

## The Golden Rule

**If your mum can't do it in 10 seconds, redesign it.**

---

## Principle 1: Zero Tech Jargon

| Never Say | Always Say |
|-----------|-----------|
| Deploy | Start using |
| Agent | Assistant |
| Container | (don't mention it) |
| API key | (don't mention it) |
| Model | (auto-select, hide unless power user) |
| YAML | Configuration |
| Docker | (don't mention it) |
| Instance | Your [Agent name] |
| Cold start | "Waking up your assistant..." |
| Provision | Setting up |
| Terminal / CLI | (don't mention it) |
| Repository | (don't mention it on marketplace, only on Platform) |

**Exception:** The Platform (for creators) can use technical language. Creators are developers.

## Principle 2: iOS App Store Inspiration

Not just the UI — the UX.

- **Browse before buy:** You can explore the entire marketplace without signing up
- **One-tap install:** Hiring an Agent = one button click. No configuration required.
- **Today tab:** Curated, editorial content. Not just a grid of cards.
- **Ratings & reviews:** Social proof on every Agent. 5-star system.
- **Categories:** "Productivity", "Research", "Writing" — not "NLP", "RAG", "LLM"
- **Search:** Natural language. "I need help writing blog posts" → relevant Agents

## Principle 3: Outcome-First Browsing

Users don't search for tools — they search for outcomes.

- "What do you need help with?" (not "Browse agents")
- "Research assistant" (not "web-search-enabled Claude wrapper")
- Category names describe outcomes: "Writing", "Research", "Business"
- Agent descriptions lead with what they DO: "Writes blog posts in your voice" (not "GPT-4 with custom system prompt and web search tool")

## Principle 4: Progressive Disclosure

Show simplicity first. Reveal power on demand.

**Layer 1 (Everyone):** Browse → Hire → Chat. That's it.
**Layer 2 (Regular users):** Projects, Teams, relay connections, usage dashboard.
**Layer 3 (Power users):** VS Code file tree, YAML editor, SSH access, model selection, custom skills.

Power user features are behind toggles, advanced sections, or explicit "Advanced" tabs. They are NEVER on the default view.

## Principle 5: The 10-Second Activation Flow

From landing to first Agent response in under 10 seconds:

```
1. Click "Hire This Assistant" (0s)
2. Google OAuth popup → one click (2s)
3. Agent provisioning with progress animation (5-8s)
   - "Setting up your assistant..."
   - Show the Agent's icon and a fun loading state
4. First message appears: "Hi! I'm [Name]. How can I help?" (8-10s)
```

The 5-8 second provisioning is masked by the OAuth flow. By the time the user logs in, the container is starting. By the time they see the chat, it's ready.

## Principle 6: Transparency About What's Happening

When the Agent is doing work:
- Show a "thinking" indicator (like Claude's thinking block)
- Show tool use in real-time: "Searching the web...", "Reading a file...", "Running a command..."
- Make it collapsible — default collapsed for Sarah, default expanded for Marcus
- Never show raw JSON. Always show human-readable descriptions.

When the Agent costs credits:
- Show estimated cost BEFORE starting a session: "This session will use ~20 credits"
- Show running credit counter during session (subtle, in the header)
- Never surprise the user with a charge

## Principle 7: Speed is a Feature

- Sub-500ms cold start (Fly.io suspend/resume)
- Streaming responses (token-by-token, not wait-for-completion)
- Optimistic UI (show the message immediately, stream the response)
- Skeleton loading states (never blank screens)
- Pre-warm popular Agents (maintain a pool of ready containers)

## Principle 8: The Agent is a Character

Each Agent has a personality. Not just a tool — a character you interact with.

- Agents have names, icons, taglines
- Agents introduce themselves on first chat
- Agents remember you across sessions (MEMORY.md)
- Agents have a "voice" defined by SOUL.md
- The marketplace card is like a dating profile — it shows the Agent's personality, not just capabilities
