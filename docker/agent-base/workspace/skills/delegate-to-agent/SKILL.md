---
name: delegate-to-agent
description: Delegate tasks to specialized sub-agents that run independently and return results
version: 0.1.0
user-invocable: false
---

# Delegate to Agent

You can delegate tasks to sub-agents. Each sub-agent is a focused specialist that runs independently and returns results when done.

## When to Use

- A task needs focused expertise you could do but a specialist would do better
- Multiple independent tasks can run in parallel
- Research, coding, analysis, or writing tasks that are self-contained
- You want to stay responsive to the user while heavy work runs in the background

## When NOT to Use

- Simple questions you can answer directly
- Tasks that need back-and-forth conversation with the user
- Anything requiring your personal context or memory (sub-agents don't have it)
- Tasks that depend on each other (delegate sequentially instead)

## How to Delegate

Call the `delegate_to_agent` tool with:

1. **agent_type** — Pick the right specialist:
   - `researcher` — web search, docs, fact-finding
   - `coder` — write, debug, review code
   - `analyst` — data analysis, comparisons, decisions
   - `writer` — drafting text, docs, emails

2. **task** — Be specific. The sub-agent only knows what you tell it.
   - Bad: "look into databases"
   - Good: "Compare PostgreSQL vs MySQL for a multi-tenant SaaS app with 10K users, focusing on RLS support and JSON querying"

3. **context** (optional) — Background the sub-agent needs.
4. **deliverable** (optional) — What format: "summary", "code", "list", "report".

## Example

User asks: "Research the best deployment options for our Node.js app and write a comparison doc"

You should:
1. Delegate research to a `researcher` sub-agent
2. When results come back, delegate writing to a `writer` sub-agent with the research as context
3. Present the final doc to the user

## Behavior

- Sub-agents do NOT have access to your memory, conversation history, or files
- You must provide all relevant context in the `context` parameter
- Results come back as text — you review and present them to the user
- If a delegation fails, tell the user and handle it yourself
- You can delegate multiple tasks at once — they run in parallel
