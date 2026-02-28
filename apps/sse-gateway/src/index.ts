import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { streamSSE } from 'hono/streaming'
import WebSocket from 'ws'

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: [
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'https://agentbay.com',
      'https://*.vercel.app',
    ],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'x-machine-id',
      'x-fly-app',
      'x-gateway-token',
      'x-agent-token',
    ],
  }),
)

/** Health check */
app.get('/health', (c) =>
  c.json({ status: 'ok', machine: process.env.FLY_MACHINE_ID ?? 'local' }),
)

/**
 * Legacy SSE routing endpoint (fly-replay).
 * Kept for backward compatibility with stateless /v1/responses flow.
 */
app.post('/v1/responses', async (c) => {
  const gatewayToken = c.req.header('x-gateway-token')
  const targetApp = c.req.header('x-fly-app')
  const targetMachineId = c.req.header('x-machine-id')

  if (!gatewayToken || gatewayToken !== process.env.GATEWAY_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (!targetApp || !targetMachineId) {
    return c.json({ error: 'Missing x-fly-app or x-machine-id header' }, 400)
  }

  c.header('fly-replay', `app=${targetApp},instance=${targetMachineId}`)
  return c.text('Replaying to agent machine', 409)
})

// ---------------------------------------------------------------------------
// @mention detection helpers
// ---------------------------------------------------------------------------

interface MentionMatch {
  agent: string
  message: string
}

/**
 * Extract all @mentions and the text directed at each agent.
 * Agent names are derived dynamically from the subAgents map keys.
 */
function extractMentions(text: string, agentNames: string[]): MentionMatch[] {
  if (agentNames.length === 0) return []

  const re = new RegExp(`@(${agentNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'g')
  const mentions: MentionMatch[] = []
  const matches = [...text.matchAll(re)]

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const agent = match[1]
    const start = match.index! + match[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length
    const message = text.slice(start, end).trim()
    if (message) {
      mentions.push({ agent, message })
    }
  }

  return mentions
}

// ---------------------------------------------------------------------------
// Main chat endpoint
// ---------------------------------------------------------------------------

/**
 * WebSocket-to-SSE bridge for OpenClaw native sessions.
 *
 * Flow:
 * 1. Vercel POSTs { sessionKey, message, idempotencyKey }
 * 2. Gateway opens WebSocket to agent machine via public URL
 * 3. Performs OpenClaw protocol v3 handshake (connect.challenge -> connect -> hello-ok)
 * 4. Sends chat.send with sessionKey + message
 * 5. Translates streaming WS events into SSE events back to caller
 * 6. After a "done" event, checks for @mentions in the completed text.
 *    If found, queries sub-agent machines via HTTP /v1/chat/completions
 *    (using subAgents map in body), or falls back to mock responses.
 *    Emits thread events and sends a follow-up chat.send for synthesis.
 * 7. Repeats until no more @mentions or depth limit (3) reached.
 *
 * Auth: Connects as openclaw-control-ui client with dangerouslyDisableDeviceAuth
 * enabled on the agent, which allows scoped access without device key pairs.
 */
app.post('/v1/chat', async (c) => {
  const gatewayToken = c.req.header('x-gateway-token')
  if (!gatewayToken || gatewayToken !== process.env.GATEWAY_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const targetApp = c.req.header('x-fly-app')
  const agentToken = c.req.header('x-agent-token')

  if (!targetApp) {
    return c.json({ error: 'Missing x-fly-app header' }, 400)
  }

  let body: {
    sessionKey: string
    message: string
    idempotencyKey?: string
    subAgents?: Record<string, SubAgentInfo>
  }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { sessionKey, message, idempotencyKey, subAgents } = body
  if (!sessionKey || !message) {
    return c.json({ error: 'Missing sessionKey or message' }, 400)
  }

  // Use public URL — OpenClaw only binds IPv4, but Fly 6PN uses IPv6.
  // Public URL also triggers autostart for suspended machines.
  const wsUrl = `wss://${targetApp}.fly.dev/`
  console.log(`[chat] Connecting to ${wsUrl} for session ${sessionKey}`)

  return streamSSE(c, async (stream) => {
    let ws: WebSocket | null = null
    let closed = false

    const cleanup = () => {
      if (closed) return
      closed = true
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }

    // Abort when client disconnects
    c.req.raw.signal.addEventListener('abort', cleanup)

    // 5-minute timeout
    const timeout = setTimeout(() => {
      console.log('[chat] Timeout reached, closing')
      stream.writeSSE({ event: 'error', data: JSON.stringify({ error: 'Timeout' }) })
      cleanup()
    }, 5 * 60 * 1000)

    try {
      // Retry the full handshake — suspended Fly.io machines auto-resume
      // but OpenClaw takes ~50s to initialize. Fly's proxy returns
      // ECONNREFUSED fast when the port isn't ready, so retries cycle
      // quickly and the total budget (~90s) covers the startup window.
      const MAX_ATTEMPTS = 8
      const RETRY_DELAYS_MS = [0, 2_000, 5_000, 10_000, 15_000, 20_000, 25_000, 30_000]
      let lastConnectError: string | null = null

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (attempt > 0) {
          const delay = RETRY_DELAYS_MS[attempt]
          console.log(`[chat] Retrying connection (${attempt}/${MAX_ATTEMPTS - 1}) after ${delay}ms...`)
          await sleep(delay)
        }

        try {
          ws = await connectAndHandshake(wsUrl, targetApp, agentToken)
          break
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          lastConnectError = msg
          console.warn(`[chat] Attempt ${attempt + 1} failed: ${msg}`)

          if (attempt === MAX_ATTEMPTS - 1) {
            throw new Error(
              `Agent unavailable after ${MAX_ATTEMPTS} connection attempts — it may still be starting up. Last error: ${lastConnectError ?? 'Unknown error'}`,
            )
          }
        }
      }

      // TypeScript can't narrow ws after the retry loop — assert non-null
      // since we either break with a connected ws or throw.
      const connectedWs = ws!

      // --- Send initial chat.send ---
      const chatRequest = {
        type: 'req',
        id: generateId(),
        method: 'chat.send',
        params: {
          sessionKey,
          message,
          idempotencyKey: idempotencyKey ?? generateId(),
        },
      }

      connectedWs.send(JSON.stringify(chatRequest))
      console.log('[chat] Sent chat.send')

      // Ensure tool events stream for this session (belt-and-suspenders
      // alongside openclaw.json verboseDefault). "full" = tool calls + outputs.
      connectedWs.send(JSON.stringify({
        type: 'req',
        id: generateId(),
        method: 'sessions.patch',
        params: { key: sessionKey, verboseLevel: 'full' },
      }))
      console.log('[chat] Sent sessions.patch verboseLevel=full')

      // --- Multi-turn @mention loop ---
      // We listen for the agent's response. When a "done" event arrives with
      // @mentions, we emit thread events, then send a follow-up chat.send
      // for the agent to synthesize. This repeats up to MAX_MENTION_DEPTH.
      const MAX_MENTION_DEPTH = 3
      let mentionDepth = 0
      const mentionedAgents = new Set<string>()

      /**
       * Listen for one full agent turn (deltas → done, or lifecycle end + done).
       * Returns the completed text from the "done" event, or null on error/close.
       *
       * Includes a per-turn inactivity timeout: if no meaningful agent/chat
       * events arrive within TURN_TIMEOUT_MS, we assume the agent silently
       * failed (e.g., missing API key) and resolve with null + error event.
       */
      const TURN_TIMEOUT_MS = 90_000
      const listenForTurn = (): Promise<string | null> => {
        return new Promise<string | null>((resolve) => {
          let lifecycleEnded = false
          let doneSent = false
          let doneEmitted = false // guards against emitting duplicate done SSE events
          let resolved = false
          let deltaBuffer = ''
          let lastDoneText: string | null = null

          // Track chat content parts to detect tool calls embedded in message
          let lastSeenPartsCount = 0
          let hadToolOutput = false

          const onTimeout = () => {
            console.error('[chat] Turn timed out — no agent response received')
            if (!closed) {
              stream.writeSSE({
                event: 'error',
                data: JSON.stringify({ error: 'Agent did not respond — it may have encountered an internal error. Please try again.' }),
              })
            }
            finalize(null)
          }

          // Inactivity timer — reset on every meaningful event
          let turnTimer = setTimeout(onTimeout, TURN_TIMEOUT_MS)

          const resetTurnTimer = () => {
            clearTimeout(turnTimer)
            turnTimer = setTimeout(onTimeout, TURN_TIMEOUT_MS)
          }

          /** Emit a done SSE event exactly once, then reset deltaBuffer. */
          const emitDone = async (content: string) => {
            if (doneEmitted) return
            doneEmitted = true
            doneSent = true
            lastDoneText = content || null
            await stream.writeSSE({
              event: 'done',
              data: JSON.stringify({ content }),
            })
            deltaBuffer = ''
          }

          const finalize = (result: string | null) => {
            if (resolved) return
            resolved = true
            clearTimeout(turnTimer)
            connectedWs.removeListener('message', onMessage)
            connectedWs.removeListener('close', onClose)
            connectedWs.removeListener('error', onError)
            resolve(result)
          }

          const onMessage = async (data: WebSocket.Data) => {
            if (closed || resolved) return

            try {
              const raw = data.toString()
              const msg = JSON.parse(raw)

              const payload_summary = msg.payload
                ? (() => {
                    const p = msg.payload
                    const parts = [`stream=${p.stream ?? ''}`, `state=${p.state ?? ''}`]
                    if (p.data?.phase) parts.push(`phase=${p.data.phase}`)
                    if (p.state === 'error') parts.push(`error=${JSON.stringify(p.error ?? p.message ?? 'none')}`)
                    return parts.join(' ')
                  })()
                : ''
              const summary =
                msg.type === 'event'
                  ? `event=${msg.event} ${payload_summary}`
                  : `type=${msg.type} ok=${msg.ok}`
              console.log(`[chat] WS msg: ${summary}`)

              // Agent events — assistant deltas, tool calls, lifecycle
              if (msg.type === 'event' && msg.event === 'agent') {
                const payload = msg.payload

                if (payload?.stream === 'assistant') {
                  const delta = payload.data?.delta ?? ''
                  if (delta) {
                    resetTurnTimer()
                    deltaBuffer += delta
                    await stream.writeSSE({
                      event: 'delta',
                      data: JSON.stringify({ content: delta }),
                    })
                  }
                } else if (payload?.stream === 'tool') {
                  // Flush any buffered text as a text_block before tool events
                  // so the frontend can render them as separate messages
                  if (deltaBuffer) {
                    await stream.writeSSE({
                      event: 'text_block',
                      data: JSON.stringify({ content: deltaBuffer }),
                    })
                    deltaBuffer = ''
                  }
                  resetTurnTimer()
                  hadToolOutput = true

                  // Normalize OpenClaw tool event to consistent shape for frontend
                  // OpenClaw sends: { phase, name, toolCallId, args, result }
                  // Frontend expects: { state, id, tool, args, output }
                  const td = payload.data ?? {}
                  const phase = td.phase ?? ''
                  const normalizedState =
                    phase === 'start' || phase === 'running' ? 'start'
                    : phase === 'end' || phase === 'complete' || phase === 'done' || phase === 'result' ? 'end'
                    : phase === 'error' ? 'error'
                    : phase || 'start'
                  await stream.writeSSE({
                    event: 'tool',
                    data: JSON.stringify({
                      stream: 'tool',
                      state: normalizedState,
                      data: {
                        id: td.toolCallId ?? td.id ?? `tool-${Date.now()}`,
                        tool: td.name ?? td.tool ?? 'unknown',
                        name: td.name ?? td.tool ?? 'unknown',
                        args: td.args ?? td.arguments ?? td.input ?? undefined,
                        output: td.result ?? td.output ?? undefined,
                        error: td.error ?? undefined,
                      },
                    }),
                  })
                } else if (payload?.stream === 'lifecycle' && payload.data?.phase === 'end') {
                  lifecycleEnded = true
                  resetTurnTimer()
                  if (doneSent) {
                    finalize(lastDoneText ?? deltaBuffer ?? null)
                    return
                  }
                  if (deltaBuffer) {
                    await emitDone(deltaBuffer)
                    finalize(deltaBuffer)
                    return
                  }
                  // Tool-only turns (e.g. file edits with no text reply) are valid
                  if (hadToolOutput) {
                    await emitDone('')
                    finalize(null)
                    return
                  }
                  await stream.writeSSE({
                    event: 'error',
                    data: JSON.stringify({ error: 'Agent finished without producing output' }),
                  })
                  finalize(null)
                  return
                }
              }

              // Chat events — detect tool calls in content parts and emit
              // text_block / tool events. "final" signals one turn's completion.
              if (msg.type === 'event' && msg.event === 'chat') {
                resetTurnTimer() // Chat state change
                const payload = msg.payload
                const parts: { type: string; [key: string]: unknown }[] = payload.message?.content ?? []

                // Log content part types for debugging
                if (parts.length > 0) {
                  const types = parts.map((p: { type: string }) => p.type)
                  console.log(`[chat] content parts (${parts.length}): ${types.join(', ')}`)
                }

                // Scan for NEW non-text parts (tool calls, tool results)
                // These appear in the chat message content alongside text parts
                for (let i = lastSeenPartsCount; i < parts.length; i++) {
                  const part = parts[i]
                  if (part.type !== 'text') {
                    // Flush buffered text before the tool part
                    if (deltaBuffer) {
                      await stream.writeSSE({
                        event: 'text_block',
                        data: JSON.stringify({ content: deltaBuffer }),
                      })
                      deltaBuffer = ''
                    }

                    // Emit as a tool event
                    hadToolOutput = true
                    const isResult = part.type === 'tool_result' || part.type === 'tool-result'
                    await stream.writeSSE({
                      event: 'tool',
                      data: JSON.stringify({
                        stream: 'tool',
                        state: isResult ? 'end' : 'start',
                        data: part,
                      }),
                    })
                  }
                }
                lastSeenPartsCount = parts.length

                const text = parts
                  .filter((p) => p.type === 'text')
                  .map((p) => (p as { type: string; text: string }).text)
                  .join('')

                if (payload.state === 'final' || payload.state === 'done' || payload.state === 'completed') {
                  const doneText = text || deltaBuffer
                  await emitDone(doneText)

                  if (lifecycleEnded) {
                    // This is the last turn in this agent response cycle.
                    finalize(doneText || null)
                  }
                  // If lifecycle hasn't ended, there may be more turns
                  // (e.g. tool calls). Keep listening.
                } else if (payload.state === 'error') {
                  const errorDetail = payload.error ?? payload.message?.error ?? JSON.stringify(payload)
                  console.error(`[chat] Chat error from agent:`, JSON.stringify(payload))
                  await stream.writeSSE({
                    event: 'error',
                    data: JSON.stringify({ error: errorDetail }),
                  })
                  finalize(null)
                }
              }

              // Response error (e.g. chat.send failed)
              if (msg.type === 'res' && msg.ok === false) {
                await stream.writeSSE({
                  event: 'error',
                  data: JSON.stringify({ error: msg.error?.message ?? 'Request error' }),
                })
                finalize(null)
              }
            } catch (err) {
              console.error('[chat] Failed to parse WS message:', err)
            }
          }

          const onClose = (code: number, reason: Buffer) => {
            console.log(
              `[chat] WebSocket closed code=${code} reason=${reason?.toString() ?? 'none'}`,
            )
            if (!doneSent && !closed) {
              stream.writeSSE({
                event: 'error',
                data: JSON.stringify({ error: 'Connection closed unexpectedly' }),
              })
            }
            finalize(null)
          }

          const onError = (err: Error) => {
            console.error('[chat] WebSocket error:', err)
            if (!closed) {
              stream.writeSSE({
                event: 'error',
                data: JSON.stringify({ error: 'WebSocket error' }),
              })
            }
            cleanup()
            finalize(null)
          }

          connectedWs.on('message', onMessage)
          connectedWs.on('close', onClose)
          connectedWs.on('error', onError)
        })
      }

      // Main loop: listen for turns, check for @mentions, send follow-ups
      let lastText = await listenForTurn()

      while (lastText && !closed) {
        // Only trigger on NEW @mentions — deduplicate by agent name and ignore
        // agents already invoked in prior rounds
        const agentNames = subAgents ? Object.keys(subAgents) : []
        const seen = new Set(mentionedAgents)
        const mentions = extractMentions(lastText, agentNames).filter((m) => {
          if (seen.has(m.agent)) return false
          seen.add(m.agent)
          return true
        })

        if (mentions.length === 0 || mentionDepth >= MAX_MENTION_DEPTH) {
          // No new mentions or depth exceeded — we're done
          break
        }

        mentionDepth++
        for (const m of mentions) mentionedAgents.add(m.agent)
        console.log(`[chat] Detected ${mentions.length} new @mention(s), depth=${mentionDepth}`)

        // Process mentions in parallel — emit thread_start immediately,
        // then query sub-agents concurrently, emitting results as they arrive.
        const threadReplies: string[] = []

        // Emit all thread_start events up front
        const mentionJobs = mentions.map((mention) => ({
          mention,
          threadId: generateId(),
        }))

        for (const { mention, threadId } of mentionJobs) {
          await stream.writeSSE({
            event: 'thread_start',
            data: JSON.stringify({
              threadId,
              from: 'master',
              to: mention.agent,
              message: mention.message,
            }),
          })
        }

        // Query all sub-agents concurrently
        const results = await Promise.all(
          mentionJobs.map(async ({ mention, threadId }) => {
            let response: string
            const sub = subAgents?.[mention.agent]

            if (sub) {
              // Real sub-agent connection
              console.log(`[chat] Querying real sub-agent ${mention.agent} at ${sub.flyApp}`)
              response = await querySubAgent(sub.flyApp, sub.token ?? agentToken, mention.message)
            } else {
              // Safety net — agent name matched but no sub-agent configured
              console.log(`[chat] No sub-agent configured for ${mention.agent}, using generic fallback`)
              await sleep(300)
              response = `[${mention.agent} is not available — no machine configured for this role]`
            }

            return { mention, threadId, response }
          }),
        )

        // Emit thread_message + thread_end for each result
        for (const { mention, threadId, response } of results) {
          await stream.writeSSE({
            event: 'thread_message',
            data: JSON.stringify({
              threadId,
              agent: mention.agent,
              content: response,
            }),
          })

          await stream.writeSSE({
            event: 'thread_end',
            data: JSON.stringify({ threadId }),
          })

          threadReplies.push(`@${mention.agent} replied: ${response}`)
        }

        // Send follow-up chat.send so the agent can synthesize
        const followUpMessage = `[Thread] ${threadReplies.join('\n\n[Thread] ')}`

        const followUpRequest = {
          type: 'req',
          id: generateId(),
          method: 'chat.send',
          params: {
            sessionKey,
            message: followUpMessage,
            idempotencyKey: generateId(),
          },
        }

        connectedWs.send(JSON.stringify(followUpRequest))
        console.log(`[chat] Sent follow-up chat.send for synthesis (depth=${mentionDepth})`)

        // Listen for the agent's synthesis turn
        lastText = await listenForTurn()
      }

      // All done — emit end
      if (!closed) {
        await stream.writeSSE({
          event: 'end',
          data: JSON.stringify({}),
        })
      }

      cleanup()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[chat] Error:', message)
      if (!closed) {
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({ error: message }),
        })
      }
    } finally {
      clearTimeout(timeout)
      cleanup()
    }
  })
})

