import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticatePublishToken, AuthError } from '@/lib/publish-api/auth'
import {
  publishAgentFromRepo,
  listCreatorAgents,
  PublishError,
} from '@/lib/publish-api/publish'

const publishSchema = z.object({
  repo: z.string().min(3).regex(/^[^/]+\/[^/]+$/, 'Must be in "owner/repo" format'),
  branch: z.string().min(1).optional(),
  github_token: z.string().min(1).optional(),
  overrides: z.record(z.unknown()).optional(),
})

/**
 * POST /api/v1/agents — Publish an agent from a GitHub repo.
 * Auth: Bearer ab_pub_<token>
 */
export async function POST(request: Request) {
  try {
    const { userId } = await authenticatePublishToken(request)
    const body = await request.json()

    const parsed = publishSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map(i => i.message).join(', ') },
        { status: 422 }
      )
    }

    const result = await publishAgentFromRepo({
      userId,
      repo: parsed.data.repo,
      branch: parsed.data.branch,
      githubToken: parsed.data.github_token,
      overrides: parsed.data.overrides,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    if (e instanceof PublishError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    const message =
      e instanceof Error ? e.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/v1/agents — List the caller's published agents.
 * Auth: Bearer ab_pub_<token>
 */
export async function GET(request: Request) {
  try {
    const { userId } = await authenticatePublishToken(request)
    const agents = await listCreatorAgents(userId)
    return NextResponse.json({ agents })
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    if (e instanceof PublishError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
