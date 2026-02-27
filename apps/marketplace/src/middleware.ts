import { updateSession } from '@agentbay/db/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Launch lockdown: only the landing page is public ──
  // Set NEXT_PUBLIC_LAUNCH_LOCKDOWN=false (or remove it) to open the full app.
  if (process.env.NEXT_PUBLIC_LAUNCH_LOCKDOWN !== 'false' && pathname !== '/') {
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
