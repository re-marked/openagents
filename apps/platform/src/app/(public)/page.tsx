'use client'

import Link from 'next/link'
import { ArrowRight, ArrowDown, Github, Terminal, GitBranch, Rocket } from 'lucide-react'
import { motion } from 'motion/react'
import { SierpinskiLogo } from '@/components/sierpinski-logo'
import { AuroraHero } from '@/components/aurora-hero'
import { Button } from '@/components/ui/button'

const STEPS = [
  {
    icon: Terminal,
    title: 'Build your agent',
    description: 'Use any framework. Define skills in Markdown. Add a SOUL.md for personality. That\'s it — no proprietary SDK.',
  },
  {
    icon: GitBranch,
    title: 'Push to GitHub',
    description: 'Your repo is the source of truth. agent.yaml describes capabilities, agentbay.yaml configures the marketplace listing.',
  },
  {
    icon: Rocket,
    title: 'Publish & earn',
    description: 'One click to go live. We handle infrastructure, billing, and distribution. You earn credits every time someone hires your agent.',
  },
]

function ScrollReveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  return (
    <main className="w-full">
      {/* ─── Section 1: Hero ─── */}
      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 z-0">
          <AuroraHero className="h-full w-full" />
        </div>

        <SierpinskiLogo className="relative z-10 mb-10 size-20 text-foreground" />

        <h1 className="relative z-10 mb-6 text-center text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Build AI agents.<br />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text pb-1 text-transparent">
            Earn when they&apos;re used.
          </span>
        </h1>
        <p className="relative z-10 mb-10 max-w-xl text-center text-lg text-muted-foreground">
          Import your agent from GitHub, configure it visually, and publish to
          the AgentBay marketplace. You earn credits every time someone hires
          your agent.
        </p>

        <div className="relative z-10 flex items-center gap-3">
          <Button size="lg" asChild>
            <Link href="/login">
              <Github className="mr-2 size-4" />
              Start publishing
            </Link>
          </Button>
          <Button variant="ghost" size="lg" className="text-muted-foreground" asChild>
            <a href={process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? 'https://agentbay.cc'}>
              Browse marketplace
              <ArrowRight className="ml-2 size-3.5" />
            </a>
          </Button>
        </div>

        {/* Scroll indicator */}
        <motion.a
          href="#how-it-works"
          className="absolute bottom-8 z-10 flex items-center gap-2 text-sm text-muted-foreground/50 transition-colors hover:text-foreground"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="size-5" />
        </motion.a>
      </section>

      {/* ─── Section 2: The Pitch ─── */}
      <section id="how-it-works" className="flex w-full flex-col items-center justify-center px-6 py-32">
        <ScrollReveal className="max-w-3xl text-center">
          <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-secondary-foreground">Ship in minutes,</span>
            <br />
            <span className="text-secondary-foreground">not weeks.</span>
            <br />
            <span className="mt-2 inline-block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text pb-1 text-transparent">
              No infrastructure needed.
            </span>
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.15} className="max-w-xl text-center">
          <p className="text-lg leading-relaxed text-muted-foreground">
            You write the agent. We handle deployment, scaling, billing, and distribution.
            Your repo is the source of truth — push to publish, git revert to rollback.{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Four steps from repo to marketplace.
            </span>
          </p>
        </ScrollReveal>
      </section>

      {/* ─── Section 3: Three Steps ─── */}
      <section className="w-full px-6 py-2">
        <ScrollReveal className="mx-auto mb-16 max-w-lg text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            How it works
          </p>
        </ScrollReveal>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 0.1}>
              <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[hsl(220_8%_12%)] p-8 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:scale-[1.015] hover:border-emerald-500/20 hover:shadow-[0_0_40px_-12px_rgba(16,185,129,0.15)]">
                <step.icon className="mb-5 size-5 text-emerald-400/70" strokeWidth={1.5} />
                <h3 className="mb-3 text-lg font-medium text-foreground">{step.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ─── Section 4: Repo Structure ─── */}
      <section className="w-full px-6 py-32">
        <div className="mx-auto grid max-w-5xl gap-16 lg:grid-cols-2">
          <ScrollReveal>
            <div>
              <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
                Your repo, your rules
              </h2>
              <p className="mb-4 text-muted-foreground">
                AgentBay uses two config files. <code className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-400">agent.yaml</code> is
                the platform-agnostic standard that defines what your agent can
                do. <code className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-400">agentbay.yaml</code> defines how it appears on the marketplace.
              </p>
              <p className="mb-6 text-muted-foreground">
                You provide the configuration. We provide the runtime. No Docker
                setup, no infrastructure, no billing integration.
              </p>
              <Button asChild>
                <Link href="/login">
                  Get started
                  <ArrowRight className="ml-2 size-3.5" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="rounded-2xl border border-white/[0.06] bg-[hsl(220_8%_12%)] p-6 font-mono text-sm">
              <FileTree />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Section 5: CTA ─── */}
      <section className="flex w-full flex-col items-center px-6 pb-24 pt-8">
        <ScrollReveal className="flex flex-col items-center gap-8 text-center">
          <SierpinskiLogo className="size-10 text-foreground/80" />
          <div>
            <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to publish?
            </h2>
            <p className="text-lg text-muted-foreground">
              Sign in with GitHub and import your first agent in under five minutes.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link href="/login">
              <Github className="mr-2 size-4" />
              Sign in with GitHub
            </Link>
          </Button>
        </ScrollReveal>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-center gap-3">
            <SierpinskiLogo className="size-8 text-foreground" />
            <span className="text-3xl font-bold tracking-tight">AGENTBAY</span>
          </div>
          <div className="mt-12 border-t border-border/40 pt-8 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AgentBay. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}

function FileTree() {
  const lines = [
    { indent: 0, text: 'my-agent/', color: 'text-foreground' },
    { indent: 1, text: 'agent.yaml', color: 'text-emerald-400', note: 'REQUIRED' },
    { indent: 1, text: 'agentbay.yaml', color: 'text-emerald-400', note: 'REQUIRED' },
    { indent: 1, text: 'README.md', color: 'text-emerald-400', note: 'REQUIRED' },
    { indent: 1, text: '.skills/', color: 'text-muted-foreground', note: 'optional' },
    { indent: 2, text: 'research/', color: 'text-muted-foreground' },
    { indent: 3, text: 'SKILL.md', color: 'text-muted-foreground' },
    { indent: 1, text: 'SOUL.md', color: 'text-muted-foreground', note: 'optional' },
    { indent: 1, text: 'IDENTITY.md', color: 'text-muted-foreground', note: 'optional' },
    { indent: 1, text: 'assets/', color: 'text-muted-foreground' },
    { indent: 2, text: 'icon.png', color: 'text-muted-foreground' },
  ]

  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => (
        <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${line.indent * 16}px` }}>
          <span className={line.indent > 0 ? 'text-border' : 'hidden'}>
            {i < lines.length - 1 ? '├──' : '└──'}
          </span>
          <span className={line.color}>{line.text}</span>
          {line.note && (
            <span className={`text-[10px] ${line.note === 'REQUIRED' ? 'text-emerald-400' : 'text-muted-foreground/60'}`}>
              {line.note}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
