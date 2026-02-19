import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { stream } from 'hono/streaming'

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
    allowHeaders: ['Content-Type', 'Authorization', 'x-machine-id', 'x-gateway-token'],
  }),
)

/** Health check — used by Fly.io and monitoring */
app.get('/health', (c) => c.json({ status: 'ok', machine: process.env.FLY_MACHINE_ID ?? 'local' }))

/**
 * SSE proxy endpoint.
 *
 * Flow:
 * 1. Vercel Next.js route handler POSTs here with `x-machine-id` header
 * 2. If this machine IS the target → proxy to OpenClaw on port 18789
 * 3. If this machine IS NOT the target → reply with fly-replay header so
 *    Fly.io routes the request to the correct machine automatically
 */
app.post('/v1/stream', async (c) => {
  const targetMachineId = c.req.header('x-machine-id')
  const currentMachineId = process.env.FLY_MACHINE_ID
  const gatewayToken = c.req.header('x-gateway-token')

  // Validate internal gateway token
  if (!gatewayToken || gatewayToken !== process.env.GATEWAY_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // fly-replay: route to the correct machine if not already on it
  if (targetMachineId && currentMachineId && targetMachineId !== currentMachineId) {
    c.header('fly-replay', `instance=${targetMachineId}`)
    return c.text('Replaying to target machine', 409)
  }

  const body = await c.req.text()
  const authHeader = c.req.header('Authorization') ?? ''

  let upstream: Response
  try {
    upstream = await fetch('http://localhost:18789/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body,
    })
  } catch {
    return c.json({ error: 'Agent machine unreachable' }, 503)
  }

  if (!upstream.ok) {
    return c.json({ error: 'Upstream error', status: upstream.status }, 502)
  }

  // Stream the SSE response back to the caller
  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')

  return stream(c, async (outStream) => {
    const reader = upstream.body?.getReader()
    if (!reader) return

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        await outStream.write(value)
      }
    } finally {
      reader.releaseLock()
    }
  })
})

const port = Number(process.env.PORT ?? 8080)
console.log(`SSE Gateway listening on :${port}`)

export default {
  port,
  fetch: app.fetch,
}
