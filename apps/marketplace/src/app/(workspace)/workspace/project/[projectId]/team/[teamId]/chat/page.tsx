import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@openagents/db/server'
import { redirect } from 'next/navigation'
import { ChatPanel } from '@/components/function/chat-panel'

interface InstanceRow {
  id: string
  status: string
  agent_id: string
  agents: { name: string } | null
}

export default async function ChatHubPage({
  params,
}: {
  params: Promise<{ projectId: string; teamId: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const { teamId } = await params

  // For MVP: teamId maps to agentInstanceId
  const agentInstanceId = teamId

  const supabase = await createClient()
  const { data: instanceData } = await supabase
    .from('agent_instances')
    .select('id, status, agent_id, agents(name)')
    .eq('id', agentInstanceId)
    .eq('user_id', user.id)
    .single()

  const instance = instanceData as InstanceRow | null

  if (!instance) {
    redirect('/workspace/home')
  }

  const agentName = instance.agents?.name ?? 'Assistant'

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-sm font-semibold">{agentName}</h1>
            <p className="text-muted-foreground text-xs capitalize">{instance.status}</p>
          </div>
        </div>
      </header>
      <ChatPanel agentInstanceId={instance.id} />
    </div>
  )
}
