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
 * 2. Gateway opens WebSocket to agent machine via public URL
 * 3. Performs OpenClaw protocol v3 handshake (connect.challenge -> connect -> hello-ok)
 * 4. Sends chat.send with sessionKey + message
 * 5. Translates streaming WS events into SSE events back to caller
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
      // We connect as openclaw-control-ui with dangerouslyDisableDeviceAuth
      // enabled on the agent config. This preserves scopes for device-less
      // connections (OpenClaw 2026.2.17+ clears scopes without a device
      // unless allowControlUiBypass is true).
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

      // --- Send chat.send ---
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

      // --- Stream events back as SSE ---
      // Track whether we received the final chat event so the WS close
      // handler knows not to emit a spurious error.
      let doneSent = false

      await new Promise<void>((resolve, reject) => {
        ws!.on('message', async (data) => {
          if (closed) return

          try {
            const raw = data.toString()
            const msg = JSON.parse(raw)

            // Agent events — assistant stream has per-token deltas
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
              }
            }

            // Chat events — "final" signals completion with full message
            if (msg.type === 'event' && msg.event === 'chat') {
              const payload = msg.payload
              // Extract text from content array: [{type:"text",text:"..."}]
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
                cleanup()
                resolve()
              } else if (payload.state === 'error') {
                await stream.writeSSE({
                  event: 'error',
                  data: JSON.stringify({ error: payload.error ?? 'Agent error' }),
                })
                cleanup()
                resolve()
              }
            }

            // Response to chat.send (may contain error)
            if (msg.type === 'res' && msg.ok === false) {
              await stream.writeSSE({
                event: 'error',
                data: JSON.stringify({ error: msg.error?.message ?? 'Request error' }),
              })
              cleanup()
              resolve()
            }
          } catch (err) {
            console.error('[chat] Failed to parse WS message:', err)
          }
        })

        ws!.on('close', (code, reason) => {
          console.log(`[chat] WebSocket closed code=${code} reason=${reason?.toString() ?? 'none'}`)
          if (!doneSent && !closed) {
            stream.writeSSE({
              event: 'error',
              data: JSON.stringify({ error: 'Connection closed unexpectedly' }),
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
