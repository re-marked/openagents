import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.instanceId || !body?.name?.trim()) {
    return NextResponse.json({ error: 'Missing instanceId or name' }, { status: 400 })
  }

  const name = body.name.trim().slice(0, 100)
  const service = createServiceClient()

  const { data: instance } = await service
    .from('agent_instances')
    .select('id')
    .eq('id', body.instanceId)
    .eq('user_id', user.id)
    .single()

  if (!instance) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const { error } = await service
    .from('agent_instances')
    .update({ display_name: name })
    .eq('id', body.instanceId)

  if (error) {
    return NextResponse.json({ error: 'Failed to rename agent' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, name })
}
