import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Get the session
  const { data: { session } } = await supabase.auth.getSession()

  // Define public routes that don't require authentication
  const publicRoutes = ['/welcome', '/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/update-password']

  // Define protected routes
  const protectedRoutes = [
    '/',
    '/api/chat',
    '/api/upload',
    '/api/analyze',
    '/api/cv',
    '/api/ai',
    '/api/applications',
    '/api/analytics',
    '/api/export',
    '/api/career',
    '/api/campaigns'
  ]

  const { pathname } = req.nextUrl

  // Allow access to public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return res
  }

  // If user is not authenticated and trying to access protected route
  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    const redirectUrl = new URL('/welcome', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth routes, redirect to home
  if (session && ['/auth/login', '/auth/signup', '/auth/forgot-password'].some(route => pathname.startsWith(route))) {
    const redirectUrl = new URL('/', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
