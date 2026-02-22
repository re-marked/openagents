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
      'https://openagents.com',
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

const AGENT_NAMES = ['researcher', 'coder', 'analyst', 'writer'] as const
type AgentName = (typeof AGENT_NAMES)[number]

const MENTION_RE = new RegExp(`@(${AGENT_NAMES.join('|')})\\b`, 'g')

/** Hardcoded Phase 1 responses per agent type. */
const AGENT_RESPONSES: Record<AgentName, (msg: string) => string> = {
  researcher: (msg) =>
    `Hey! I looked into this. Here's what I found:\n\n1. Key finding relevant to "${msg.slice(0, 50)}${msg.length > 50 ? '...' : ''}"\n2. Supporting evidence from recent sources\n3. Some important context to consider\n\nLet me know if you want me to dig deeper into any of these.`,
  coder: (msg) =>
    `On it! I've analyzed the requirements. Here's my take:\n\n- Approach: Based on "${msg.slice(0, 40)}${msg.length > 40 ? '...' : ''}"\n- Key considerations: architecture, testing, maintainability\n- Ready to implement once you give the go-ahead.`,
  analyst: (msg) =>
    `Good question. Here's my analysis:\n\n- The data suggests several interesting patterns related to "${msg.slice(0, 40)}${msg.length > 40 ? '...' : ''}"\n- Key patterns: correlation, causation, outliers\n- My recommendation: proceed with a data-driven approach\n\nHappy to break this down further.`,
  writer: (msg) =>
    `Got it! Here's a draft based on what you described:\n\n[Draft for: "${msg.slice(0, 50)}${msg.length > 50 ? '...' : ''}"]\n\nWant me to adjust the tone or focus?`,
}

interface MentionMatch {
  agent: AgentName
  message: string
}

