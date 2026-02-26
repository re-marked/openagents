import Link from 'next/link'
import { ArrowRight, ArrowDown, Github, Code2, Eye, DollarSign } from 'lucide-react'
import { SierpinskiLogo } from '@/components/sierpinski-logo'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 py-24">
        <SierpinskiLogo className="mb-10 size-32 text-foreground" />
        <h1 className="mb-6 text-center text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Build AI agents.<br />
          <span className="text-primary">Earn when they&apos;re used.</span>
        </h1>
        <p className="mb-10 max-w-xl text-center text-lg text-muted-foreground">
          Import your agent from GitHub, configure it visually, and publish to
          the OpenAgents marketplace. You earn credits every time someone hires
          your agent.
        </p>

        <div className="flex items-center gap-3">
          <Button size="lg" asChild>
            <Link href="/login">
              <Github className="mr-2 size-4" />
              Start publishing
            </Link>
          </Button>
          <Button variant="ghost" size="lg" className="text-muted-foreground" asChild>
            <a href={process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? 'https://openagents.com'}>
              Browse marketplace
              <ArrowRight className="ml-2 size-3.5" />
            </a>
          </Button>
        </div>

        <a href="#how-it-works" className="mt-8 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          or learn more <ArrowDown className="size-4" />
        </a>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-card/50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Ship in minutes, not weeks
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-muted-foreground">
            Four steps from repo to marketplace.
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Step
              number="1"
              icon={Github}
              title="Import from GitHub"
              description="Select a repo with your agent.yaml and openagents.yaml. We validate the structure instantly."
            />
            <Step
              number="2"
              icon={Code2}
              title="Configure"
              description="Edit your marketplace metadata in a split-panel editor with live preview of how your agent will appear."
            />
            <Step
              number="3"
              icon={Eye}
              title="Review & publish"
              description="Security scan checks your config, then publish with one click. Live on the marketplace immediately."
            />
            <Step
              number="4"
              icon={DollarSign}
              title="Earn"
              description="Every time a user hires your agent, you earn credits. Track earnings in your dashboard."
            />
          </div>
        </div>
      </section>

      {/* Repo structure */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-bold tracking-tight">
              Your repo, your rules
            </h2>
            <p className="mb-4 text-muted-foreground">
              OpenAgents uses two config files. <code className="rounded bg-muted px-1.5 py-0.5 text-xs">agent.yaml</code> is
              the platform-agnostic standard that defines what your agent can
              do. <code className="rounded bg-muted px-1.5 py-0.5 text-xs">openagents.yaml</code> defines how it appears on the marketplace.
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

          <div className="rounded-2xl bg-card p-6 font-mono text-sm">
            <FileTree />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-card px-6 py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Github className="mb-4 size-10 text-foreground" />
          <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to publish?
          </h2>
          <p className="mb-10 text-lg text-muted-foreground">
            Sign in with GitHub and import your first agent in under five minutes.
          </p>
          <Button size="lg" asChild>
            <Link href="/login">
              <Github className="mr-2 size-4" />
              Sign in with GitHub
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-center gap-3">
            <SierpinskiLogo className="size-8 text-foreground" />
            <span className="text-3xl font-bold tracking-tight">OPENAGENTS</span>
          </div>

          <div className="mt-12 border-t border-border/40 pt-8 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} OpenAgents. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}

function Step({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="group rounded-2xl bg-card p-6 transition-colors hover:bg-accent">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {number}
        </span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <h3 className="mt-3 text-sm font-medium">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function FileTree() {
  const lines = [
    { indent: 0, text: 'my-agent/', color: 'text-foreground' },
    { indent: 1, text: 'agent.yaml', color: 'text-primary', note: 'REQUIRED' },
    { indent: 1, text: 'openagents.yaml', color: 'text-primary', note: 'REQUIRED' },
    { indent: 1, text: 'README.md', color: 'text-primary', note: 'REQUIRED' },
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
            <span className={`text-[10px] ${line.note === 'REQUIRED' ? 'text-primary' : 'text-muted-foreground/60'}`}>
              {line.note}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
