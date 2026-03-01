'use server'

import { createServiceClient } from '@agentbay/db/server'
import { getUser } from '@/lib/auth/get-user'

export interface UsageEvent {
  id: string
  instanceId: string
  agentName: string
  inputTokens: number
  outputTokens: number
  computeSeconds: number
  costUsd: number
  createdAt: string
}

export interface UsageSummary {
  totalInputTokens: number
  totalOutputTokens: number
  totalComputeSeconds: number
  totalCostUsd: number
}

/** Daily API cost for the area chart */
export interface DailyCost {
  date: string
  cost: number
}

/** Per-agent breakdown for the bar chart */
export interface AgentBreakdown {
  agent: string
  cost: number
  tokens: number
  compute: number
}

/** Token split for the pie chart */
export interface TokenSplit {
  name: string
  value: number
  fill: string
}

/** Daily compute for the small area chart */
export interface DailyCompute {
  date: string
  seconds: number
}

export async function getUsageEvents(limit = 50): Promise<UsageEvent[]> {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const { data } = await service
    .from('usage_events')
    .select('id, instance_id, input_tokens, output_tokens, compute_seconds, cost_usd, created_at, agent_instances!inner(display_name, agents!inner(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((e) => {
    const instance = (e as Record<string, unknown>).agent_instances as {
      display_name: string | null
      agents: { name: string }
    }
    return {
      id: e.id,
      instanceId: e.instance_id,
      agentName: instance.display_name ?? instance.agents.name,
      inputTokens: e.input_tokens,
      outputTokens: e.output_tokens,
      computeSeconds: e.compute_seconds,
      costUsd: e.cost_usd,
      createdAt: e.created_at,
    }
  })
}

export async function getUsageSummary(): Promise<UsageSummary> {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = await service
    .from('usage_events')
    .select('input_tokens, output_tokens, compute_seconds, cost_usd')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString())

  const events = data ?? []

  return {
    totalInputTokens: events.reduce((sum, e) => sum + e.input_tokens, 0),
    totalOutputTokens: events.reduce((sum, e) => sum + e.output_tokens, 0),
    totalComputeSeconds: events.reduce((sum, e) => sum + e.compute_seconds, 0),
    totalCostUsd: events.reduce((sum, e) => sum + e.cost_usd, 0),
  }
}

/** Daily API cost over the last 30 days */
export async function getDailyCost(): Promise<DailyCost[]> {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = await service
    .from('usage_events')
    .select('cost_usd, created_at')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  const buckets: Record<string, number> = {}
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    buckets[d.toISOString().slice(0, 10)] = 0
  }

  for (const e of data ?? []) {
    const day = e.created_at.slice(0, 10)
    if (day in buckets) {
      buckets[day] += e.cost_usd
    }
  }

  return Object.entries(buckets).map(([date, cost]) => ({ date, cost: Math.round(cost * 10000) / 10000 }))
}

/** Per-agent breakdown for the bar chart */
export async function getAgentBreakdown(): Promise<AgentBreakdown[]> {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = await service
    .from('usage_events')
    .select('cost_usd, input_tokens, output_tokens, compute_seconds, agent_instances!inner(display_name, agents!inner(name))')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString())

  const map = new Map<string, { cost: number; tokens: number; compute: number }>()
  for (const e of data ?? []) {
    const instance = (e as Record<string, unknown>).agent_instances as {
      display_name: string | null
      agents: { name: string }
    }
    const name = instance.display_name ?? instance.agents.name
    const prev = map.get(name) ?? { cost: 0, tokens: 0, compute: 0 }
    map.set(name, {
      cost: prev.cost + e.cost_usd,
      tokens: prev.tokens + e.input_tokens + e.output_tokens,
      compute: prev.compute + e.compute_seconds,
    })
  }

  return Array.from(map.entries())
    .map(([agent, v]) => ({ agent, ...v }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 8)
}

/** Token split (input vs output) for the pie chart */
export async function getTokenSplit(): Promise<TokenSplit[]> {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = await service
    .from('usage_events')
    .select('input_tokens, output_tokens')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString())

  const events = data ?? []
  const input = events.reduce((sum, e) => sum + e.input_tokens, 0)
  const output = events.reduce((sum, e) => sum + e.output_tokens, 0)

  return [
    { name: 'Input', value: input, fill: 'var(--color-input-tokens)' },
    { name: 'Output', value: output, fill: 'var(--color-output-tokens)' },
  ]
}

/** Daily compute seconds for the small chart */
export async function getDailyCompute(): Promise<DailyCompute[]> {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = await service
    .from('usage_events')
    .select('compute_seconds, created_at')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  const buckets: Record<string, number> = {}
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    buckets[d.toISOString().slice(0, 10)] = 0
  }

  for (const e of data ?? []) {
    const day = e.created_at.slice(0, 10)
    if (day in buckets) {
      buckets[day] += e.compute_seconds
    }
  }

  return Object.entries(buckets).map(([date, seconds]) => ({ date, seconds }))
}
