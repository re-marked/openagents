import { Bot, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
        <Button asChild>
          <Link href="/agents/new">
            <Plus className="mr-2 size-4" />
            Import from GitHub
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      <Card className="flex flex-1 items-center justify-center border-dashed p-12">
        <div className="text-center">
          <Bot className="mx-auto size-10 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No agents published</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Import a GitHub repo containing an agent.yaml to get started.
          </p>
        </div>
      </Card>
    </div>
  )
}
