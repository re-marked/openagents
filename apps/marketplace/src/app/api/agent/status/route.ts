import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'

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
    .select('id, status, fly_app_name')
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .single()

  if (!instance) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  // Mock agents are always "running" regardless of what the health-check sets
  if (instance.fly_app_name?.startsWith('mock-')) {
    return NextResponse.json({ status: 'running' })
  }

  return NextResponse.json({ status: instance.status })
}
