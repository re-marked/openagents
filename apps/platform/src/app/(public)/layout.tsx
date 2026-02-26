import { PublicSiteHeader } from '@/components/public-site-header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicSiteHeader />
      {children}
    </>
  )
}
