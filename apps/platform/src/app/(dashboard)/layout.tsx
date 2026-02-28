import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { PlatformSidebar } from '@/components/platform-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { createServiceClient } from '@agentbay/db/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('users')
    .select('display_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  // Load creator's published agents for sidebar
  const { data: agentRows } = await service
    .from('agents')
    .select('id, name, category, slug')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: true })

  const agents = (agentRows ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    category: a.category ?? 'productivity',
    status: 'published',
  }))

  return (
    <SidebarProvider className="h-svh !min-h-0">
      <PlatformSidebar
        userEmail={profile?.email ?? user.email ?? ''}
        agents={agents}
      />
      <SidebarInset className="overflow-y-auto">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
