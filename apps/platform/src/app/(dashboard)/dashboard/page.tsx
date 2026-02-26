import { Bot, Users, DollarSign, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function DashboardPage() {
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
          value="0"
          description="Total agents on the marketplace"
          icon={Bot}
        />
        <StatCard
          title="Total Hires"
          value="0"
          description="Users running your agents"
          icon={Users}
        />
        <StatCard
          title="Total Earnings"
          value="$0.00"
          description="Lifetime revenue"
          icon={DollarSign}
        />
        <StatCard
          title="This Month"
          value="$0.00"
          description="Revenue this billing period"
          icon={TrendingUp}
        />
      </div>

      {/* Empty state */}
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
