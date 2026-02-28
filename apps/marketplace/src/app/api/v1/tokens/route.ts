import { NextResponse } from 'next/server'
import { createServiceClient } from '@agentbay/db/server'
import {
  authenticateSession,
  generatePublishToken,
  AuthError,
} from '@/lib/publish-api/auth'

/**
 * POST /api/v1/tokens — Create a new publish token.
 * Auth: Supabase session cookie (browser).
 */
export async function POST(request: Request) {
  try {
    const { userId } = await authenticateSession(request)
    const body = await request.json().catch(() => ({}))
    const name = typeof body.name === 'string' ? body.name.trim() : 'default'

    const { token, tokenHash, tokenPrefix } = await generatePublishToken()

    const service = createServiceClient()
    const { data, error } = await service
      .from('publish_tokens')
      .insert({
        user_id: userId,
        name,
        token_hash: tokenHash,
        token_prefix: tokenPrefix,
      })
      .select('id, name, token_prefix, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return the raw token ONCE — it cannot be retrieved later
    return NextResponse.json(
      {
        id: data.id,
        name: data.name,
        token,
        token_prefix: data.token_prefix,
        created_at: data.created_at,
      },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/tokens — List all tokens for the current user.
 * Auth: Supabase session cookie (browser).
 */
export async function GET(request: Request) {
  try {
    const { userId } = await authenticateSession(request)

    const service = createServiceClient()
    const { data, error } = await service
      .from('publish_tokens')
      .select('id, name, token_prefix, last_used_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tokens: data ?? [] })
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
