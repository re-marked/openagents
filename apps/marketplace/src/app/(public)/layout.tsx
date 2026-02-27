import { PublicSiteHeader } from '@/components/public-site-header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh flex-col">
      <PublicSiteHeader />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
