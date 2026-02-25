import { Suspense } from "react"
import { createClient } from "@openagents/db/server"
import { DiscoverFilters } from "@/components/function/discover-filters"
import { AgentGrid } from "@/components/function/agent-grid"
import { seedDemoAgentsIfEmpty } from "@/lib/agents-seed"
import type { AgentListItem } from "@/lib/agents"

interface Props {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>
}

async function fetchAgents(searchParams: { q?: string; category?: string; sort?: string }): Promise<AgentListItem[]> {
  // Seed demo data in dev if table is empty
  if (process.env.NODE_ENV === "development") {
    await seedDemoAgentsIfEmpty()
  }

  const supabase = await createClient()
  let query = supabase
    .from("agents")
    .select("id, slug, name, tagline, category, avg_rating, total_hires, total_reviews, pricing_model, credits_per_session, icon_url, creator_id")
    .eq("status", "published")

  // Search filter
  if (searchParams.q) {
    const term = `%${searchParams.q}%`
    query = query.or(`name.ilike.${term},tagline.ilike.${term},description.ilike.${term}`)
  }

  // Category filter
  if (searchParams.category && searchParams.category !== "all") {
    query = query.eq("category", searchParams.category)
  }

  // Sort
  switch (searchParams.sort) {
    case "newest":
      query = query.order("published_at", { ascending: false, nullsFirst: false })
      break
    case "highest_rated":
      query = query.order("avg_rating", { ascending: false, nullsFirst: false })
      break
    case "most_hired":
      query = query.order("total_hires", { ascending: false })
      break
    default: // trending
      query = query.order("total_hires", { ascending: false })
      break
  }

  query = query.limit(50)

  const { data, error } = await query

  if (error || !data) return []

  return data.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    tagline: a.tagline,
    category: a.category,
    avg_rating: a.avg_rating,
    total_hires: a.total_hires,
    total_reviews: a.total_reviews,
    pricing_model: a.pricing_model,
    credits_per_session: a.credits_per_session,
    icon_url: a.icon_url,
    creator_name: null, // TODO: join users table
  }))
}

export default async function DiscoverPage({ searchParams }: Props) {
  const params = await searchParams
  const agents = await fetchAgents(params)
  const hasFilters = !!(params.q || (params.category && params.category !== "all"))

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Discover</h1>
        <p className="text-muted-foreground">Find the perfect assistant for any task</p>
      </div>

      <Suspense>
        <DiscoverFilters />
      </Suspense>

      <div className="mt-8">
        <AgentGrid agents={agents} />
      </div>

      {!hasFilters && agents.length > 0 && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Showing {agents.length} assistant{agents.length === 1 ? "" : "s"}
        </p>
      )}
    </main>
  )
}
