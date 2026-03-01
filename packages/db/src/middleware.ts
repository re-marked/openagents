import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from './database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  // For RSC flight requests (client-side navigation), use getSession() which reads
  // the JWT locally without a network call. The layout's getUser() still validates.
  // For full page loads, use getUser() to refresh tokens.
  const isRscFlight = request.headers.get('rsc') === '1'
  const { data: { user } } = isRscFlight
    ? await (async () => {
        const { data: { session } } = await supabase.auth.getSession()
        return { data: { user: session?.user ?? null } }
      })()
    : await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public auth pages — never redirect these
  const isAuthPage = pathname === '/login' || pathname === '/platform/login'

  // Protect /workspace/* and /platform/* routes (except login pages)
  if (!user && !isAuthPage && (pathname.startsWith('/workspace') || pathname.startsWith('/platform'))) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.startsWith('/platform') ? '/platform/login' : '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
