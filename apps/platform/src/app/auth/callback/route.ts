import { createClient as createServerClient, createServiceClient } from '@agentbay/db/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Upgrade user role to 'creator' on first platform login
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const service = createServiceClient()
        await service
          .from('users')
          .update({ role: 'creator' })
          .eq('id', user.id)
          .is('role', null)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
