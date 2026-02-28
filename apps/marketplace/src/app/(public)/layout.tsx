import { PublicSiteHeader } from '@/components/public-site-header'

const isLocked = process.env.NEXT_PUBLIC_LAUNCH_LOCKDOWN !== 'false'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={isLocked ? 'min-h-svh' : 'flex h-svh flex-col'}>
      {!isLocked && <PublicSiteHeader />}
      {isLocked ? children : (
        <div className="min-h-0 flex-1 overflow-auto">
          {children}
        </div>
      )}
    </div>
  )
}
