"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  DailyCredits,
  AgentBreakdown,
  TokenSplit,
  DailyCompute,
} from "@/lib/usage/actions"

// ─── Big credit usage area chart ─────────────────────────────────────────────

const creditsConfig = {
  credits: {
    label: "Credits",
    color: "hsl(215, 90%, 58%)",
  },
} satisfies ChartConfig

export function CreditsAreaChart({ data }: { data: DailyCredits[] }) {
  const hasData = data.some((d) => d.credits > 0)

  return (
    <Card className="border-0 col-span-full">
      <CardHeader>
        <CardTitle>Credit Usage</CardTitle>
        <CardDescription>Daily credits consumed over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No usage data yet. Start chatting with an agent!
          </div>
        ) : (
          <ChartContainer config={creditsConfig} className="h-[300px] w-full">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="creditsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-credits)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-credits)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v: string) => {
                  const d = new Date(v + "T00:00:00")
                  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(v: string) => {
                      const d = new Date(v + "T00:00:00")
                      return d.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="credits"
                stroke="var(--color-credits)"
                fill="url(#creditsFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Token split pie chart ───────────────────────────────────────────────────

const tokenPieConfig = {
  "input-tokens": {
    label: "Input",
    color: "hsl(215, 90%, 58%)",
  },
  "output-tokens": {
    label: "Output",
    color: "hsl(160, 70%, 45%)",
  },
} satisfies ChartConfig

const PIE_COLORS = ["hsl(215, 90%, 58%)", "hsl(160, 70%, 45%)"]

export function TokenPieChart({ data }: { data: TokenSplit[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <Card className="border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tokens</CardTitle>
        <CardDescription>Input vs output (30d)</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No token data
          </div>
        ) : (
          <ChartContainer config={tokenPieConfig} className="mx-auto h-[200px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                strokeWidth={2}
                stroke="hsl(var(--card))"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Per-agent bar chart ─────────────────────────────────────────────────────

const agentBarConfig = {
  credits: {
    label: "Credits",
    color: "hsl(280, 65%, 55%)",
  },
} satisfies ChartConfig

export function AgentBarChart({ data }: { data: AgentBreakdown[] }) {
  return (
    <Card className="border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">By Agent</CardTitle>
        <CardDescription>Credits per agent (30d)</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No agent data
          </div>
        ) : (
          <ChartContainer config={agentBarConfig} className="h-[200px] w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 4, bottom: 0, left: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="agent"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={80}
                tick={{ fontSize: 12 }}
              />
              <XAxis type="number" hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="credits"
                fill="var(--color-credits)"
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Daily compute small area chart ──────────────────────────────────────────

const computeConfig = {
  seconds: {
    label: "Seconds",
    color: "hsl(35, 90%, 55%)",
  },
} satisfies ChartConfig

export function ComputeAreaChart({ data }: { data: DailyCompute[] }) {
  const hasData = data.some((d) => d.seconds > 0)

  return (
    <Card className="border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Compute</CardTitle>
        <CardDescription>Daily compute time (30d)</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No compute data
          </div>
        ) : (
          <ChartContainer config={computeConfig} className="h-[200px] w-full">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="computeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-seconds)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-seconds)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v: string) => {
                  const d = new Date(v + "T00:00:00")
                  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(v: string) => {
                      const d = new Date(v + "T00:00:00")
                      return d.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                      })
                    }}
                    formatter={(value) => {
                      const s = Number(value)
                      if (s < 60) return `${Math.round(s)}s`
                      return `${(s / 60).toFixed(1)}m`
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="seconds"
                stroke="var(--color-seconds)"
                fill="url(#computeFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
