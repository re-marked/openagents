import { createClient } from '@openagents/db/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const agentInstanceId = searchParams.get('agentInstanceId')

  if (!agentInstanceId) {
    return NextResponse.json({ error: 'Missing agentInstanceId' }, { status: 400 })
  }

  // Find the most recent open session for this user + instance
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('instance_id', agentInstanceId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (!session) {
    return NextResponse.json({ messages: [] })
  }

  const sessionId = (session as { id: string }).id

  // Load messages for this session
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at, tool_use')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }

  return NextResponse.json({ messages: messages ?? [] })
}
