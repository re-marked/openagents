import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'
import { FlyClient } from '@agentbay/fly'

const CONFIG_PATH = '/data/openclaw.json'

function isMock(flyAppName: string) {
  return flyAppName.startsWith('mock-')
}

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
  if (!instanceId) return NextResponse.json({ error: 'Missing instanceId' }, { status: 400 })

  const instance = await getInstance(instanceId, user.id)
  if (!instance) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  if (instance.status !== 'running') {
    return NextResponse.json({ error: 'Agent must be running' }, { status: 409 })
  }

  // Mock mode
  if (isMock(instance.fly_app_name)) {
    return NextResponse.json({ model: 'google/gemini-2.5-flash' })
  }

  try {
    const fly = new FlyClient()
    const raw = await fly.readFile(instance.fly_app_name, instance.fly_machine_id, CONFIG_PATH)
    const config = JSON.parse(raw)
    const model = config?.agents?.defaults?.model?.primary ?? 'unknown'
    return NextResponse.json({ model })
  } catch {
    return NextResponse.json({ model: 'unknown' })
  }
}

export async function PUT(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.instanceId || !body?.model) {
    return NextResponse.json({ error: 'Missing instanceId or model' }, { status: 400 })
  }

  const instance = await getInstance(body.instanceId, user.id)
  if (!instance) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  if (instance.status !== 'running') {
    return NextResponse.json({ error: 'Agent must be running' }, { status: 409 })
  }

  // Mock mode — accept silently
  if (isMock(instance.fly_app_name)) {
    return NextResponse.json({ ok: true })
  }

  try {
    const fly = new FlyClient()

    let config: Record<string, unknown> = {}
    try {
      const raw = await fly.readFile(instance.fly_app_name, instance.fly_machine_id, CONFIG_PATH)
      config = JSON.parse(raw)
    } catch {
      // No existing config — start fresh
    }

    const agents = (config.agents ?? {}) as Record<string, unknown>
    const defaults = (agents.defaults ?? {}) as Record<string, unknown>
    const modelConfig = (defaults.model ?? {}) as Record<string, unknown>
    modelConfig.primary = body.model
    defaults.model = modelConfig
    agents.defaults = defaults
    config.agents = agents

    await fly.writeFile(
      instance.fly_app_name,
      instance.fly_machine_id,
      CONFIG_PATH,
      JSON.stringify(config, null, 2)
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update model'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
