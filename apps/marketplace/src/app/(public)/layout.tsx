import Link from 'next/link'
import { SierpinskiLogo } from '@/components/sierpinski-logo'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <SierpinskiLogo className="size-5 text-foreground" />
            <span className="text-[15px] font-semibold tracking-tight">OpenAgents</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/discover"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Discover
            </Link>
            <Link
              href="/workspace"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Workspace
            </Link>
          </div>
        </nav>
      </header>
      {children}
    </>
  )
}
