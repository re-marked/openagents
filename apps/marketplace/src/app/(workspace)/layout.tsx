import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@agentbay/db/server'
import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // Load ALL user's agent instances (not just test-agent)
  const { data: instances } = await service
    .from('agent_instances')
    .select('id, display_name, status, agents!inner(name, slug, category, tagline, icon_url)')
    .eq('user_id', user.id)
    .not('status', 'eq', 'destroyed')
    .order('created_at', { ascending: true })

  type AgentInfo = {
    instanceId: string
    name: string
    slug: string
    category: string
    tagline: string
    status: string
    iconUrl: string | null
  }

  const agents: AgentInfo[] = (instances ?? []).map((inst) => {
    const agent = (inst as Record<string, unknown>).agents as {
      name: string
      slug: string
      category: string
      tagline: string
      icon_url: string | null
    }
    return {
      instanceId: inst.id,
      name: inst.display_name ?? agent.name,
      slug: agent.slug,
      category: agent.category,
      tagline: agent.tagline,
      status: inst.status,
      iconUrl: agent.icon_url,
    }
  })

  return (
    <SidebarProvider className="h-svh !min-h-0">
      <AppSidebar
        userEmail={user.email}
        agents={agents}
      />
      <SidebarInset className="overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
