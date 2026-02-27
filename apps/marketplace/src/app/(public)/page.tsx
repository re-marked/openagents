'use client'

import { useEffect } from 'react'
import { AuroraHero } from '@/components/aurora-hero'
import { RotatingText } from '@/components/rotating-text'

export default function LandingPage() {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <main className="h-svh w-full overflow-hidden">
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
        <p className="relative z-10 max-w-xl text-center text-lg text-secondary-foreground">
          Every person is a corporation. You are the boss and dozens of AI agents work for you.
          The real skill now becomes systems thinking, execution speed, and creativity.
        </p>
      </section>
    </main>
  )
}