/**
 * Open a WebSocket to an OpenClaw agent and complete the v3 handshake.
 * Returns a connected, authenticated WebSocket ready for chat.send.
 *
 * Steps: TCP open → wait for connect.challenge → send connect → wait for hello-ok.
 * Throws on any failure so callers can retry the entire sequence atomically.
 */
async function connectAndHandshake(
  wsUrl: string,
  targetApp: string,
  agentToken: string | undefined,
  timeoutMs: number = 30_000,
): Promise<WebSocket> {
  const ws = new WebSocket(wsUrl, {
    origin: `https://${targetApp}.fly.dev`,
  })

  // Step 0: Wait for TCP connection
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      // Swallow the error that terminate() emits — we're already rejecting.
      ws.removeAllListeners()
      ws.on('error', () => {})
      ws.terminate()
      reject(new Error('WebSocket connection timeout'))
    }, timeoutMs)

    ws.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })

    ws.on('open', () => {
      clearTimeout(timer)
      resolve()
    })
  })

  console.log('[chat] WebSocket connected')

  // Step 1: Wait for connect.challenge
  const challengeMsg = await waitForMessage(ws, 10_000)
  const challenge = JSON.parse(challengeMsg)

  if (challenge.type !== 'event' || challenge.event !== 'connect.challenge') {
    ws.close()
    throw new Error(`Expected connect.challenge, got: ${challengeMsg}`)
  }

  console.log('[chat] Received connect.challenge')

  // Step 2: Send connect request
  // caps: ["tool-events"] tells OpenClaw to emit stream:tool WS events
  const connectParams: Record<string, unknown> = {
    minProtocol: 3,
    maxProtocol: 3,
    client: {
      id: 'openclaw-control-ui',
      version: '1.0.0',
      platform: 'node',
      mode: 'backend',
    },
    role: 'operator',
    scopes: ['operator.admin'],
    caps: ['tool-events'],
  }

  if (agentToken) {
    connectParams.auth = { token: agentToken }
  }

  ws.send(
    JSON.stringify({
      type: 'req',
      id: generateId(),
      method: 'connect',
      params: connectParams,
    }),
  )

  console.log('[chat] Sent connect request')

  // Step 3: Wait for hello-ok
  const helloMsg = await waitForMessage(ws, 10_000)
  const hello = JSON.parse(helloMsg)

  if (hello.type === 'res' && hello.ok === false) {
    ws.close()
    throw new Error(`Connect rejected: ${JSON.stringify(hello.error)}`)
  }

  console.log('[chat] Handshake complete')
  return ws
}

