import { createClient } from '@agentbay/db/server'
import { createServiceClient } from '@agentbay/db/server'
import { NextResponse } from 'next/server'
import { getActiveProjectId } from '@/lib/projects/queries'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { activeProjectId } = await getActiveProjectId(user.id)
  if (!activeProjectId) return NextResponse.json({ chats: [] })

  const service = createServiceClient()
  const { data: chats } = await service
    .from('chats')
    .select('id, name')
    .eq('project_id', activeProjectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!chats || chats.length === 0) return NextResponse.json({ chats: [] })

  const chatIds = chats.map(c => c.id)
  const { data: chatAgents } = await service
    .from('chat_agents')
    .select('chat_id')
    .in('chat_id', chatIds)

  const countMap: Record<string, number> = {}
  for (const ca of chatAgents ?? []) {
    countMap[ca.chat_id] = (countMap[ca.chat_id] ?? 0) + 1
  }

  return NextResponse.json({
    chats: chats.map(c => ({
      id: c.id,
      name: c.name,
      agentCount: countMap[c.id] ?? 0,
    })),
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, projectId } = body as { name?: string; projectId?: string }

  const { activeProjectId } = await getActiveProjectId(user.id)
  const targetProjectId = projectId ?? activeProjectId
  if (!targetProjectId) {
    return NextResponse.json({ error: 'No active project' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: chat, error } = await service
    .from('chats')
    .insert({
      project_id: targetProjectId,
      user_id: user.id,
      name: name ?? 'New Chat',
    })
    .select('id, name')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ chat: { ...chat, agentCount: 0 } })
}
