import Link from 'next/link'
import { Terminal, Github, ArrowRight, Code2, Eye, Zap, DollarSign } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Terminal className="size-3.5" />
            </div>
            <span className="text-sm font-semibold">OpenAgents Platform</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? 'https://openagents.com'}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Marketplace
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-medium text-background hover:bg-foreground/90"
            >
              <Github className="size-3.5" />
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Now accepting creators
        </div>

        <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Build AI agents.{' '}
          <span className="text-primary">Earn when they&apos;re used.</span>
        </h1>

        <p className="mt-4 max-w-lg text-base text-muted-foreground">
          Import your agent from GitHub, configure it visually, and publish to
          the OpenAgents marketplace. You earn credits every time someone hires
          your agent.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Github className="size-4" />
            Start publishing
          </Link>
          <Link
            href={process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? 'https://openagents.com'}
            className="inline-flex items-center gap-1 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Browse marketplace
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-card/50">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Ship in minutes, not weeks
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Four steps from repo to marketplace.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
      <section className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Your repo, your rules
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                OpenAgents uses two config files. <code className="rounded bg-muted px-1.5 py-0.5 text-xs">agent.yaml</code> is
                the platform-agnostic standard that defines what your agent can
                do. <code className="rounded bg-muted px-1.5 py-0.5 text-xs">openagents.yaml</code> defines how it appears on the marketplace.
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                You provide the configuration. We provide the runtime. No Docker
                setup, no infrastructure, no billing integration.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Get started
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="rounded-xl border bg-card p-5 font-mono text-sm">
              <div className="text-muted-foreground">
                <FileTree />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-card/50">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-16 text-center">
          <Zap className="size-8 text-primary" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
            Ready to publish?
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Sign in with GitHub and import your first agent in under five minutes.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Github className="size-4" />
            Sign in with GitHub
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 text-xs text-muted-foreground">
          <span>OpenAgents</span>
          <Link
            href={process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? 'https://openagents.com'}
            className="hover:text-foreground"
          >
            Marketplace
          </Link>
        </div>
      </footer>
    </div>
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
    <div className="flex flex-col items-start">
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
