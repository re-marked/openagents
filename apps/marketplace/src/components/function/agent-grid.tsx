import { Search } from "lucide-react"
import { AgentCard } from "@/components/function/agent-card"
import type { AgentListItem } from "@/lib/agents"

export function AgentGrid({ agents }: { agents: AgentListItem[] }) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
          <Search className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No assistants found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try a different search term or browse a different category.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  )
}
