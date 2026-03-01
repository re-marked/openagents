import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'

// ── Types ────────────────────────────────────────────────────────────────

interface UsageEvent {
  date: string
  sessionId: string
  inputTokens: number
  outputTokens: number
  computeSeconds: number
  costUsd: number
}

interface DailyEntry {
  date: string
  cost: number
  tokens: number
  sessions: number
}

interface UsageResponse {
  summary: {
    totalCostUsd: number
    totalInputTokens: number
    totalOutputTokens: number
    totalComputeSeconds: number
    totalSessions: number
  }
  daily: DailyEntry[]
  events: UsageEvent[]
}

// ── Mock data ────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateMockUsage(days: number): UsageResponse {
  const now = new Date()
  const rand = seededRandom(77)
  const daily: DailyEntry[] = []
  const events: UsageEvent[] = []

  let totalCostUsd = 0
  let totalInput = 0
  let totalOutput = 0
  let totalCompute = 0
  let totalSessions = 0

  const isHourly = days === 1
  const iterations = isHourly ? 24 : days

  for (let i = iterations - 1; i >= 0; i--) {
    const d = new Date(now)
    if (isHourly) {
      d.setHours(d.getHours() - i, 0, 0, 0)
    } else {
      d.setDate(d.getDate() - i)
    }
    const dateStr = isHourly ? d.toISOString() : d.toISOString().slice(0, 10)

    const hour = d.getHours()
    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    const mult = isHourly
      ? (hour >= 9 && hour <= 18 ? 1.0 : 0.15)
      : (isWeekend ? 0.3 : 1.0)
    const sessionsThisPeriod = isHourly
      ? (rand() > 0.5 ? 1 : 0)
      : Math.round(rand() * 4 * mult) + (isWeekend ? 0 : 1)

    let periodCost = 0
    let periodTokens = 0

    for (let s = 0; s < sessionsThisPeriod; s++) {
      const input = Math.round(rand() * (isHourly ? 3000 : 8000) * mult + 200)
      const output = Math.round(rand() * (isHourly ? 1500 : 4000) * mult + 100)
      const compute = Math.round(rand() * (isHourly ? 120 : 300) * mult + 10)
      // Estimate cost: ~$3/1M input, ~$15/1M output (mid-range model pricing)
      const costUsd = Math.round(((input / 1_000_000) * 3 + (output / 1_000_000) * 15) * 10000) / 10000

      totalInput += input
      totalOutput += output
      totalCompute += compute
      totalCostUsd += costUsd
      periodCost += costUsd
      periodTokens += input + output

      events.push({
        date: dateStr,
        sessionId: `mock-s-${String(i * 10 + s).padStart(3, '0')}`,
        inputTokens: input,
        outputTokens: output,
        computeSeconds: compute,
        costUsd,
      })
    }

    totalSessions += sessionsThisPeriod
    daily.push({ date: dateStr, cost: Math.round(periodCost * 10000) / 10000, tokens: periodTokens, sessions: sessionsThisPeriod })
  }

  totalCostUsd = Math.round(totalCostUsd * 10000) / 10000

  return {
    summary: {
      totalCostUsd,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalComputeSeconds: totalCompute,
      totalSessions,
    },
    daily,
    events: events.reverse().slice(0, 50),
  }
}

// ── Route ────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const instanceId = searchParams.get('instanceId')
  const days = parseInt(searchParams.get('days') ?? '30', 10)

  if (!instanceId) {
    return NextResponse.json({ error: 'Missing instanceId' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: instance } = await service
    .from('agent_instances')
    .select('id, fly_app_name')
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .single()

  if (!instance) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  // Mock agents
  if (instance.fly_app_name?.startsWith('mock-')) {
    return NextResponse.json(generateMockUsage(days))
  }

  // Real agents — query usage_events table
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const { data: rawEvents } = await service
    .from('usage_events')
    .select('id, session_id, input_tokens, output_tokens, compute_seconds, cost_usd, created_at')
    .eq('instance_id', instanceId)
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: true })

  const events = rawEvents ?? []

  // Build summary
  let totalCostUsd = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let totalComputeSeconds = 0
  const sessionIds = new Set<string>()

  for (const e of events) {
    totalCostUsd += e.cost_usd
    totalInputTokens += e.input_tokens
    totalOutputTokens += e.output_tokens
    totalComputeSeconds += e.compute_seconds
    if (e.session_id) sessionIds.add(e.session_id)
  }

  totalCostUsd = Math.round(totalCostUsd * 10000) / 10000

  // Build daily/hourly buckets
  const isHourly = days === 1
  const buckets: Record<string, { cost: number; tokens: number; sessions: Set<string> }> = {}

  if (isHourly) {
    const now = new Date()
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now)
      d.setHours(d.getHours() - i, 0, 0, 0)
      buckets[d.toISOString()] = { cost: 0, tokens: 0, sessions: new Set() }
    }
  } else {
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      buckets[d.toISOString().slice(0, 10)] = { cost: 0, tokens: 0, sessions: new Set() }
    }
  }

  for (const e of events) {
    const eventDate = new Date(e.created_at)
    let key: string
    if (isHourly) {
      eventDate.setMinutes(0, 0, 0)
      key = eventDate.toISOString()
    } else {
      key = e.created_at.slice(0, 10)
    }
    if (key in buckets) {
      buckets[key].cost += e.cost_usd
      buckets[key].tokens += e.input_tokens + e.output_tokens
      if (e.session_id) buckets[key].sessions.add(e.session_id)
    }
  }

  const daily: DailyEntry[] = Object.entries(buckets).map(([date, b]) => ({
    date,
    cost: Math.round(b.cost * 10000) / 10000,
    tokens: b.tokens,
    sessions: b.sessions.size,
  }))

  // Build events list (newest first, limit 50)
  const usageEvents: UsageEvent[] = events
    .slice()
    .reverse()
    .slice(0, 50)
    .map((e) => ({
      date: isHourly ? e.created_at : e.created_at.slice(0, 10),
      sessionId: e.session_id ?? '',
      inputTokens: e.input_tokens,
      outputTokens: e.output_tokens,
      computeSeconds: e.compute_seconds,
      costUsd: e.cost_usd,
    }))

  return NextResponse.json({
    summary: {
      totalCostUsd,
      totalInputTokens,
      totalOutputTokens,
      totalComputeSeconds,
      totalSessions: sessionIds.size,
    },
    daily,
    events: usageEvents,
  } satisfies UsageResponse)
}
