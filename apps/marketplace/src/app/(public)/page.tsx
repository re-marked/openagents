import Link from 'next/link'
import { Search, ArrowRight, ArrowDown, Brain, Heart, Users, Settings, Radio, Blocks, Github } from 'lucide-react'
import { SierpinskiLogo } from '@/components/sierpinski-logo'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 py-24">
        <SierpinskiLogo className="mb-10 size-32 text-foreground" />
        <h1 className="mb-6 text-center text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Personal Agents<br />for everyone
        </h1>
        <p className="mb-10 max-w-xl text-center text-lg text-muted-foreground">
          Every person is a corporation. You are the boss — dozens of AI agents work for you.
          The real skill now becomes systems thinking, execution speed, and creativity.
        </p>

        {/* Search CTA */}
        <form action="/discover" className="w-full max-w-lg">
          <div className="flex h-12 items-center gap-3 rounded-xl bg-card px-4 transition-colors focus-within:bg-accent">
            <Search className="size-5 shrink-0 text-muted-foreground" />
            <input
              name="q"
              type="text"
              placeholder="Describe what you need help with..."
              className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </form>

        <a href="#features" className="mt-8 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          or learn more <ArrowDown className="size-4" />
        </a>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Features we offer
        </h2>
        <p className="mx-auto mb-16 max-w-2xl text-center text-muted-foreground">
          Agency — the quality of being agentic. Our Agents don&apos;t just respond, they think, remember, adapt, and act.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group rounded-2xl bg-card p-6 transition-colors hover:bg-accent">
            <Brain className="mb-4 size-8 text-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Memory</h3>
            <p className="text-sm text-muted-foreground">
              Remembers everything. Access past chats, connection history, and all your preferences across sessions.
            </p>
          </div>

          <div className="group rounded-2xl bg-card p-6 transition-colors hover:bg-accent">
            <Heart className="mb-4 size-8 text-foreground" />
            <h3 className="mb-2 text-lg font-semibold">The Soul</h3>
            <p className="text-sm text-muted-foreground">
              Our Agents have personality. SOUL.md defines who they are — tone, values, and character that feels real.
            </p>
          </div>

          <div className="group rounded-2xl bg-card p-6 transition-colors hover:bg-accent">
            <Settings className="mb-4 size-8 text-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Self-improving Agents</h3>
            <p className="text-sm text-muted-foreground">
              They learn and adapt to your pace. MEMORY.md lets Agents remember what works for you and continuously improve.
            </p>
          </div>

          <div className="group rounded-2xl bg-card p-6 transition-colors hover:bg-accent">
            <Users className="mb-4 size-8 text-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Teams</h3>
            <p className="text-sm text-muted-foreground">
              Organize Agents into teams. They collaborate as one unit, each handling their speciality while working towards your goal.
            </p>
          </div>

          <div className="group rounded-2xl bg-card p-6 transition-colors hover:bg-accent">
            <Radio className="mb-4 size-8 text-foreground" />
            <h3 className="mb-2 text-lg font-semibold">50+ Ways to Connect</h3>
            <p className="text-sm text-muted-foreground">
              Chat, Telegram, Discord, Slack, WhatsApp, GitHub — use your Agent wherever you already work.
            </p>
          </div>

          <div className="group rounded-2xl bg-card p-6 transition-colors hover:bg-accent">
            <Blocks className="mb-4 size-8 text-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Advanced Config</h3>
            <p className="text-sm text-muted-foreground">
              Power users can edit config files directly in the UI. Full control over Agent behavior, skills, tools, and sub-agents.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-card px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Let us handle the Agents part.
          </h2>
          <p className="mb-10 text-lg text-muted-foreground">
            You focus on the vision. Your Agents handle the thinking, execution, and creativity.
          </p>
          <Button size="lg" asChild>
            <Link href="/workspace/home">
              Create your corporation <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* What is an Agent / OpenClaw ecosystem */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-bold tracking-tight">What is an Agent?</h2>
            <p className="mb-4 text-muted-foreground">
              An Agent is your personal AI assistant that lives in the cloud. It has its own memory, personality, skills, and tools — and it&apos;s always ready to help.
            </p>
            <p className="text-muted-foreground">
              Unlike chatbots that forget you after every conversation, Agents remember context, learn your preferences, and get better over time. They can work alone or in teams.
            </p>
          </div>

          <div>
            <h2 className="mb-6 text-3xl font-bold tracking-tight">Built on OpenClaw</h2>
            <p className="mb-6 text-muted-foreground">
              The fastest-growing AI agent ecosystem ever. OpenAgents aggregates and standardizes the best of it.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl bg-card p-4 text-center">
                <div className="text-2xl font-bold">3,000+</div>
                <div className="text-xs text-muted-foreground">Skills &amp; Plugins</div>
              </div>
              <div className="rounded-2xl bg-card p-4 text-center">
                <div className="text-2xl font-bold">204K</div>
                <div className="text-xs text-muted-foreground">GitHub Stars</div>
              </div>
              <div className="rounded-2xl bg-card p-4 text-center">
                <div className="text-2xl font-bold">10,000+</div>
                <div className="text-xs text-muted-foreground">Tools &amp; Sub-agents</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section className="bg-card px-6 py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Github className="mb-4 size-10 text-foreground" />
          <h2 className="mb-3 text-2xl font-bold tracking-tight">We are open source</h2>
          <p className="mb-6 text-muted-foreground">
            OpenAgents is fully open source. Inspect the code, contribute, or self-host.
          </p>
          <Button variant="outline" size="lg" asChild>
            <a href="https://github.com/openagents" target="_blank" rel="noopener noreferrer">
              View on GitHub <ArrowRight className="ml-2 size-4" />
            </a>
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

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="mb-4 text-sm font-semibold">Products</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/discover" className="transition-colors hover:text-foreground">Discover</Link></li>
                <li><Link href="/workspace/home" className="transition-colors hover:text-foreground">Workspace</Link></li>
                <li><Link href="/platform" className="transition-colors hover:text-foreground">Platform</Link></li>
                <li><a href="#" className="transition-colors hover:text-foreground">Skills</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://x.com/openagents" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">X (Twitter)</a></li>
                <li><a href="#" className="transition-colors hover:text-foreground">Discord</a></li>
                <li><a href="#" className="transition-colors hover:text-foreground">LinkedIn</a></li>
                <li><a href="#" className="transition-colors hover:text-foreground">Product Hunt</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">For Developers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://github.com/openagents" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">GitHub</a></li>
                <li><a href="#" className="transition-colors hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="transition-colors hover:text-foreground">API Reference</a></li>
                <li><a href="#" className="transition-colors hover:text-foreground">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="transition-colors hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="transition-colors hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="transition-colors hover:text-foreground">EULA</a></li>
                <li><a href="#" className="transition-colors hover:text-foreground">License</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-border/40 pt-8 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} OpenAgents. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}
