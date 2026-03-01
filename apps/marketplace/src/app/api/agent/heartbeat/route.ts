import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'

export const runtime = 'nodejs'

/**
 * GET /api/agent/heartbeat?instanceId=X
 *
 * Checks if an agent's OpenClaw gateway is actually responsive by proxying
 * to the SSE gateway's /v1/heartbeat endpoint. The client polls this until
 * it gets { status: 'HEARTBEAT_OK' }, at which point it knows the agent is
 * ready to receive chat messages.
 */
export async function GET(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const instanceId = searchParams.get('instanceId')
  if (!instanceId) {
    return NextResponse.json({ error: 'Missing instanceId' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: instance } = await service
    .from('agent_instances')
    .select('id, status, fly_app_name, gateway_token, user_id')
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .single()

  if (!instance) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  // Mock agents are always ready
  if (instance.fly_app_name?.startsWith('mock-')) {
    return NextResponse.json({ status: 'HEARTBEAT_OK' })
  }

  // Agent must be running or suspended (suspended auto-resumes on WS connect)
  if (instance.status !== 'running' && instance.status !== 'suspended') {
    return NextResponse.json(
      { status: 'NOT_READY', error: `Agent is ${instance.status}` },
      { status: 503 },
    )
  }

  if (!instance.fly_app_name) {
    return NextResponse.json(
      { status: 'NOT_READY', error: 'No Fly app configured' },
      { status: 503 },
    )
  }

  const gatewayUrl = process.env.SSE_GATEWAY_URL
  const gatewaySecret = process.env.SSE_GATEWAY_SECRET

  if (!gatewayUrl || !gatewaySecret) {
    return NextResponse.json(
      { status: 'NOT_READY', error: 'Gateway not configured' },
      { status: 503 },
    )
  }

  const agentToken = instance.gateway_token
  if (!agentToken) {
    return NextResponse.json(
      { status: 'NOT_READY', error: 'Agent has no gateway token configured' },
      { status: 503 },
    )
  }

  try {
    const res = await fetch(`${gatewayUrl}/v1/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gateway-token': gatewaySecret,
        'x-fly-app': instance.fly_app_name,
        ...(agentToken ? { 'x-agent-token': agentToken } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Heartbeat request failed'
    return NextResponse.json(
      { status: 'NOT_READY', error: msg },
      { status: 503 },
    )
  }
}
