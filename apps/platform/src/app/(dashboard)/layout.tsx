import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { PlatformSidebar } from '@/components/platform-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { createServiceClient } from '@openagents/db/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('users')
    .select('display_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <SidebarProvider>
      <PlatformSidebar
        userEmail={profile?.email ?? user.email ?? ''}
        userName={profile?.display_name ?? undefined}
        avatarUrl={profile?.avatar_url ?? undefined}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
