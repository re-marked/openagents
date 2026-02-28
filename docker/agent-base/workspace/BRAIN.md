# Your Brain

You have a second brain. It lives in `memory/`. It's how you think across sessions.

This isn't a logging system. It's a **knowledge graph** — a web of interconnected notes about people, projects, ideas, preferences, lessons, and context. Daily notes are just one input. The real value is in the micro-notes that link everything together.

---

## Architecture

```
MEMORY.md              ← Index. Map of your brain. Links to everything.
memory/
  YYYY-MM-DD.md        ← Daily notes. Raw session logs.
  people/              ← Notes about specific people
  projects/            ← Notes about ongoing projects
  topics/              ← Concepts, preferences, recurring themes
  lessons/             ← Things you learned the hard way
  decisions/           ← Why something was decided (not just what)
```

Create subdirectories as needed. The structure grows organically — don't pre-create empty folders.

---

## The Two Types of Notes

### Daily Notes — `memory/YYYY-MM-DD.md`

Raw, chronological. What happened today. Write freely.

```markdown
# 2026-02-28

## Session 1
- User asked about [[project-agentbay-redesign]] — wants to move to a card-based layout
- Decided to use [[tech-framer-motion]] for animations (see [[decision-animation-library]])
- User seemed frustrated with the current sidebar. Note: they prefer minimal UI. See [[user-preferences]]
- Pushed 3 commits to `feature/card-layout`

## Session 2
- Continued [[project-agentbay-redesign]]. Cards are working.
- User mentioned they have a demo on Monday → [[deadline-2026-03-02]]
- #todo polish hover states before demo
```

Rules:
- One file per day, created on first interaction
- Use `## Session N` headers when multiple sessions happen in one day
- Sprinkle `[[wikilinks]]` to micro-notes liberally — this is how the graph forms
- Use `#tags` for quick filtering: `#todo`, `#bug`, `#decision`, `#insight`, `#preference`
- Reference yesterday naturally: `Continuing from [yesterday](memory/2026-02-27.md)...`

### Micro Notes — `memory/<category>/<slug>.md`

Small, focused, interconnected. One concept per note. These are the neurons of your brain.

```markdown
# Project: AgentBay Redesign
#project #active

Started: [[2026-02-25]]
Status: In progress
Branch: `feature/card-layout`

## Context
User wants an App Store-style card layout for the workspace.
Key constraint: must work on mobile. See [[user-preferences#mobile-first]].

## Decisions
- [[decision-animation-library]] — chose Framer Motion over CSS transitions
- [[decision-card-grid]] — 3 columns on desktop, 1 on mobile

## Open Questions
- Card click behavior: navigate or expand? User hasn't decided yet.

## Related
- [[tech-framer-motion]]
- [[project-agentbay-sse-gateway]] (needs to be done first)
```

---

## Note Categories

Create notes in these categories. The slug should be descriptive and kebab-case.

### `memory/people/<name>.md`
Notes about specific people — the user, their colleagues, anyone mentioned.
```markdown
# Sarah (User's Manager)
#person

- Prefers written updates over calls
- Timezone: EST
- Involved in [[project-agentbay-redesign]] approvals
- First mentioned: [[2026-02-20]]
```

### `memory/projects/<slug>.md`
Anything being actively worked on. Track status, decisions, blockers.

### `memory/topics/<slug>.md`
Recurring concepts, technologies, preferences. Things that come up across sessions.
```markdown
# User Preferences
#preferences

- Hates verbose output. Keep it short.
- Prefers dark mode everything
- Mobile-first mindset — always asks "does it work on phone?"
- Likes commits to be small and frequent
- Updated: [[2026-02-28]]
```

### `memory/lessons/<slug>.md`
Things you learned — mistakes, gotchas, insights. Future-you will thank you.
```markdown
# Lesson: Always Check the Fly.io Region
#lesson #ops

Deployed to `lhr` instead of `iad` on [[2026-02-15]]. Latency jumped 3x.
The user's infra is US-East. Always default to `iad`.

Related: [[project-agentbay-sse-gateway]]
```

### `memory/decisions/<slug>.md`
Why something was decided. Decisions without context are useless in 2 weeks.
```markdown
# Decision: Animation Library
#decision

Date: [[2026-02-28]]
Context: [[project-agentbay-redesign]] needs smooth card transitions.

## Options Considered
1. CSS transitions — simple but limited (no layout animations)
2. Framer Motion — powerful, already in deps, good React integration
3. GSAP — overkill for this use case

## Chosen: Framer Motion
- Already a dependency
- AnimatePresence handles mount/unmount animations
- User liked the brain graph animations (which use it)

## Decided by: User + me, during [[2026-02-28]] session
```

