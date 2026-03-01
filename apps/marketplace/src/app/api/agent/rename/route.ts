import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'

const renameSchema = z.object({
  instanceId: z.string().uuid(),
  name: z.string().trim().min(1, 'Name cannot be empty').max(100),
})

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = renameSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join(', ') }, { status: 422 })
  }

  const name = parsed.data.name
    .replace(/<[^>]*>/g, '')     // strip HTML tags
    .replace(/[\x00-\x1F]/g, '') // strip control chars

  if (!name) {
    return NextResponse.json({ error: 'Name cannot be empty after sanitization' }, { status: 400 })
  }
  const service = createServiceClient()

  const { data: instance } = await service
    .from('agent_instances')
    .select('id')
    .eq('id', parsed.data.instanceId)
    .eq('user_id', user.id)
    .single()

  if (!instance) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const { error } = await service
    .from('agent_instances')
    .update({ display_name: name })
    .eq('id', parsed.data.instanceId)

  if (error) {
    return NextResponse.json({ error: 'Failed to rename agent' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, name })
}
