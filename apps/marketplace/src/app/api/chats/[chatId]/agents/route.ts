import { createClient, createServiceClient } from '@agentbay/db/server'
import { NextResponse } from 'next/server'
import { getChatAgents } from '@/lib/chats/queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { chatId } = await params

  // Verify ownership
  const service = createServiceClient()
  const { data: chat } = await service
    .from('chats')
    .select('id')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 })

  const agents = await getChatAgents(chatId)
  return NextResponse.json({ agents })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { chatId } = await params
  const { instanceId } = await request.json() as { instanceId: string }

  if (!instanceId) {
    return NextResponse.json({ error: 'instanceId is required' }, { status: 400 })
  }

  const service = createServiceClient()

  // Verify chat ownership
  const { data: chat } = await service
    .from('chats')
    .select('id')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 })

  // Verify agent instance ownership
  const { data: instance } = await service
    .from('agent_instances')
    .select('id')
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .single()

  if (!instance) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const { error } = await service
    .from('chat_agents')
    .insert({ chat_id: chatId, instance_id: instanceId })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Agent already in chat' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { chatId } = await params
  const { instanceId } = await request.json() as { instanceId: string }

  if (!instanceId) {
    return NextResponse.json({ error: 'instanceId is required' }, { status: 400 })
  }

  const service = createServiceClient()

  // Verify chat ownership
  const { data: chat } = await service
    .from('chats')
    .select('id')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 })

  const { error } = await service
    .from('chat_agents')
    .delete()
    .eq('chat_id', chatId)
    .eq('instance_id', instanceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
