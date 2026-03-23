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

  // 2. Protect Routes (ONLY lock down the Admin section!)
  const isAdminRoute = path.startsWith('/admin')
  
  // CHANGED: Now exactly matches the cookie name from your actions.ts file!
  const isAuthenticated = request.cookies.has('admin_session') 

  if (isAdminRoute && !isAuthenticated) {
    // Redirect unauthorized users to the home page where the login modal is located
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/attendee/:path*'
  ],
}