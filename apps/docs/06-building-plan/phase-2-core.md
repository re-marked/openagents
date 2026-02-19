# Phase 2: Core (Week 2)

## Goal
A user can chat with a real OpenClaw Agent through the browser with streaming responses. The core product loop works end-to-end.

---

## Day 1-2: Chat Interface

### Workspace Layout
- [ ] Workspace layout with sidebar (Projects → Teams → Agents)
- [ ] Dashboard home page (placeholder stats, quick actions)
- [ ] Agent library page within a Team (grid of agent cards)

### Chat UI
- [ ] Chat page with message list + input
- [ ] Message bubbles: user (right), assistant (left)
- [ ] Streaming text display (token-by-token rendering)
- [ ] Tool use indicators: "Searching the web...", "Reading a file..." (collapsible)
- [ ] "Thinking" indicator (animated dots or spinner)
- [ ] Auto-scroll to latest message
- [ ] Markdown rendering in assistant messages (code blocks, lists, bold)
- [ ] File attachment area (drag & drop, for later)

---

## Day 3-4: SSE Streaming Pipeline

### SSE Gateway (Fly.io)
- [ ] Deploy SSE Gateway app on Fly.io
- [ ] Implement fly-replay routing: request header → specific Machine
- [ ] Test: Browser → Vercel → Fly.io Gateway → Agent Machine → streamed response

### Next.js Route Handler
- [ ] `POST /api/chat/stream` route handler
- [ ] ReadableStream response (NOT buffered)
- [ ] `X-Accel-Buffering: no` header
- [ ] Auth check (Supabase JWT from cookie)
- [ ] Machine lookup from Supabase
- [ ] Forward to SSE Gateway, pipe response to browser
- [ ] Error handling: machine not found, machine starting, auth failed

### Supabase Realtime
- [ ] Broadcast channel per session
- [ ] Server broadcasts token chunks during streaming
- [ ] Client subscribes to session channel (for multi-device sync later)
- [ ] Full message persisted to `messages` table after stream completes

### Client Hook
- [ ] `useChatStream(sessionId)` hook
- [ ] Handles: streaming state, response accumulation, error display
- [ ] Optimistic message display (user message shows immediately)

---

## Day 5: Session Management + Auto-Provisioning

### Session Flow
- [ ] New session created when user opens chat with an Agent
- [ ] Session persisted in Supabase (sessions table)
- [ ] Messages stored per session
- [ ] Session history: user can see past conversations

### Auto-Provisioning
- [ ] When user opens chat and no Machine exists: auto-provision
- [ ] Show progress: "Setting up your assistant..." with animation
- [ ] Poll agent_instances status until running
- [ ] Redirect to chat when ready
- [ ] Handle errors: provisioning failed → show retry button

### Projects + Teams
- [ ] Auto-create default Project + Team for new users
- [ ] Agent instances belong to a Team
- [ ] Basic navigation: Workspace → Project → Team → Agent → Chat

---

## End of Week 2 Checklist

- [ ] Can open chat with an Agent and see streaming responses
- [ ] Tool use visible in real-time (collapsible sections)
- [ ] Messages persisted across page refreshes
- [ ] Session history visible
- [ ] Machine auto-provisions on first chat
- [ ] Suspended machines resume transparently (<1 second)
- [ ] Workspace navigation works (Projects → Teams → Agents → Chat)
