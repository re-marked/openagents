'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { SierpinskiLogo } from '@/components/sierpinski-logo'
import { Button } from '@/components/ui/button'

export function PublicSiteHeader() {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <SierpinskiLogo className="size-5 text-foreground" />
          <span className="text-[15px] font-semibold tracking-tight">OpenAgents</span>
        </Link>

        {/* Search bar */}
        <button
          onClick={() => router.push('/discover')}
          className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <Search className="size-4 shrink-0" />
          <span>Search assistants...</span>
          <kbd className="ml-auto hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
            /
          </kbd>
        </button>

        {/* Nav links */}
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/discover">Discover</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/workspace/home">Workspace</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
