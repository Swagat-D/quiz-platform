import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// This middleware runs on all requests (except those in the matcher config)
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || 
                       path === '/login' || 
                       path === '/signup' || 
                       path === '/forgot-password' || 
                       path === '/about' || 
                       path === '/contact' ||
                       path.startsWith('/api/auth')
  
  // Get the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })
  
  // If it's a public path and user is logged in, redirect to dashboard
  // Only redirect login/signup/forgot-password, not other public pages
  if (token && (path === '/login' || path === '/signup' || path === '/forgot-password')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // If it's not a public path and user is not logged in, redirect to login
  if (!isPublicPath && !token) {
    // Store the original path to redirect after login
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

// Configure paths that should be checked by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}