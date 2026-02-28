import { NextResponse } from 'next/server'
import { createServiceClient } from '@agentbay/db/server'
import { authenticateSession, AuthError } from '@/lib/publish-api/auth'

/**
 * DELETE /api/v1/tokens/[id] — Revoke a publish token.
 * Auth: Supabase session cookie (browser).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await authenticateSession(request)
    const { id } = await params

    const service = createServiceClient()
    const { error } = await service
      .from('publish_tokens')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ deleted: true })
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
