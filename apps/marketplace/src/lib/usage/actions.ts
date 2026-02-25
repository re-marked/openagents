'use server'

import { createServiceClient } from '@openagents/db/server'
import { getUser } from '@/lib/auth/get-user'

export interface CreditBalance {
  subscriptionCredits: number
  topupCredits: number
  totalCredits: number
}

export interface UsageEvent {
  id: string
  instanceId: string
  agentName: string
  inputTokens: number
  outputTokens: number
  computeSeconds: number
  creditsConsumed: number
  costUsd: number
  createdAt: string
}

export interface CreditTransaction {
  id: string
  type: string
  creditType: string
  amount: number
  description: string | null
  createdAt: string
}

export interface UsageSummary {
  totalCreditsUsed: number
  totalInputTokens: number
  totalOutputTokens: number
  totalComputeSeconds: number
}

/** Daily credit consumption for the area chart */
export interface DailyCredits {
  date: string
  credits: number
}

/** Per-agent credit breakdown for the bar chart */
export interface AgentBreakdown {
  agent: string
  credits: number
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

export async function getCreditBalance(): Promise<CreditBalance> {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const { data } = await service
    .from('credit_balances')
    .select('subscription_credits, topup_credits')
    .eq('user_id', user.id)
    .single()

  const sub = data?.subscription_credits ?? 0
  const top = data?.topup_credits ?? 0

  return {
    subscriptionCredits: sub,
    topupCredits: top,
    totalCredits: sub + top,
  }
}

export async function getUsageEvents(limit = 50): Promise<UsageEvent[]> {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const { data } = await service
    .from('usage_events')
    .select('id, instance_id, input_tokens, output_tokens, compute_seconds, credits_consumed, cost_usd, created_at, agent_instances!inner(display_name, agents!inner(name))')
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
      creditsConsumed: e.credits_consumed,
      costUsd: e.cost_usd,
      createdAt: e.created_at,
    }
  })
}

export async function getCreditTransactions(limit = 50): Promise<CreditTransaction[]> {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const { data } = await service
    .from('credit_transactions')
    .select('id, type, credit_type, amount, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((t) => ({
    id: t.id,
    type: t.type,
    creditType: t.credit_type,
    amount: t.amount,
    description: t.description,
    createdAt: t.created_at,
  }))
}

export async function getUsageSummary(): Promise<UsageSummary> {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = await service
    .from('usage_events')
    .select('credits_consumed, input_tokens, output_tokens, compute_seconds')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString())

  const events = data ?? []

  return {
    totalCreditsUsed: events.reduce((sum, e) => sum + e.credits_consumed, 0),
    totalInputTokens: events.reduce((sum, e) => sum + e.input_tokens, 0),
    totalOutputTokens: events.reduce((sum, e) => sum + e.output_tokens, 0),
    totalComputeSeconds: events.reduce((sum, e) => sum + e.compute_seconds, 0),
  }
}

/** Daily credits consumed over the last 30 days, for the big area chart */
export async function getDailyCredits(): Promise<DailyCredits[]> {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const service = createServiceClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = await service
    .from('usage_events')
    .select('credits_consumed, created_at')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  // Bucket by day
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
      buckets[day] += e.credits_consumed
    }
  }

  return Object.entries(buckets).map(([date, credits]) => ({ date, credits }))
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
    .select('credits_consumed, input_tokens, output_tokens, compute_seconds, agent_instances!inner(display_name, agents!inner(name))')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString())

  const map = new Map<string, { credits: number; tokens: number; compute: number }>()
  for (const e of data ?? []) {
    const instance = (e as Record<string, unknown>).agent_instances as {
      display_name: string | null
      agents: { name: string }
    }
    const name = instance.display_name ?? instance.agents.name
    const prev = map.get(name) ?? { credits: 0, tokens: 0, compute: 0 }
    map.set(name, {
      credits: prev.credits + e.credits_consumed,
      tokens: prev.tokens + e.input_tokens + e.output_tokens,
      compute: prev.compute + e.compute_seconds,
    })
  }

  return Array.from(map.entries())
    .map(([agent, v]) => ({ agent, ...v }))
    .sort((a, b) => b.credits - a.credits)
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
