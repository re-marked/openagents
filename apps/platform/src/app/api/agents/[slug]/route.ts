import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { slug } = await params

  const service = createServiceClient()
  const { data, error } = await service
    .from('agents')
    .select('*')
    .eq('slug', slug)
    .eq('creator_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
