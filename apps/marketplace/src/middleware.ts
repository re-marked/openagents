import { updateSession } from '@agentbay/db/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Platform redirect ──
  // localhost:3000/platform → localhost:3001, agentbay.cc/platform → platform.agentbay.cc
  if (pathname === '/platform' || pathname.startsWith('/platform/')) {
    const host = request.headers.get('host') ?? ''
    if (host.startsWith('localhost')) {
      return NextResponse.redirect(new URL(`http://localhost:3001${pathname.replace(/^\/platform/, '') || '/'}`, request.url))
    }
    if (host.includes('agentbay.cc')) {
      return NextResponse.redirect(new URL(`https://platform.agentbay.cc${pathname.replace(/^\/platform/, '') || '/'}`, request.url))
    }
  }

  // ── Public API routes — always accessible (token-authed, not session-authed) ──
  if (pathname.startsWith('/api/v1/')) {
    return updateSession(request as any)
  }

  // ── Launch lockdown: only the landing page is public ──
  // Set NEXT_PUBLIC_LAUNCH_LOCKDOWN=true to lock the app (only '/' is accessible).
  // Default: unlocked (app is open). Explicit opt-in prevents accidental lockouts.
  // Auth callback must always be excluded — lockdown breaks OAuth code exchange.
  if (process.env.NEXT_PUBLIC_LAUNCH_LOCKDOWN === 'true' && pathname !== '/' && !pathname.startsWith('/auth/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return updateSession(request as any)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
