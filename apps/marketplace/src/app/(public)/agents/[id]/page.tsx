import { createClient } from '@openagents/db/server'
import { notFound } from 'next/navigation'
import { Zap, Users, Rocket } from 'lucide-react'
import { AgentInitial, CATEGORY_COLORS } from '@/lib/agents'
import { PublicSiteHeader } from '@/components/function/public-site-header'
import { AgentHireButton } from '@/components/function/agent-hire-button'
import { RatingStars } from '@/components/function/agent-card'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

async function getAgent(slugOrId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('agents')
    .select('id, slug, name, tagline, description, category, avg_rating, total_hires, total_reviews, pricing_model, credits_per_session, icon_url')
    .eq('status', 'published')
    .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .limit(1)
    .single()

  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const agent = await getAgent(id)
  if (!agent) return { title: 'Agent Not Found' }

  return {
    title: `${agent.name} — AgentBay`,
    description: agent.tagline,
    openGraph: {
      title: `${agent.name} — AI Agent on AgentBay`,
      description: agent.tagline,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${agent.name} — AI Agent on AgentBay`,
      description: agent.tagline,
    },
  }
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

export default async function AgentPage({ params }: Props) {
  const { id } = await params
  const agent = await getAgent(id)
  if (!agent) notFound()

  const price =
    agent.pricing_model === 'free' || !agent.credits_per_session
      ? 'Free'
      : `${agent.credits_per_session} credits/session`

  return (
    <div className="min-h-screen bg-background">
      <PublicSiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Hero */}
        <div className="flex items-start gap-6 mb-8">
          <AgentInitial name={agent.name} category={agent.category} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
            <p className="text-lg text-muted-foreground mt-1">{agent.tagline}</p>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <Badge variant="secondary" className={CATEGORY_COLORS[agent.category] ?? ''}>
                {agent.category}
              </Badge>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-0">
                {price}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats */}
        <Card className="mb-8 border-0 py-4">
          <CardContent className="flex gap-8">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold">{formatCount(agent.total_hires)}</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Hires</span>
            </div>
            <div className="w-px bg-border/40" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold">{agent.avg_rating?.toFixed(1) ?? '—'}</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Rating</span>
            </div>
            <div className="w-px bg-border/40" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold">{formatCount(agent.total_reviews)}</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Reviews</span>
            </div>
          </CardContent>
        </Card>

        {/* Rating stars */}
        {agent.avg_rating && agent.total_reviews > 0 && (
          <div className="mb-8">
            <RatingStars rating={agent.avg_rating} count={agent.total_reviews} size="md" />
          </div>
        )}

        {/* About */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">About</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {agent.description}
          </p>
        </div>

        {/* Capabilities */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Capabilities</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Zap className="size-4 text-amber-400 shrink-0" />
              Fast responses
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Users className="size-4 text-primary shrink-0" />
              Team compatible
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Rocket className="size-4 text-emerald-400 shrink-0" />
              Always available
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="sticky bottom-6">
          <AgentHireButton agentSlug={agent.slug} agentName={agent.name} />
        </div>
      </main>
    </div>
  )
}
