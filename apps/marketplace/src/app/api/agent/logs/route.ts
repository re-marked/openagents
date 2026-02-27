import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'

const FLY_API_BASE = 'https://api.machines.dev/v1'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const instanceId = searchParams.get('instanceId')
  if (!instanceId) return NextResponse.json({ error: 'Missing instanceId' }, { status: 400 })

  const service = createServiceClient()
  const { data: instance } = await service
    .from('agent_instances')
    .select('id, fly_app_name, fly_machine_id')
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .single()

  if (!instance) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  try {
    const token = process.env.FLY_API_TOKEN
    if (!token) throw new Error('FLY_API_TOKEN not configured')

    // Use Fly NATS logs endpoint
    const res = await fetch(
      `${FLY_API_BASE}/apps/${instance.fly_app_name}/machines/${instance.fly_machine_id}/logs?limit=200`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!res.ok) {
      // Fallback: return empty logs if endpoint not available
      return NextResponse.json({ logs: [] })
    }

    const data = await res.json()
    return NextResponse.json({ logs: Array.isArray(data) ? data : data?.data ?? [] })
  } catch {
    return NextResponse.json({ logs: [] })
  }
}
