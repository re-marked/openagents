import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

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
    allowHeaders: ['Content-Type', 'Authorization', 'x-machine-id', 'x-fly-app', 'x-gateway-token'],
  }),
)

/** Health check */
app.get('/health', (c) => c.json({ status: 'ok', machine: process.env.FLY_MACHINE_ID ?? 'local' }))

/**
 * SSE routing endpoint.
 *
 * Endpoint matches OpenClaw's /v1/responses so fly-replay forwards directly.
 *
 * Flow:
 * 1. Vercel POSTs here with x-fly-app + x-machine-id + Authorization headers
 * 2. Gateway validates x-gateway-token (our internal secret)
 * 3. Gateway returns fly-replay header → Fly proxy routes to the agent machine
 * 4. Agent machine receives the request at /v1/responses with Authorization header
 * 5. OpenClaw processes it and streams SSE response back through Fly proxy
 */
app.post('/v1/responses', async (c) => {
  const gatewayToken = c.req.header('x-gateway-token')
  const targetApp = c.req.header('x-fly-app')
  const targetMachineId = c.req.header('x-machine-id')

  // Validate internal gateway secret
  if (!gatewayToken || gatewayToken !== process.env.GATEWAY_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (!targetApp || !targetMachineId) {
    return c.json({ error: 'Missing x-fly-app or x-machine-id header' }, 400)
  }

  // fly-replay routes the request to the correct agent machine in the correct app.
  // Fly's proxy replays the full request (headers + body) to the target,
  // and streams the response back to the caller.
  c.header('fly-replay', `app=${targetApp},instance=${targetMachineId}`)
  return c.text('Replaying to agent machine', 409)
})

const port = Number(process.env.PORT ?? 8080)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`SSE Gateway listening on :${info.port}`)
})
