import { Suspense } from "react"
import { createClient } from "@agentbay/db/server"
import { getUser } from "@/lib/auth/get-user"
import { DiscoverSidebar } from "@/components/discover-sidebar"
import { DiscoverContent } from "@/components/discover-content"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AgentListItem } from "@/lib/agents"

interface Props {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>
}

async function fetchAgents(searchParams: {
  q?: string
  category?: string
  sort?: string
}): Promise<AgentListItem[]> {
  const supabase = await createClient()
  let query = supabase
    .from("agents")
    .select(
      "id, slug, name, tagline, description, category, avg_rating, total_hires, total_reviews, icon_url, creator_id",
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

  const mapped = data.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    tagline: a.tagline,
    description: a.description,
    category: a.category,
    avg_rating: a.avg_rating,
    total_hires: a.total_hires,
    total_reviews: a.total_reviews,
    icon_url: a.icon_url,
    creator_name: null,
  }))

  // Pin Personal AI to the top always
  const pinned = mapped.filter(a => a.slug === 'personal-ai')
  const rest = mapped.filter(a => a.slug !== 'personal-ai')
  return [...pinned, ...rest]
}

export default async function DiscoverPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([getUser(), searchParams])
  const agents = await fetchAgents(params)

  return (
    <SidebarProvider className="h-full !min-h-0">
      <Suspense>
        <DiscoverSidebar />
      </Suspense>
      <SidebarInset className="overflow-hidden">
        <ScrollArea className="h-0 flex-1">
          <Suspense>
            <DiscoverContent agents={agents} user={user} />
          </Suspense>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  )
}
