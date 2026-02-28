import { NextResponse } from 'next/server'
import { authenticatePublishToken, AuthError } from '@/lib/publish-api/auth'
import {
  publishAgentFromRepo,
  listCreatorAgents,
  PublishError,
} from '@/lib/publish-api/publish'

/**
 * POST /api/v1/agents — Publish an agent from a GitHub repo.
 * Auth: Bearer ab_pub_<token>
 */
export async function POST(request: Request) {
  try {
    const { userId } = await authenticatePublishToken(request)
    const body = await request.json()

    if (!body.repo || typeof body.repo !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: repo (e.g., "owner/repo-name")' },
        { status: 422 }
      )
    }

    const result = await publishAgentFromRepo({
      userId,
      repo: body.repo,
      branch: body.branch,
      githubToken: body.github_token,
      overrides: body.overrides,
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
