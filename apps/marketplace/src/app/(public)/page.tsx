import Link from 'next/link'
import {
  Search,
  Code,
  PenLine,
  BarChart3,
  BookOpen,
  Palette,
  TrendingUp,
  Globe,
  FileText,
  Terminal,
  Heart,
  Lightbulb,
  Music,
  Plug,
  MapPin,
  ArrowRight,
  Star,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SierpinskiLogo } from '@/components/sierpinski-logo'

/* ------------------------------------------------------------------ */
/*  Mock data — will be replaced with real DB queries                  */
/* ------------------------------------------------------------------ */

type Agent = {
  id: string
  name: string
  description: string
  category: string
  rating: number
  installs: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
}

const topAgents: Agent[] = [
  {
    id: 'research-pro',
    name: 'Research Pro',
    description: 'Synthesizes papers, data, and insights into actionable briefings.',
    category: 'Productivity',
    rating: 4.9,
    installs: '12.4K',
    icon: Search,
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'code-architect',
    name: 'Code Architect',
    description: 'Full-stack code review, refactoring, and architecture advice.',
    category: 'Development',
    rating: 4.8,
    installs: '9.1K',
    icon: Code,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'writing-studio',
    name: 'Writing Studio',
    description: 'From first draft to final polish. Essays, articles, stories.',
    category: 'Creative',
    rating: 4.9,
    installs: '15.2K',
    icon: PenLine,
    gradient: 'from-orange-500 to-red-500',
  },
]

const teamPicks: Agent[] = [
  {
    id: 'data-whisperer',
    name: 'Data Whisperer',
    description: 'Turn raw data into actionable insights and beautiful visualizations.',
    category: 'Analytics',
    rating: 4.7,
    installs: '6.8K',
    icon: BarChart3,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'legal-eagle',
    name: 'Legal Eagle',
    description: 'Contract review, compliance checks, and legal research.',
    category: 'Business',
    rating: 4.6,
    installs: '3.2K',
    icon: BookOpen,
    gradient: 'from-slate-600 to-slate-800',
  },
  {
    id: 'design-critic',
    name: 'Design Critic',
    description: 'UI/UX feedback, accessibility audits, design system advice.',
    category: 'Design',
    rating: 4.8,
    installs: '5.4K',
    icon: Palette,
    gradient: 'from-pink-500 to-rose-600',
  },
]

const trending: Agent[] = [
  {
    id: 'finance-guru',
    name: 'Finance Guru',
    description: 'Budget planning, investment analysis, financial modeling.',
    category: 'Finance',
    rating: 4.5,
    installs: '4.1K',
    icon: TrendingUp,
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    id: 'language-bridge',
    name: 'Language Bridge',
    description: 'Real-time translation and language learning companion.',
    category: 'Education',
    rating: 4.7,
    installs: '7.3K',
    icon: Globe,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'content-engine',
    name: 'Content Engine',
    description: 'SEO-optimized content, social media, marketing copy.',
    category: 'Marketing',
    rating: 4.4,
    installs: '5.9K',
    icon: FileText,
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    id: 'devops-pilot',
    name: 'DevOps Pilot',
    description: 'CI/CD pipelines, infrastructure, deployment automation.',
    category: 'Development',
    rating: 4.6,
    installs: '3.8K',
    icon: Terminal,
    gradient: 'from-gray-600 to-gray-800',
  },
  {
    id: 'health-coach',
    name: 'Health Coach',
    description: 'Wellness plans, nutrition advice, fitness tracking.',
    category: 'Health',
    rating: 4.3,
    installs: '8.5K',
    icon: Heart,
    gradient: 'from-lime-500 to-green-600',
  },
]

const newArrivals: Agent[] = [
  {
    id: 'pitch-perfect',
    name: 'Pitch Perfect',
    description: 'Startup pitch decks, investor presentations, storytelling.',
    category: 'Business',
    rating: 4.4,
    installs: '1.2K',
    icon: Lightbulb,
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    id: 'sound-engineer',
    name: 'Sound Engineer',
    description: 'Audio editing, podcast production, music composition.',
    category: 'Creative',
    rating: 4.5,
    installs: '890',
    icon: Music,
    gradient: 'from-fuchsia-500 to-purple-600',
  },
  {
    id: 'api-scout',
    name: 'API Scout',
    description: 'API integration, documentation, endpoint testing.',
    category: 'Development',
    rating: 4.3,
    installs: '1.5K',
    icon: Plug,
    gradient: 'from-sky-500 to-blue-600',
  },
  {
    id: 'travel-planner',
    name: 'Travel Planner',
    description: 'Trip planning, itineraries, local recommendations.',
    category: 'Lifestyle',
    rating: 4.6,
    installs: '2.1K',
    icon: MapPin,
    gradient: 'from-teal-500 to-cyan-600',
  },
]

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <Link
        href={href}
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        See All
      </Link>
    </div>
  )
}

