import { createClient, createServiceClient } from '@agentbay/db/server'

/**
 * Authenticate a request using a Bearer publish token (ab_pub_...).
 * Hashes the token with SHA-256 and looks it up in publish_tokens.
 * Returns the user_id or throws.
 */
export async function authenticatePublishToken(
  request: Request
): Promise<{ userId: string }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid Authorization header', 401)
  }

  const token = authHeader.slice(7).trim()
  if (!token.startsWith('ab_pub_') || token.length !== 39) {
    throw new AuthError(
      'Invalid token format. Expected ab_pub_<32 hex chars>',
      401
    )
  }

  // SHA-256 hash the raw token
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  const service = createServiceClient()
  const { data: row, error } = await service
    .from('publish_tokens')
    .select('id, user_id')
    .eq('token_hash', tokenHash)
    .single()

  if (error || !row) {
    throw new AuthError('Invalid or revoked token', 401)
  }

  // Update last_used_at (fire-and-forget)
  service
    .from('publish_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', row.id)
    .then(() => {})

  return { userId: row.user_id }
}

/**
 * Authenticate a request using the Supabase session cookie.
 * Used for token management endpoints (create/list/revoke).
 */
export async function authenticateSession(
  _request: Request
): Promise<{ userId: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError('Not authenticated. Please sign in.', 401)
  }

  return { userId: user.id }
}

/**
 * Generate a new publish token and return both the raw token and its hash.
 */
export async function generatePublishToken(): Promise<{
  token: string
  tokenHash: string
  tokenPrefix: string
}> {
  // Generate 32 random hex chars
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const token = `ab_pub_${hex}`
  const tokenPrefix = `ab_pub_${hex.slice(0, 4)}...`

  // SHA-256 hash
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return { token, tokenHash, tokenPrefix }
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}
