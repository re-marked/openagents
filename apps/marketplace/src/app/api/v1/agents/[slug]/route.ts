import { NextResponse } from 'next/server'
import { authenticatePublishToken, AuthError } from '@/lib/publish-api/auth'
import {
  getCreatorAgent,
  updateAgent,
  unpublishAgent,
  PublishError,
} from '@/lib/publish-api/publish'

type RouteContext = { params: Promise<{ slug: string }> }

/**
 * GET /api/v1/agents/[slug] — Get a specific agent's details.
 * Auth: Bearer ab_pub_<token>
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { userId } = await authenticatePublishToken(request)
    const { slug } = await params
    const agent = await getCreatorAgent(userId, slug)
    return NextResponse.json(agent)
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

/**
 * PATCH /api/v1/agents/[slug] — Update an agent's metadata.
 * Auth: Bearer ab_pub_<token>
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { userId } = await authenticatePublishToken(request)
    const { slug } = await params
    const body = await request.json()
    const agent = await updateAgent(userId, slug, body)
    return NextResponse.json(agent)
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

/**
 * DELETE /api/v1/agents/[slug] — Unpublish an agent (set to draft).
 * Auth: Bearer ab_pub_<token>
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { userId } = await authenticatePublishToken(request)
    const { slug } = await params
    const result = await unpublishAgent(userId, slug)
    return NextResponse.json(result)
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