function AgentListItem({ agent, rank }: { agent: Agent; rank?: number }) {
  const Icon = agent.icon
  return (
    <Link
      href={`/discover/${agent.id}`}
      className="group flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-accent/50"
    >
      {rank != null && (
        <span className="w-6 text-center font-mono text-lg font-semibold text-muted-foreground/60">
          {rank}
        </span>
      )}
      <div
        className={`flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br shadow-sm ${agent.gradient} text-white`}
      >
        <Icon className="size-7" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold leading-tight">{agent.name}</h3>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{agent.description}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground/70">
          <Star className="size-3 fill-current" />
          <span>{agent.rating}</span>
          <span className="text-muted-foreground/30">&middot;</span>
          <span>{agent.category}</span>
          <span className="text-muted-foreground/30">&middot;</span>
          <span>{agent.installs}</span>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="rounded-full px-5 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
      >
        Get
      </Button>
    </Link>
  )
}

function FeaturedCard({ agent }: { agent: Agent }) {
  const Icon = agent.icon
  return (
    <Link
      href={`/discover/${agent.id}`}
      className={`group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-sm transition-transform hover:scale-[1.02] ${agent.gradient}`}
    >
      <div>
        <Badge className="border-0 bg-white/20 text-[11px] text-white backdrop-blur-sm">
          {agent.category}
        </Badge>
        <h3 className="mt-3 text-xl font-bold">{agent.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/80">{agent.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm text-white/60">
          <Star className="size-3.5 fill-current" />
          {agent.rating} &middot; {agent.installs}
        </span>
        <Icon className="size-8 text-white/15 transition-transform group-hover:scale-110" />
      </div>
    </Link>
  )
}

function CompactCard({ agent }: { agent: Agent }) {
  const Icon = agent.icon
  return (
    <Link
      href={`/discover/${agent.id}`}
      className="group flex w-40 shrink-0 flex-col items-center rounded-2xl border bg-card p-5 text-center transition-all hover:border-border/80 hover:shadow-sm"
    >
      <div
        className={`flex size-14 items-center justify-center rounded-[14px] bg-gradient-to-br shadow-sm ${agent.gradient} text-white`}
      >
        <Icon className="size-7" />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{agent.name}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{agent.category}</p>
      <span className="mt-2 flex items-center gap-0.5 text-xs text-muted-foreground/70">
        <Star className="size-3 fill-current" />
        {agent.rating}
      </span>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <main>
      {/* ---- Hero ---- */}
      <section className="flex flex-col items-center px-6 pb-24 pt-20 text-center">
        <SierpinskiLogo className="size-20 text-foreground" />
        <h1 className="mt-8 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          OpenAgents
        </h1>
        <p className="mt-4 text-xl text-muted-foreground sm:text-2xl">
          AI assistants for everything.
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground/80 sm:text-lg">
          Every person is now a corporation &mdash; you&rsquo;re the boss, and AI agents are your
          team. Set the mission, define the goals, manage the strategy. We handle the agents.
        </p>
        <Button asChild size="lg" className="mt-10 rounded-full px-8 text-base">
          <Link href="/discover">
            Browse Assistants
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </section>

      {/* ---- Today's Top Assistants ---- */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <SectionHeader title="Today&rsquo;s Top Assistants" href="/discover?sort=top" />
          <div className="mt-8 divide-y">
            {topAgents.map((agent, i) => (
              <AgentListItem key={agent.id} agent={agent} rank={i + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- Team Picks — Bento ---- */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            title="OpenAgents Team Picks"
            href="/discover?collection=team-picks"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teamPicks.map((agent) => (
              <FeaturedCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- Trending This Week ---- */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <SectionHeader title="Trending This Week" href="/discover?sort=trending" />
          <div className="mt-8 flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {trending.map((agent) => (
              <CompactCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- New Arrivals ---- */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <SectionHeader title="New Arrivals" href="/discover?sort=new" />
          <div className="mt-8 divide-y">
            {newArrivals.map((agent) => (
              <AgentListItem key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <SierpinskiLogo className="size-4 text-muted-foreground/60" />
            <span>&copy; 2026 OpenAgents</span>
          </div>
          <div className="flex gap-6">
            <Link href="/discover" className="transition-colors hover:text-foreground">
              Discover
            </Link>
            <Link href="/workspace" className="transition-colors hover:text-foreground">
              Workspace
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
