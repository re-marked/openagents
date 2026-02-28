import { NextResponse } from 'next/server'
import { authenticatePublishToken, AuthError } from '@/lib/publish-api/auth'
import { previewAgentFromRepo, PublishError } from '@/lib/publish-api/publish'

/**
 * POST /api/v1/agents/preview — Parse metadata and return how it would look.
 * Auth: Bearer ab_pub_<token>
 */
export async function POST(request: Request) {
  try {
    await authenticatePublishToken(request)
    const body = await request.json()

    if (!body.repo || typeof body.repo !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: repo' },
        { status: 422 }
      )
    }

    const preview = await previewAgentFromRepo({
      repo: body.repo,
      branch: body.branch,
      githubToken: body.github_token,
    })

    return NextResponse.json(preview)
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