/** Wait for the next WebSocket message within a timeout. */
function waitForMessage(ws: WebSocket, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for WS message (${timeoutMs}ms)`))
    }, timeoutMs)

    const onMessage = (data: WebSocket.Data) => {
      clearTimeout(timer)
      ws.removeListener('message', onMessage)
      resolve(data.toString())
    }

    ws.on('message', onMessage)
  })
}

/** Generate a short random ID for request correlation. */
function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** Sleep for ms milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Real sub-agent querying via HTTP /v1/chat/completions
// ---------------------------------------------------------------------------

interface SubAgentInfo {
  flyApp: string
  token?: string
}

/**
 * Query a sub-agent via its OpenClaw HTTP chat completions endpoint.
 * Simple POST → JSON response. No WebSocket handshake, no lifecycle
 * tracking, no connection state to manage.
 *
 * Never throws — returns an error string on failure so the master agent
 * can see it in the synthesis message.
 */
async function querySubAgent(
  flyApp: string,
  token: string | undefined,
  message: string,
): Promise<string> {
  const url = `https://${flyApp}.fly.dev/v1/chat/completions`
  console.log(`[sub-agent] POST ${url}`)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
      }),
      signal: AbortSignal.timeout(60_000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[sub-agent] ${flyApp} returned ${res.status}: ${body.slice(0, 200)}`)
      return `[Error: ${flyApp} returned HTTP ${res.status}: ${body.slice(0, 200)}]`
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const text = data.choices?.[0]?.message?.content ?? ''

    console.log(`[sub-agent] Got response from ${flyApp} (${text.length} chars)`)
    return text || `[Error: ${flyApp} returned empty response]`
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    console.error(`[sub-agent] Error querying ${flyApp}:`, msg)
    return `[Error: failed to reach ${flyApp}: ${msg}]`
  }
}

const port = Number(process.env.PORT ?? 8080)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`SSE Gateway listening on :${info.port}`)
})
