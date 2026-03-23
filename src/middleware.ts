import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 1. Fix Incomplete URLs
  // If someone navigates to the base folders, automatically route them to the correct sub-page
  if (path === '/admin') {
    return NextResponse.redirect(new URL('/admin/attendees', request.url))
  }
  if (path === '/attendee') {
    return NextResponse.redirect(new URL('/attendee/register', request.url))
  }

  // 2. Protect Routes
  const isProtected = path.startsWith('/admin') || path.startsWith('/attendee')
  const isAuthenticated = request.cookies.has('session') 

  if (isProtected && !isAuthenticated) {
    // Redirect unauthorized users to the home page where the login modal is located
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Vercel relies on this config block to know exactly which routes to run through the Edge network
export const config = {
  matcher: [
    '/admin/:path*', 
    '/attendee/:path*'
  ],
}