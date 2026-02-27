import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'
import { redirect } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { AgentHomePage } from './agent-home'

export default async function AgentPage({
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
    .select(
      'id, status, display_name, fly_app_name, fly_machine_id, created_at, agents!inner(name, slug, category, tagline, icon_url)'
    )
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!instance) redirect('/workspace/home')

  const agent = (instance as Record<string, unknown>).agents as {
    name: string
    slug: string
    category: string
    tagline: string | null
    icon_url: string | null
  }
  const agentName = instance.display_name ?? agent.name
  // Mock agents are always "running" regardless of DB status
  const initialStatus = instance.fly_app_name?.startsWith('mock-')
    ? 'running'
    : instance.status

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border/40 bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/workspace/home">Agents</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{agentName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <AgentHomePage
        instanceId={instance.id}
        initialStatus={initialStatus}
        displayName={agentName}
        agentName={agent.name}
        agentSlug={agent.slug}
        agentCategory={agent.category}
        agentTagline={agent.tagline}
        agentIconUrl={agent.icon_url}
        createdAt={instance.created_at}
      />
    </div>
  )
}
