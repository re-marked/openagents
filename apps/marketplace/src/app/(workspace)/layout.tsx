import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { getActiveProjectId, getProjectAgents, toAgentInfoList } from '@/lib/projects/queries'
import { getProjectChats, ensureDefaultChat } from '@/lib/chats/queries'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const { projects, activeProjectId } = await getActiveProjectId(user.id)

  // Run all project-dependent queries in parallel to avoid sequential waterfall
  const [instances, chats] = await Promise.all([
    getProjectAgents(user.id, activeProjectId),
    (async () => {
      if (activeProjectId) await ensureDefaultChat(user.id, activeProjectId)
      return getProjectChats(user.id, activeProjectId)
    })(),
  ])
  const agents = toAgentInfoList(instances)

  return (
    <SidebarProvider className="h-svh !min-h-0">
      <AppSidebar
        userEmail={user.email}
        agents={agents}
        chats={chats}
        projects={projects}
        activeProjectId={activeProjectId}
      />
      <SidebarInset className="overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
