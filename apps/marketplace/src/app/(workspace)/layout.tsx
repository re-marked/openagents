import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@openagents/db/server'
import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  // Load sidebar nav from the user's agent instance (source of truth)
  const service = createServiceClient()
  const { data: instance } = await service
    .from('agent_instances')
    .select('team_id')
    .eq('user_id', user.id)
    .not('team_id', 'is', null)
    .limit(1)
    .single()

  const teamId = (instance as { team_id: string } | null)?.team_id

  let projectId: string | undefined
  if (teamId) {
    const { data: team } = await service
      .from('teams')
      .select('project_id')
      .eq('id', teamId)
      .single()
    projectId = (team as { project_id: string } | null)?.project_id
  }

  return (
    <SidebarProvider>
      <AppSidebar
        projectId={projectId}
        teamId={teamId}
        userEmail={user.email}
      />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
