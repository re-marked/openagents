'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'
import { AuroraHero } from '@/components/aurora-hero'
import { RotatingText } from '@/components/rotating-text'
import { Button } from '@/components/ui/button'

const isLocked = process.env.NEXT_PUBLIC_LAUNCH_LOCKDOWN !== 'false'

export default function LandingPage() {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <main className={isLocked ? 'h-svh w-full overflow-hidden' : 'h-[calc(100vh-3.5rem)] w-full overflow-hidden'}>
      <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 z-0">
          <AuroraHero className="h-full w-full" />
        </div>

        <h1 className="relative z-10 mb-6 flex flex-wrap justify-center text-center text-6xl font-medium tracking-lightest sm:text-6xl lg:text-6xl">
          <span>Personal Agents for</span>
          <span className="ml-[0.25em] w-[220px] text-left">
            <RotatingText />
          </span>
        </h1>
        <p className={`relative z-10 max-w-xl text-center text-lg text-secondary-foreground ${isLocked ? '' : 'mb-10'}`}>
          Every person is a corporation. You are the boss and dozens of AI agents work for you.
          The real skill now becomes systems thinking, execution speed, and creativity.
        </p>

        {!isLocked && (
          <>
            <div className="relative w-full max-w-2xl">
              <form action="/discover" className="relative z-10">
                <div className="flex h-14 items-center gap-4 rounded-2xl bg-card/50 backdrop-blur-md px-6 transition-colors focus-within:bg-accent/50 border border-white/5 shadow-2xl">
                  <input
                    name="q"
                    type="text"
                    placeholder="Describe what you need help with..."
                    className="w-full bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <Search className="size-6 shrink-0 text-muted-foreground" />
                </div>
              </form>
            </div>

            <div className="relative z-10 mt-8 flex justify-center">
              <Button size="lg" variant="ghost" className="h-12 px-8 text-base" asChild>
                <Link href="/workspace/home">
                  Create your corporation <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
