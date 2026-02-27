'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, ChevronDown, Circle, Triangle, Square } from 'lucide-react'
import { motion } from 'framer-motion'
import { AuroraHero } from '@/components/aurora-hero'
import { RotatingText } from '@/components/rotating-text'
import { ScrollReveal } from '@/components/scroll-reveal'
import { SmoothScroll } from '@/components/smooth-scroll'
import { SierpinskiLogo } from '@/components/sierpinski-logo'
import { Button } from '@/components/ui/button'
import { joinWaitlist } from '@/lib/waitlist/actions'

const isLocked = process.env.NEXT_PUBLIC_LAUNCH_LOCKDOWN !== 'false'

const ROLES = [
  {
    icon: Circle,
    title: 'The Researcher',
    description: 'Reads everything so you don\'t have to. Summarizes papers, tracks trends, digs through data. Never skims, never forgets.',
  },
  {
    icon: Triangle,
    title: 'The Writer',
    description: 'Writes in your voice. Blog posts, emails, reports, tweets. First drafts in minutes, polished versions in seconds.',
  },
  {
    icon: Square,
    title: 'The Analyst',
    description: 'Watches your numbers while you sleep. Spots what\'s changing, explains why it matters, tells you what to do about it.',
  },
]

function WaitlistForm() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await joinWaitlist(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSubmitted(true)
      }
    })
  }

  if (submitted) {
    return (
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg text-foreground"
      >
        You&apos;re on the list.
      </motion.p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col items-center gap-3 sm:flex-row">
      <div className="relative w-full flex-1">
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="h-12 w-full rounded-xl border border-white/10 bg-card/60 px-4 text-base text-foreground backdrop-blur-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-card/80"
        />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="h-12 shrink-0 rounded-xl px-6 text-base font-medium"
      >
        {pending ? 'Joining...' : 'Get early access'}
      </Button>
      {error && <p className="w-full text-center text-sm text-red-400">{error}</p>}
    </form>
  )
}

export default function LandingPage() {
  if (!isLocked) {
    return <UnlockedLandingPage />
  }

  return (
    <>
      <SmoothScroll />
      <main className="w-full">
        {/* ─── Section 1: Hero ─── */}
        <section className="relative flex h-svh w-full flex-col items-center justify-center overflow-hidden px-6">
          <div className="absolute inset-0 z-0">
            <AuroraHero className="h-full w-full" />
          </div>

          <h1 className="relative z-10 mb-6 flex flex-wrap justify-center text-center text-5xl font-medium tracking-lightest sm:text-6xl">
            <span>Personal Agents for</span>
            <span className="ml-[0.25em] w-[220px] text-left">
              <RotatingText />
            </span>
          </h1>
          <p className="relative z-10 max-w-xl text-center text-lg text-secondary-foreground">
            Every person is a corporation. You are the boss and dozens of AI agents work for you.
            The real skill now becomes systems thinking, execution speed, and creativity.
          </p>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 z-10"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="size-6 text-muted-foreground/50" />
          </motion.div>
        </section>

        {/* ─── Section 2: The Shift ─── */}
        <section className="flex min-h-[70vh] w-full flex-col items-center justify-center px-6 py-32">
          <ScrollReveal className="max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-secondary-foreground">You used to need a company</span>
              <br />
              <span className="text-secondary-foreground">to have a team.</span>
              <br />
              <span className="mt-2 inline-block bg-gradient-to-r from-[hsl(215,90%,65%)] to-[hsl(30,80%,60%)] bg-clip-text text-transparent">
                Not anymore.
              </span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.15} className="max-w-xl text-center">
            <p className="text-lg leading-relaxed text-muted-foreground">
              AI agents that research, write, analyze, and build — working alongside you, around the clock. What used to take ten people now takes one person and the right agents.
            </p>
          </ScrollReveal>
        </section>

        {/* ─── Section 3: Three Roles ─── */}
        <section className="w-full px-6 py-24">
          <ScrollReveal className="mx-auto mb-16 max-w-lg text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Your first hires
            </p>
          </ScrollReveal>

          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
            {ROLES.map((role, i) => (
              <ScrollReveal key={role.title} delay={i * 0.1}>
                <div className="group rounded-2xl border border-white/[0.06] bg-card/40 p-8 backdrop-blur-sm transition-colors hover:border-white/10 hover:bg-card/60">
                  <role.icon className="mb-5 size-5 text-muted-foreground transition-colors group-hover:text-foreground" strokeWidth={1.5} />
                  <h3 className="mb-3 text-lg font-medium text-foreground">{role.title}</h3>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ─── Section 4: Waitlist CTA ─── */}
        <section className="flex w-full flex-col items-center px-6 pb-24 pt-16">
          <ScrollReveal className="flex flex-col items-center gap-8 text-center">
            <SierpinskiLogo className="size-10 text-foreground/80" />
            <div>
              <h2 className="mb-3 text-3xl font-medium tracking-tight sm:text-4xl">
                AgentBay is coming.
              </h2>
              <p className="text-lg text-muted-foreground">
                The marketplace where you hire your AI team.
              </p>
            </div>
            <WaitlistForm />
            <p className="text-sm text-muted-foreground/60">
              We&apos;ll let you know when it&apos;s ready. No spam, obviously.
            </p>
          </ScrollReveal>
        </section>
      </main>
    </>
  )
}

/** Original unlocked landing page with search + CTA */
function UnlockedLandingPage() {
  return (
    <main className="h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 z-0">
          <AuroraHero className="h-full w-full" />
        </div>

        <h1 className="relative z-10 mb-6 flex flex-wrap justify-center text-center text-5xl font-medium tracking-lightest sm:text-6xl">
          <span>Personal Agents for</span>
          <span className="ml-[0.25em] w-[220px] text-left">
            <RotatingText />
          </span>
        </h1>
        <p className="relative z-10 mb-10 max-w-xl text-center text-lg text-secondary-foreground">
          Every person is a corporation. You are the boss and dozens of AI agents work for you.
          The real skill now becomes systems thinking, execution speed, and creativity.
        </p>

        <div className="relative w-full max-w-2xl">
          <form action="/discover" className="relative z-10">
            <div className="flex h-14 items-center gap-4 rounded-2xl border border-white/5 bg-card/50 px-6 shadow-2xl backdrop-blur-md transition-colors focus-within:bg-accent/50">
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
      </section>
    </main>
  )
}
