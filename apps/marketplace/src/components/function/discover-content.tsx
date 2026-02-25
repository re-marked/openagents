"use client"

import { useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { AgentCardLarge } from "@/components/function/agent-card"
import type { AgentListItem } from "@/lib/agents"

export function DiscoverContent({ agents }: { agents: AgentListItem[] }) {
  const searchParams = useSearchParams()
  const query = searchParams.get("q")
  const category = searchParams.get("category")

  const heading = query
    ? `Results for "${query}"`
    : category && category !== "all"
      ? category.charAt(0).toUpperCase() + category.slice(1)
      : "Discover"

  return (
    <main className="px-8 py-8 lg:px-12">
      {/* Heading */}
      <h1 className="text-[28px] font-bold tracking-tight mb-8">{heading}</h1>

      {/* Grid */}
      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary mb-5">
            <Search className="h-9 w-9 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No assistants found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try a different search term or browse another category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCardLarge key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </main>
  )
}
