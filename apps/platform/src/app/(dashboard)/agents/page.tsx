import { Bot, Plus } from 'lucide-react'
import Link from 'next/link'

export default function AgentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground">
            Manage your published agents.
          </p>
        </div>
        <Link
          href="/agents/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Import from GitHub
        </Link>
      </div>

      {/* Empty state */}
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-12">
        <div className="text-center">
          <Bot className="mx-auto size-10 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No agents published</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Import a GitHub repo containing an agent.yaml to get started.
          </p>
        </div>
      </div>
    </div>
  )
}
