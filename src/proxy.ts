import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Changed this function name from 'middleware' to 'proxy'
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 1. Fix Incomplete URLs
  // If someone types /admin or /attendee, automatically send them to the correct default sub-page
  if (path === '/admin') {
    return NextResponse.redirect(new URL('/admin/attendees', request.url))
  }
  if (path === '/attendee') {
    return NextResponse.redirect(new URL('/attendee/register', request.url))
  }

  // 2. Fix the Redirect 404 Bug
  const isProtected = path.startsWith('/admin') || path.startsWith('/attendee')
  
  // Look for the auth cookie you set in your loginAction (adjust the name 'session' if yours is different)
  const isAuthenticated = request.cookies.has('session') 

  if (isProtected && !isAuthenticated) {
    // Redirect to the home page '/' so they see the login modal, NOT to a missing '/login' route!
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Apply this logic to all sub-routes
  matcher: ['/admin/:path*', '/attendee/:path*'],
}