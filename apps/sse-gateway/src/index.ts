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

/**
 * WebSocket-to-SSE bridge for OpenClaw native sessions.
 *
 * Flow:
 * 1. Vercel POSTs { sessionKey, message, idempotencyKey }
 * 2. Gateway opens WebSocket to agent machine on Fly.io 6PN
 * 3. Performs OpenClaw handshake (connect.challenge → connect → hello-ok)
 * 4. Sends chat.send with sessionKey + message
 * 5. Translates streaming WS events into SSE events back to caller
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

  // Use Fly.io 6PN internal networking to reach the agent machine
  const wsUrl = `ws://${targetApp}.internal:18789/`
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
      ws = new WebSocket(wsUrl)

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

      // --- OpenClaw handshake ---
      // Step 1: Wait for connect.challenge
      const challengeMsg = await waitForMessage(ws, 10_000)
      const challenge = JSON.parse(challengeMsg)

      if (challenge.type !== 'event' || challenge.event !== 'connect.challenge') {
        throw new Error(`Expected connect.challenge, got: ${challengeMsg}`)
      }

      console.log('[chat] Received connect.challenge')

      // Step 2: Send connect request with auth
      const connectRequest: Record<string, unknown> = {
        type: 'request',
        id: generateId(),
        method: 'connect',
        params: {
          protocol: 3,
          role: 'operator',
        },
      }

      if (agentToken) {
        ;(connectRequest.params as Record<string, unknown>).auth = {
          type: 'token',
          token: agentToken,
        }
      }

      ws.send(JSON.stringify(connectRequest))
      console.log('[chat] Sent connect request')

      // Step 3: Wait for hello-ok response
      const helloMsg = await waitForMessage(ws, 10_000)
      const hello = JSON.parse(helloMsg)

      if (hello.type === 'response' && hello.error) {
        throw new Error(`Connect failed: ${JSON.stringify(hello.error)}`)
      }

      console.log('[chat] Handshake complete')

      // --- Send chat.send ---
      const chatRequest: Record<string, unknown> = {
        type: 'request',
        id: generateId(),
        method: 'chat.send',
        params: {
          sessionKey,
          message: { role: 'user', content: message },
        },
      }

      if (idempotencyKey) {
        ;(chatRequest.params as Record<string, unknown>).idempotencyKey = idempotencyKey
      }

      ws.send(JSON.stringify(chatRequest))
      console.log('[chat] Sent chat.send')

      // --- Stream events back as SSE ---
      await new Promise<void>((resolve, reject) => {
        ws!.on('message', (data) => {
          if (closed) return

          try {
            const msg = JSON.parse(data.toString())

            // Chat events (streaming content)
            if (msg.type === 'event' && msg.event === 'chat') {
              const payload = msg.data

              if (payload.state === 'delta') {
                stream.writeSSE({
                  event: 'delta',
                  data: JSON.stringify({ content: payload.content ?? '' }),
                })
              } else if (payload.state === 'final') {
                stream.writeSSE({
                  event: 'done',
                  data: JSON.stringify({ content: payload.content ?? '' }),
                })
                cleanup()
                resolve()
              } else if (payload.state === 'error') {
                stream.writeSSE({
                  event: 'error',
                  data: JSON.stringify({ error: payload.error ?? 'Agent error' }),
                })
                cleanup()
                resolve()
              }
            }

            // Agent events (tool calls)
            if (msg.type === 'event' && msg.event === 'agent') {
              const payload = msg.data
              if (payload.stream === 'tool') {
                stream.writeSSE({
                  event: 'tool',
                  data: JSON.stringify(payload),
                })
              }
            }

            // Response to chat.send (may contain error)
            if (msg.type === 'response' && msg.error) {
              stream.writeSSE({
                event: 'error',
                data: JSON.stringify({ error: msg.error.message ?? 'Request error' }),
              })
              cleanup()
              resolve()
            }
          } catch (err) {
            console.error('[chat] Failed to parse WS message:', err)
          }
        })

        ws!.on('close', () => {
          if (!closed) {
            console.log('[chat] WebSocket closed unexpectedly')
            stream.writeSSE({
              event: 'error',
              data: JSON.stringify({ error: 'Connection closed' }),
            })
          }
          resolve()
        })

        ws!.on('error', (err) => {
          console.error('[chat] WebSocket error:', err)
          if (!closed) {
            stream.writeSSE({
              event: 'error',
              data: JSON.stringify({ error: 'WebSocket error' }),
            })
          }
          cleanup()
          reject(err)
        })
      })
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

const port = Number(process.env.PORT ?? 8080)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`SSE Gateway listening on :${info.port}`)
})
