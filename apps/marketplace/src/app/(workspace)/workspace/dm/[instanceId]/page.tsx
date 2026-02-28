import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'
import { redirect } from 'next/navigation'
import { DiscordChatPanel } from '@/components/discord-chat-panel'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { AgentAvatar } from '@/lib/agents'

export default async function DirectMessagePage({
  params,
}: {
  params: Promise<{ instanceId: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const { instanceId } = await params
  const service = createServiceClient()

  const { data: instance } = await service
    .from('agent_instances')
    .select('id, status, display_name, agents!inner(name, category, icon_url)')
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .in('status', ['running', 'suspended', 'stopped'])
    .limit(1)
    .single()

  if (!instance) redirect('/workspace/home')

  const agent = (instance as Record<string, unknown>).agents as {
    name: string; category: string; icon_url: string | null
  }
  const agentName = instance.display_name ?? agent.name

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border/40 bg-background px-4 rounded-t-xl">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-1 data-[orientation=vertical]:h-4"
        />
        <AgentAvatar
          name={agentName}
          category={agent.category}
          iconUrl={agent.icon_url}
          size="xs"
        />
        <span className="text-sm font-medium truncate">{agentName}</span>
      </header>

      <DiscordChatPanel
        agentInstanceId={instance.id}
        agentName={agentName}
        agentCategory={agent.category}
        agentStatus={instance.status}
      />
    </div>
  )
}
