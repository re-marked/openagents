import { Suspense } from "react"
import { createClient } from "@openagents/db/server"
import { DiscoverSidebar } from "@/components/function/discover-sidebar"
import { DiscoverContent } from "@/components/function/discover-content"
import { seedDemoAgentsIfEmpty } from "@/lib/agents-seed"
import type { AgentListItem } from "@/lib/agents"

interface Props {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>
}

async function fetchAgents(searchParams: {
  q?: string
  category?: string
  sort?: string
}): Promise<AgentListItem[]> {
  if (process.env.NODE_ENV === "development") {
    await seedDemoAgentsIfEmpty()
  }

  const supabase = await createClient()
  let query = supabase
    .from("agents")
    .select(
      "id, slug, name, tagline, category, avg_rating, total_hires, total_reviews, pricing_model, credits_per_session, icon_url, creator_id",
    )
    .eq("status", "published")

  if (searchParams.q) {
    const term = `%${searchParams.q}%`
    query = query.or(
      `name.ilike.${term},tagline.ilike.${term},description.ilike.${term}`,
    )
  }

  if (searchParams.category && searchParams.category !== "all") {
    query = query.eq("category", searchParams.category)
  }

  switch (searchParams.sort) {
    case "newest":
      query = query.order("published_at", {
        ascending: false,
        nullsFirst: false,
      })
      break
    case "highest_rated":
      query = query.order("avg_rating", {
        ascending: false,
        nullsFirst: false,
      })
      break
    case "most_hired":
      query = query.order("total_hires", { ascending: false })
      break
    default:
      query = query.order("total_hires", { ascending: false })
      break
  }

  query = query.limit(50)
  const { data } = await query
  if (!data) return []

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
    creator_name: null,
  }))
}

export default async function DiscoverPage({ searchParams }: Props) {
  const params = await searchParams
  const agents = await fetchAgents(params)

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <Suspense>
        <DiscoverSidebar />
      </Suspense>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <Suspense>
          <DiscoverContent agents={agents} />
        </Suspense>
      </div>
    </div>
  )
}
