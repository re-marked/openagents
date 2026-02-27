import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import {
  getCreditBalance,
  getUsageEvents,
  getCreditTransactions,
  getUsageSummary,
  getDailyCredits,
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
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Coins, Zap, MessageSquare, Clock } from 'lucide-react'
import {
  CreditsAreaChart,
  TokenPieChart,
  AgentBarChart,
  ComputeAreaChart,
} from '@/components/usage-charts'
import { MOCK_DATA } from '@/lib/usage/mock-data'

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

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const isTest = params.test === 'true'

  const [
    balance,
    events,
    transactions,
    summary,
    dailyCredits,
    agentBreakdown,
    tokenSplit,
    dailyCompute,
  ] = isTest
    ? [
        MOCK_DATA.balance,
        MOCK_DATA.events,
        MOCK_DATA.transactions,
        MOCK_DATA.summary,
        MOCK_DATA.dailyCredits,
        MOCK_DATA.agentBreakdown,
        MOCK_DATA.tokenSplit,
        MOCK_DATA.dailyCompute,
      ]
    : await Promise.all([
        getCreditBalance(),
        getUsageEvents(),
        getCreditTransactions(),
        getUsageSummary(),
        getDailyCredits(),
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
            Monitor your credit balance and agent activity
          </p>
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Credit Balance
              </CardTitle>
              <Coins className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{balance.totalCredits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {balance.subscriptionCredits > 0 && `${balance.subscriptionCredits} sub`}
                {balance.subscriptionCredits > 0 && balance.topupCredits > 0 && ' + '}
                {balance.topupCredits > 0 && `${balance.topupCredits} top-up`}
                {balance.subscriptionCredits === 0 && balance.topupCredits === 0 && 'No credits'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Credits Used (30d)
              </CardTitle>
              <Zap className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.totalCreditsUsed)}</div>
              <p className="text-xs text-muted-foreground mt-1">last 30 days</p>
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
        </div>

        {/* Big credit chart */}
        <div className="mb-8">
          <CreditsAreaChart data={dailyCredits} />
        </div>

        {/* Smaller charts row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <TokenPieChart data={tokenSplit} />
          <AgentBarChart data={agentBreakdown} />
          <ComputeAreaChart data={dailyCompute} />
        </div>

        {/* Activity / transactions tables */}
        <Tabs defaultValue="activity">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-4">
            {events.length === 0 ? (
              <Card className="border-0">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No usage activity yet.</p>
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
                      <TableHead className="text-right">Credits</TableHead>
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
                        <TableCell className="text-right">{event.creditsConsumed}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(event.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            {transactions.length === 0 ? (
              <Card className="border-0">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No transactions yet.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              tx.type === 'credit'
                                ? 'bg-green-500/10 text-green-400 border-0'
                                : 'bg-orange-500/10 text-orange-400 border-0'
                            }
                          >
                            {tx.type === 'credit' ? 'Credit' : 'Debit'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tx.description ?? tx.creditType}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${tx.type === 'credit' ? 'text-green-400' : 'text-orange-400'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{Math.abs(tx.amount)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
