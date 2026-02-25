import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@openagents/db/server'
import { redirect } from 'next/navigation'
import { DiscordChatPanel } from '@/components/function/discord-chat-panel'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default async function TeamChatPage({
  params,
}: {
  params: Promise<{ projectId: string; teamId: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const { teamId } = await params
  const service = createServiceClient()

  // Find the agent instance linked to this team
  const { data: instance } = await service
    .from('agent_instances')
    .select('id, status')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .in('status', ['running', 'suspended'])
    .limit(1)
    .single()

  if (!instance) redirect('/workspace/home')

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <span className="text-muted-foreground">#</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>team-chat</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <DiscordChatPanel agentInstanceId={instance.id} />
    </div>
  )
}
