import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import {
  getUsageEvents,
  getUsageSummary,
  getDailyCost,
  getAgentBreakdown,
  getTokenSplit,
  getDailyCompute,
} from '@/lib/usage/actions'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DollarSign, Zap, MessageSquare, Clock } from 'lucide-react'
import { UsageCharts } from '@/components/usage-charts'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

function formatCost(usd: number): string {
  if (usd === 0) return '$0.00'
  if (usd < 0.01) return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(2)}`
}

export default async function UsagePage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const [
    events,
    summary,
    dailyCost,
    agentBreakdown,
    tokenSplit,
    dailyCompute,
  ] = await Promise.all([
    getUsageEvents(),
    getUsageSummary(),
    getDailyCost(),
    getAgentBreakdown(),
    getTokenSplit(),
    getDailyCompute(),
  ])

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background px-4 rounded-t-xl">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Usage</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="px-8 py-8 lg:px-12">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold tracking-tight">Usage</h1>
          <p className="text-muted-foreground mt-1">
            Track your agent activity and estimated API costs
          </p>
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Est. API Cost (30d)
              </CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCost(summary.totalCostUsd)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                estimated from token usage
              </p>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tokens (30d)
              </CardTitle>
              <MessageSquare className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(summary.totalInputTokens + summary.totalOutputTokens)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(summary.totalInputTokens)} in / {formatNumber(summary.totalOutputTokens)} out
              </p>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Compute (30d)
              </CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(summary.totalComputeSeconds)}</div>
              <p className="text-xs text-muted-foreground mt-1">across all agents</p>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Model
              </CardTitle>
              <Zap className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">BYOK</div>
              <p className="text-xs text-muted-foreground mt-1">your API key, our hosting</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <UsageCharts
          dailyCost={dailyCost}
          tokenSplit={tokenSplit}
          agentBreakdown={agentBreakdown}
          dailyCompute={dailyCompute}
        />

        {/* Activity table */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {events.length === 0 ? (
            <Card className="border-0">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No usage activity yet. Start chatting with an agent!</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Compute</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.agentName}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatNumber(event.inputTokens + event.outputTokens)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDuration(event.computeSeconds)}
                      </TableCell>
                      <TableCell className="text-right">{formatCost(event.costUsd)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(event.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
