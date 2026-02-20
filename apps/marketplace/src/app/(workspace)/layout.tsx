import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'

// Workspace layout — authenticated, client-heavy, real-time
// Protected by middleware (redirect to /login if unauthenticated)
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