---

## Wikilinks — How Your Brain Connects

Every `[[slug]]` is a link. Use them constantly.

```
[[2026-02-28]]                    → daily note
[[project-agentbay-redesign]]     → project note
[[user-preferences]]              → topic note
[[decision-animation-library]]    → decision note
[[lesson-check-fly-region]]       → lesson note
[[sarah]]                         → person note
```

Link format maps to files:
- `[[2026-02-28]]` → `memory/2026-02-28.md`
- `[[project-agentbay-redesign]]` → `memory/projects/agentbay-redesign.md`
- `[[user-preferences]]` → `memory/topics/user-preferences.md`
- `[[lesson-check-fly-region]]` → `memory/lessons/check-fly-region.md`
- `[[decision-animation-library]]` → `memory/decisions/animation-library.md`
- `[[sarah]]` → `memory/people/sarah.md`

The prefix (`project-`, `decision-`, `lesson-`) in the wikilink tells you what kind of note it is at a glance. The actual file lives in its category folder without the prefix.

**Dangling links are fine.** If you write `[[project-new-feature]]` and the note doesn't exist yet, that's okay. Create it when you have enough to say. The link is a breadcrumb for later.

---

## MEMORY.md — The Index

MEMORY.md is NOT a brain dump. It's a **map** — a curated index that links to everything important.

Structure it like this:

```markdown
# Memory

## Active
- [[project-agentbay-redesign]] — card-based workspace layout (in progress)
- [[project-agentbay-sse-gateway]] — SSE proxy migration (blocked)

## People
- [[user-preferences]] — how they like things done
- [[sarah]] — user's manager

## Key Decisions
- [[decision-animation-library]] — Framer Motion for transitions
- [[decision-card-grid]] — responsive grid layout

## Lessons
- [[lesson-check-fly-region]] — always deploy to iad

## Recent
- [[2026-02-28]] — card layout, animation decisions
- [[2026-02-27]] — SSE gateway debugging
- [[2026-02-26]] — initial redesign planning
```

Rules:
- Keep it under 80 lines. It's an index, not a journal.
- Every micro-note and recent daily note should be linked here.
- Group by relevance, not chronology. Move stale items to an `## Archive` section or remove them.
- Update it at the end of every session — takes 30 seconds, saves minutes next session.

---

## Session Workflow

### Starting a Session
1. Read MEMORY.md — get the map
2. Read today's daily note (if it exists) and yesterday's
3. Skim any micro-notes relevant to the current task
4. You're caught up. Start working.

### During a Session
- Log to today's daily note as things happen
- When something deserves its own note (new project, important decision, recurring topic, person), create a micro-note
- Link everything. Daily notes link to micro-notes. Micro-notes link to each other and back to daily notes.

### Ending a Session
- Update today's daily note with a session summary
- Create any micro-notes you meant to but didn't
- Update MEMORY.md index if anything new was added
- This takes 60 seconds. Do it.

---

## When to Create a Micro-Note

Create a note when:
- A **project** is mentioned for the second time → it's real, it deserves a note
- A **decision** is made with reasoning → capture the why before you forget
- You **learn something** the hard way → future-you needs this
- A **person** comes up with context worth remembering
- A **preference** or **pattern** emerges → "user always wants X"
- A **topic** keeps recurring across sessions

Don't create a note when:
- It's a one-off factoid with no connections
- It's already captured well enough in the daily note
- You'd be creating a note just for the sake of it

---

## Tags

Use tags in note frontmatter or inline. Keep them flat and simple.

| Tag | Meaning |
|-----|---------|
| `#project` | Ongoing work |
| `#active` | Currently being worked on |
| `#paused` | On hold |
| `#done` | Completed |
| `#decision` | A choice that was made |
| `#lesson` | Something learned |
| `#preference` | User preference or pattern |
| `#todo` | Needs attention |
| `#bug` | Known issue |
| `#insight` | Interesting observation |
| `#person` | Note about a person |

---

## Memory Maintenance

During heartbeats or quiet moments:
1. Read recent daily notes you haven't processed
2. Extract anything worth a micro-note
3. Update MEMORY.md index
4. Archive stale items (projects that finished, decisions that were reversed)
5. Check for dangling `[[wikilinks]]` — create the note or remove the link

Think of it like tending a garden. A little weeding each day keeps it useful. Neglect it and you're back to waking up with amnesia.

---

## The Golden Rule

**If it matters, it's a note. If it connects, it's a link. If it's important, it's in the index.**

Your brain is only as good as the links between its parts. A note without links is a dead end. A link without a note is a promise. Keep both alive.
