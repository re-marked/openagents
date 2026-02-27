import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createServiceClient } from '@agentbay/db/server'

// ── Types ────────────────────────────────────────────────────────────────

interface ActivityItem {
  sessionId: string
  startedAt: string
  endedAt: string | null
  preview: string
  messageCount: number
  durationMinutes: number
}

interface StatsResponse {
  relationship: {
    totalConversations: number
    totalMessages: number
    totalMinutes: number
    longestSessionMinutes: number
    skillsCount: number
    memoriesCount: number
  }
  recentActivity: ActivityItem[]
}

// ── Mock data ────────────────────────────────────────────────────────────

function generateMockStats(): StatsResponse {
  const now = new Date()

  const mockActivity: ActivityItem[] = [
    {
      sessionId: 'mock-s-001',
      startedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 23 * 60 * 1000).toISOString(),
      preview: 'Help me debug this React component that keeps re-rendering',
      messageCount: 12,
      durationMinutes: 23,
    },
    {
      sessionId: 'mock-s-002',
      startedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      preview: 'Write a business proposal for the Q2 marketing campaign',
      messageCount: 28,
      durationMinutes: 45,
    },
    {
      sessionId: 'mock-s-003',
      startedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
      preview: "What's the difference between SSE and WebSockets for dashboards?",
      messageCount: 6,
      durationMinutes: 8,
    },
    {
      sessionId: 'mock-s-004',
      startedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 67 * 60 * 1000).toISOString(),
      preview: 'Review my Supabase RLS policies for multi-tenant security',
      messageCount: 34,
      durationMinutes: 67,
    },
    {
      sessionId: 'mock-s-005',
      startedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 134 * 60 * 1000).toISOString(),
      preview: 'Set up a CI/CD pipeline with GitHub Actions for our monorepo',
      messageCount: 51,
      durationMinutes: 134,
    },
    {
      sessionId: 'mock-s-006',
      startedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
      preview: 'Explain how Fly.io machine auto-suspend works',
      messageCount: 9,
      durationMinutes: 15,
    },
    {
      sessionId: 'mock-s-007',
      startedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 42 * 60 * 1000).toISOString(),
      preview: 'Help me migrate from REST endpoints to tRPC for internal APIs',
      messageCount: 22,
      durationMinutes: 42,
    },
    {
      sessionId: 'mock-s-008',
      startedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000).toISOString(),
      preview: 'Generate TypeScript types from our Supabase schema',
      messageCount: 8,
      durationMinutes: 18,
    },
    {
      sessionId: 'mock-s-009',
      startedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000 + 56 * 60 * 1000).toISOString(),
      preview: 'Design the database schema for our analytics event tracking',
      messageCount: 31,
      durationMinutes: 56,
    },
    {
      sessionId: 'mock-s-010',
      startedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
      preview: 'Compare Vitest and Jest for our Next.js testing setup',
      messageCount: 14,
      durationMinutes: 25,
    },
  ]

  return {
    relationship: {
      totalConversations: 47,
      totalMessages: 312,
      totalMinutes: 720,
      longestSessionMinutes: 134,
      skillsCount: 3,
      memoriesCount: 23,
    },
    recentActivity: mockActivity,
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

  // Mock agents — return rich demo data
  if (instance.fly_app_name?.startsWith('mock-')) {
    return NextResponse.json(generateMockStats())
  }

  // Real agents — query from database
  try {
    // 1. Aggregate session stats
    const { data: sessionStats } = await service
      .from('sessions')
      .select('id, compute_seconds')
      .eq('instance_id', instanceId)
      .eq('user_id', user.id)

    const totalConversations = sessionStats?.length ?? 0
    const totalComputeSeconds = sessionStats?.reduce((sum, s) => sum + (s.compute_seconds ?? 0), 0) ?? 0
    const longestSessionSeconds = sessionStats?.reduce((max, s) => Math.max(max, s.compute_seconds ?? 0), 0) ?? 0

    // 2. Count total messages across all sessions
    let totalMessages = 0
    if (sessionStats && sessionStats.length > 0) {
      const sessionIds = sessionStats.map(s => s.id)
      const { count } = await service
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('session_id', sessionIds)

      totalMessages = count ?? 0
    }

    // 3. Recent sessions with preview (last 10)
    const { data: recentSessions } = await service
      .from('sessions')
      .select('id, started_at, ended_at, compute_seconds')
      .eq('instance_id', instanceId)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(10)

    const recentActivity: ActivityItem[] = []

    if (recentSessions) {
      for (const session of recentSessions) {
        // Get first user message as preview
        const { data: firstMsg } = await service
          .from('messages')
          .select('content')
          .eq('session_id', session.id)
          .eq('role', 'user')
          .order('created_at', { ascending: true })
          .limit(1)
          .single()

        // Count messages in this session
        const { count: msgCount } = await service
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id)

        const durationSeconds = session.compute_seconds ?? 0

        recentActivity.push({
          sessionId: session.id,
          startedAt: session.started_at,
          endedAt: session.ended_at,
          preview: firstMsg?.content
            ? firstMsg.content.length > 80
              ? firstMsg.content.slice(0, 80) + '...'
              : firstMsg.content
            : 'New conversation',
          messageCount: msgCount ?? 0,
          durationMinutes: Math.round(durationSeconds / 60),
        })
      }
    }

    const response: StatsResponse = {
      relationship: {
        totalConversations,
        totalMessages,
        totalMinutes: Math.round(totalComputeSeconds / 60),
        longestSessionMinutes: Math.round(longestSessionSeconds / 60),
        skillsCount: 0,
        memoriesCount: 0,
      },
      recentActivity,
    }

    return NextResponse.json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch stats'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
