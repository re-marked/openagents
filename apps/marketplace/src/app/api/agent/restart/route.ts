import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'
import { FlyClient } from '@agentbay/fly'

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.instanceId) {
    return NextResponse.json({ error: 'Missing instanceId' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: instance } = await service
    .from('agent_instances')
    .select('id, status, fly_app_name, fly_machine_id')
    .eq('id', body.instanceId)
    .eq('user_id', user.id)
    .single()

  if (!instance) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  try {
    const fly = new FlyClient()

    // Stop if running/started
    if (instance.status === 'running') {
      await fly.stopMachine(instance.fly_app_name, instance.fly_machine_id)
      await fly.waitForMachineState(instance.fly_app_name, instance.fly_machine_id, 'stopped', 30)
    }

    // Start
    await fly.startMachine(instance.fly_app_name, instance.fly_machine_id)

    await service
      .from('agent_instances')
      .update({ status: 'running' })
      .eq('id', body.instanceId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Failed to restart agent:', err)
    return NextResponse.json({ error: 'Failed to restart agent' }, { status: 500 })
  }
}
