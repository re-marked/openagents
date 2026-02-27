import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'

// Platform layout — creator tools (platform.agentbay.com)
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  if (!user) {
    redirect('/platform/login')
  }

  return <>{children}</>
}
