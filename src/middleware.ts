import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers applied to all responses
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// 🚫 Routes that are not yet live — block direct URL access
const DISABLED_ROUTES = [
  '/info/schedule',
  '/info/learning-resources',
  '/attendee/check-in',
  '/attendee/ijazah-collection',
]

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 0. Block disabled routes (prevents URL injection for commented-out features)
  const normalizedPath = path.replace(/\/+$/, '')
  if (
    DISABLED_ROUTES.some(
      route => normalizedPath === route || normalizedPath.startsWith(route + '/')
    )
  ) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 1. Fix Incomplete URLs
  if (path === '/admin') {
    return NextResponse.redirect(new URL('/admin/attendees', request.url))
  }
  if (path === '/attendee') {
    return NextResponse.redirect(new URL('/attendee/register', request.url))
  }

  // 2. Protect Routes (ONLY lock down the Admin section!)
  const isAdminRoute = path.startsWith('/admin')
  const isAuthenticated = request.cookies.has('admin_session')

  if (isAdminRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. Apply security headers to all responses
  const response = NextResponse.next()

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/attendee/:path*',
    '/info/:path*',
  ],
}