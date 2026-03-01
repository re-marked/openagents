import { PublicSiteHeader } from '@/components/public-site-header'

const isLocked = process.env.NEXT_PUBLIC_LAUNCH_LOCKDOWN !== 'false'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={isLocked ? 'min-h-svh' : 'h-svh pt-14'}>
      {!isLocked && <PublicSiteHeader />}
      {children}
    </div>
  )
}
