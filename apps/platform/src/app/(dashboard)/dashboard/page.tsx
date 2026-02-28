import { Bot, Users, DollarSign, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // Fetch all stats in parallel
  const [agentsResult, hiresResult, earningsResult, monthEarningsResult, recentAgents] =
    await Promise.all([
      service
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.id),
      service
        .from('agent_instances')
        .select('id', { count: 'exact', head: true })
        .in(
          'agent_id',
          (
            await service
              .from('agents')
              .select('id')
              .eq('creator_id', user.id)
          ).data?.map((a) => a.id) ?? []
        ),
      service
        .from('creator_earnings')
        .select('creator_amount')
        .eq('creator_id', user.id),
      service
        .from('creator_earnings')
        .select('creator_amount')
        .eq('creator_id', user.id)
        .gte(
          'created_at',
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        ),
      service
        .from('agents')
        .select('id, slug, name, category, status, total_hires')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  const agentCount = agentsResult.count ?? 0
  const hireCount = hiresResult.count ?? 0
  const totalEarnings = (earningsResult.data ?? []).reduce(
    (sum, r) => sum + (r.creator_amount ?? 0),
    0
  )
  const monthEarnings = (monthEarningsResult.data ?? []).reduce(
    (sum, r) => sum + (r.creator_amount ?? 0),
    0
  )
  const agents = recentAgents.data ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your published agents and earnings.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Published Agents"
          value={String(agentCount)}
          description="Total agents on the marketplace"
          icon={Bot}
        />
        <StatCard
          title="Total Hires"
          value={String(hireCount)}
          description="Users running your agents"
          icon={Users}
        />
        <StatCard
          title="Total Earnings"
          value={`$${(totalEarnings / 100).toFixed(2)}`}
          description="Lifetime revenue"
          icon={DollarSign}
        />
        <StatCard
          title="This Month"
          value={`$${(monthEarnings / 100).toFixed(2)}`}
          description="Revenue this billing period"
          icon={TrendingUp}
        />
      </div>

      {/* Agent overview or empty state */}
      {agents.length > 0 ? (
        <div>
          <h2 className="mb-3 text-lg font-medium">Recent Agents</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Link key={agent.id} href={`/agents/${agent.slug}`}>
                <Card className="p-4 transition-colors hover:bg-accent/50">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                      {agent.name[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.total_hires ?? 0} hires
                        <span className="mx-1.5">·</span>
                        <span
                          className={
                            agent.status === 'published'
                              ? 'text-emerald-500'
                              : 'text-yellow-500'
                          }
                        >
                          {agent.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <Card className="flex flex-1 items-center justify-center border-dashed p-12">
          <div className="text-center">
            <Bot className="mx-auto size-10 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No agents yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Import a repo from GitHub to publish your first agent.
            </p>
            <a
              href="/agents/new"
              className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Import from GitHub
            </a>
          </div>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="py-4">
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
