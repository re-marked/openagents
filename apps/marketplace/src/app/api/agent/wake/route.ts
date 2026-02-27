import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'
import { FlyClient } from '@agentbay/fly'

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const agentInstanceId = body?.agentInstanceId
  if (!agentInstanceId) {
    return NextResponse.json({ error: 'Missing agentInstanceId' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: instance } = await service
    .from('agent_instances')
    .select('id, status, fly_app_name, fly_machine_id, user_id')
    .eq('id', agentInstanceId)
    .eq('user_id', user.id)
    .single()

  if (!instance) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  if (instance.status !== 'suspended' && instance.status !== 'stopped') {
    return NextResponse.json({ error: `Agent is ${instance.status}, not suspended or stopped` }, { status: 400 })
  }

  try {
    const fly = new FlyClient()
    await fly.startMachine(instance.fly_app_name, instance.fly_machine_id)

    await service
      .from('agent_instances')
      .update({ status: 'running' })
      .eq('id', agentInstanceId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Failed to wake agent:', err)
    return NextResponse.json(
      { error: 'Failed to wake agent machine' },
      { status: 500 }
    )
  }
}
