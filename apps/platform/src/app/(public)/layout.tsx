import { PublicSiteHeader } from '@/components/function/public-site-header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicSiteHeader />
      {children}
    </>
  )
}