/** Extract all @mentions and the text directed at each agent. */
function extractMentions(text: string): MentionMatch[] {
  const mentions: MentionMatch[] = []
  const matches = [...text.matchAll(MENTION_RE)]

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const agent = match[1] as AgentName
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
 *    If found, emits thread events with hardcoded responses and sends
 *    a follow-up chat.send so the agent can synthesize.
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

  let body: { sessionKey: string; message: string; idempotencyKey?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { sessionKey, message, idempotencyKey } = body
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
      // Set Origin header to match the target host — required for the
      // browser origin check when connecting as control-ui client.
      ws = new WebSocket(wsUrl, {
        origin: `https://${targetApp}.fly.dev`,
      })

      await new Promise<void>((resolve, reject) => {
        const connectTimeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'))
        }, 30_000)

        ws!.on('error', (err) => {
          clearTimeout(connectTimeout)
          reject(err)
        })

        ws!.on('open', () => {
          clearTimeout(connectTimeout)
          console.log('[chat] WebSocket connected')
          resolve()
        })
      })

      // --- OpenClaw protocol v3 handshake ---
      // Step 1: Wait for connect.challenge event
      const challengeMsg = await waitForMessage(ws, 10_000)
      const challenge = JSON.parse(challengeMsg)

      if (challenge.type !== 'event' || challenge.event !== 'connect.challenge') {
        throw new Error(`Expected connect.challenge, got: ${challengeMsg}`)
      }

      console.log('[chat] Received connect.challenge')

      // Step 2: Send connect request (protocol v3 frame format)
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
      }

      if (agentToken) {
        connectParams.auth = { token: agentToken }
      }

      const connectRequest = {
        type: 'req',
        id: generateId(),
        method: 'connect',
        params: connectParams,
      }

      ws.send(JSON.stringify(connectRequest))
      console.log('[chat] Sent connect request')

      // Step 3: Wait for hello-ok response
      const helloMsg = await waitForMessage(ws, 10_000)
      const hello = JSON.parse(helloMsg)

      if (hello.type === 'res' && hello.ok === false) {
        throw new Error(`Connect failed: ${JSON.stringify(hello.error)}`)
      }

      console.log('[chat] Handshake complete')

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

      ws.send(JSON.stringify(chatRequest))
      console.log('[chat] Sent chat.send')

      // --- Multi-turn @mention loop ---
      // We listen for the agent's response. When a "done" event arrives with
      // @mentions, we emit thread events, then send a follow-up chat.send
      // for the agent to synthesize. This repeats up to MAX_MENTION_DEPTH.
      const MAX_MENTION_DEPTH = 3
      let mentionDepth = 0

      /**
       * Listen for one full agent turn (deltas → done, or lifecycle end + done).
       * Returns the completed text from the "done" event, or null on error/close.
       */
      const listenForTurn = (): Promise<string | null> => {
        return new Promise<string | null>((resolve) => {
          let lifecycleEnded = false
          let doneSent = false

          const onMessage = async (data: WebSocket.Data) => {
            if (closed) return

            try {
              const raw = data.toString()
              const msg = JSON.parse(raw)

              const summary =
                msg.type === 'event'
                  ? `event=${msg.event} stream=${msg.payload?.stream ?? ''} state=${msg.payload?.state ?? ''}`
                  : `type=${msg.type} ok=${msg.ok}`
              console.log(`[chat] WS msg: ${summary}`)

              // Agent events — assistant deltas, tool calls, lifecycle
              if (msg.type === 'event' && msg.event === 'agent') {
                const payload = msg.payload

                if (payload?.stream === 'assistant') {
                  const delta = payload.data?.delta ?? ''
                  if (delta) {
                    await stream.writeSSE({
                      event: 'delta',
                      data: JSON.stringify({ content: delta }),
                    })
                  }
                } else if (payload?.stream === 'tool') {
                  await stream.writeSSE({
                    event: 'tool',
                    data: JSON.stringify(payload),
                  })
                } else if (payload?.stream === 'lifecycle' && payload.data?.phase === 'end') {
                  lifecycleEnded = true
                }
              }

              // Chat events — "final" signals one turn's completion.
              if (msg.type === 'event' && msg.event === 'chat') {
                const payload = msg.payload
                const parts = payload.message?.content ?? []
                const text = parts
                  .filter((p: { type: string }) => p.type === 'text')
                  .map((p: { text: string }) => p.text)
                  .join('')

                if (payload.state === 'final') {
                  doneSent = true
                  await stream.writeSSE({
                    event: 'done',
                    data: JSON.stringify({ content: text }),
                  })

                  if (lifecycleEnded) {
                    // This is the last turn in this agent response cycle.
                    ws!.removeListener('message', onMessage)
                    resolve(text)
                  }
                  // If lifecycle hasn't ended, there may be more turns
                  // (e.g. tool calls). Keep listening.
                } else if (payload.state === 'error') {
                  await stream.writeSSE({
                    event: 'error',
                    data: JSON.stringify({ error: payload.error ?? 'Agent error' }),
                  })
                  ws!.removeListener('message', onMessage)
                  resolve(null)
                }
              }

              // Response error (e.g. chat.send failed)
              if (msg.type === 'res' && msg.ok === false) {
                await stream.writeSSE({
                  event: 'error',
                  data: JSON.stringify({ error: msg.error?.message ?? 'Request error' }),
                })
                ws!.removeListener('message', onMessage)
                resolve(null)
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
            ws!.removeListener('message', onMessage)
            ws!.removeListener('close', onClose)
            ws!.removeListener('error', onError)
            resolve(null)
          }

          const onError = (err: Error) => {
            console.error('[chat] WebSocket error:', err)
            if (!closed) {
              stream.writeSSE({
                event: 'error',
                data: JSON.stringify({ error: 'WebSocket error' }),
              })
            }
            ws!.removeListener('message', onMessage)
            ws!.removeListener('close', onClose)
            ws!.removeListener('error', onError)
            cleanup()
            resolve(null)
          }

          ws!.on('message', onMessage)
          ws!.on('close', onClose)
          ws!.on('error', onError)
        })
      }

      // Main loop: listen for turns, check for @mentions, send follow-ups
      let lastText = await listenForTurn()

      while (lastText && !closed) {
        const mentions = extractMentions(lastText)

        if (mentions.length === 0 || mentionDepth >= MAX_MENTION_DEPTH) {
          // No mentions or depth exceeded — we're done
          break
        }

        mentionDepth++
        console.log(`[chat] Detected ${mentions.length} @mention(s), depth=${mentionDepth}`)

        // Process each mention: emit thread events with hardcoded responses
        const threadReplies: string[] = []

        for (const mention of mentions) {
          const threadId = generateId()
          const response = AGENT_RESPONSES[mention.agent](mention.message)

          // thread_start
          await stream.writeSSE({
            event: 'thread_start',
            data: JSON.stringify({
              threadId,
              from: 'master',
              to: mention.agent,
              message: mention.message,
            }),
          })

          // Simulate a brief delay for realism
          await sleep(300)

          // thread_message (the sub-agent's response)
          await stream.writeSSE({
            event: 'thread_message',
            data: JSON.stringify({
              threadId,
              agent: mention.agent,
              content: response,
            }),
          })

          // thread_end
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

        ws.send(JSON.stringify(followUpRequest))
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

const port = Number(process.env.PORT ?? 8080)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`SSE Gateway listening on :${info.port}`)
})
