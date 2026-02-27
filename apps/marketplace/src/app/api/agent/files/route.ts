import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'
import { FlyClient } from '@agentbay/fly'

async function getInstance(instanceId: string, userId: string) {
  const service = createServiceClient()
  const { data } = await service
    .from('agent_instances')
    .select('id, status, fly_app_name, fly_machine_id')
    .eq('id', instanceId)
    .eq('user_id', userId)
    .single()
  return data
}

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const instanceId = searchParams.get('instanceId')
  const path = searchParams.get('path')
  const list = searchParams.get('list') === 'true'

  if (!instanceId || !path) {
    return NextResponse.json({ error: 'Missing instanceId or path' }, { status: 400 })
  }

  const instance = await getInstance(instanceId, user.id)
  if (!instance) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  if (instance.status !== 'running') {
    return NextResponse.json({ error: 'Agent must be running' }, { status: 409 })
  }

  try {
    const fly = new FlyClient()
    if (list) {
      const output = await fly.listDir(instance.fly_app_name, instance.fly_machine_id, path)
      return NextResponse.json({ output })
    }
    const content = await fly.readFile(instance.fly_app_name, instance.fly_machine_id, path)
    return NextResponse.json({ content })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to read file'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.instanceId || !body?.path || body?.content === undefined) {
    return NextResponse.json({ error: 'Missing instanceId, path, or content' }, { status: 400 })
  }

  const instance = await getInstance(body.instanceId, user.id)
  if (!instance) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  if (instance.status !== 'running') {
    return NextResponse.json({ error: 'Agent must be running' }, { status: 409 })
  }

  try {
    const fly = new FlyClient()
    await fly.writeFile(instance.fly_app_name, instance.fly_machine_id, body.path, body.content)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to write file'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
