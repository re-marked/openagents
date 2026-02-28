import { Bot, Plus, MoreHorizontal, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'
import { redirect } from 'next/navigation'
import { unpublishAgent } from '@/lib/publish/actions'

export default async function AgentsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: agents } = await service
    .from('agents')
    .select(
      'id, slug, name, tagline, category, status, published_at, total_hires, avg_rating, tags'
    )
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  const agentList = agents ?? []

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

      {agentList.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agentList.map((agent) => (
            <Card key={agent.id} className="relative p-5">
              <div className="flex items-start justify-between">
                <Link
                  href={`/agents/${agent.slug}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {agent.name[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{agent.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {agent.tagline}
                    </p>
                  </div>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/agents/${agent.slug}`}>Edit</Link>
                    </DropdownMenuItem>
                    <form
                      action={async () => {
                        'use server'
                        await unpublishAgent(agent.slug)
                      }}
                    >
                      <DropdownMenuItem asChild>
                        <button type="submit" className="w-full">
                          <EyeOff className="mr-2 size-4" />
                          Unpublish
                        </button>
                      </DropdownMenuItem>
                    </form>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge
                  variant={agent.status === 'published' ? 'default' : 'secondary'}
                  className="text-[10px]"
                >
                  {agent.status}
                </Badge>
                <span>{agent.category}</span>
                <span className="mx-1">·</span>
                <span>{agent.total_hires ?? 0} hires</span>
                {agent.avg_rating != null && (
                  <>
                    <span className="mx-1">·</span>
                    <span>{Number(agent.avg_rating).toFixed(1)} rating</span>
                  </>
                )}
              </div>

              {agent.tags && agent.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {agent.tags.slice(0, 4).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-1 items-center justify-center border-dashed p-12">
          <div className="text-center">
            <Bot className="mx-auto size-10 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No agents published</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Import a GitHub repo containing an agent.yaml to get started.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
