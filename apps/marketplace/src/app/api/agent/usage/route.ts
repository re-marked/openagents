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
  credits: number
  costUsd: number
}

interface DailyEntry {
  date: string
  credits: number
  tokens: number
  sessions: number
}

interface UsageResponse {
  summary: {
    totalCredits: number
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

  let totalCredits = 0
  let totalInput = 0
  let totalOutput = 0
  let totalCompute = 0
  let totalSessions = 0

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)

    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    const mult = isWeekend ? 0.3 : 1.0
    const sessionsToday = Math.round(rand() * 4 * mult) + (isWeekend ? 0 : 1)

    let dayCredits = 0
    let dayTokens = 0

    for (let s = 0; s < sessionsToday; s++) {
      const input = Math.round(rand() * 8000 + 500)
      const output = Math.round(rand() * 4000 + 200)
      const compute = Math.round(rand() * 300 + 30)
      const credits = Math.round((input * 0.0003 + output * 0.0012 + compute * 0.001) * 100) / 100
      const costUsd = Math.round(credits * 0.01 * 100) / 100

      totalInput += input
      totalOutput += output
      totalCompute += compute
      totalCredits += credits
      dayCredits += credits
      dayTokens += input + output

      events.push({
        date: dateStr,
        sessionId: `mock-s-${String(i * 10 + s).padStart(3, '0')}`,
        inputTokens: input,
        outputTokens: output,
        computeSeconds: compute,
        credits,
        costUsd,
      })
    }

    totalSessions += sessionsToday
    daily.push({ date: dateStr, credits: Math.round(dayCredits * 100) / 100, tokens: dayTokens, sessions: sessionsToday })
  }

  totalCredits = Math.round(totalCredits * 100) / 100

  return {
    summary: {
      totalCredits,
      totalCostUsd: Math.round(totalCredits * 0.01 * 100) / 100,
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

  // Real agents — return empty for now (same pattern as stats)
  return NextResponse.json({
    summary: {
      totalCredits: 0,
      totalCostUsd: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalComputeSeconds: 0,
      totalSessions: 0,
    },
    daily: [],
    events: [],
  } satisfies UsageResponse)
}
