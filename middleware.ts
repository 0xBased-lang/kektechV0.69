/**
 * KEKTECH 3.0 - Supabase Auth Middleware
 *
 * This middleware automatically refreshes Supabase sessions on every request.
 * It ensures that authentication cookies are always up-to-date.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create a response object to modify
  const response = NextResponse.next({
    request,
  })

  // Validate environment variables before using them
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('[MIDDLEWARE] Missing Supabase environment variables')
    // Continue serving request without authentication rather than crashing
    return response
  }

  try {
    // Create Supabase client with cookie handling
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Refresh session if needed
    // This validates the JWT and refreshes it if it's about to expire
    await supabase.auth.getUser()

    return response
  } catch (error) {
    console.error('[MIDDLEWARE] Error refreshing session:', error)
    // Continue serving request even if auth refresh fails
    return response
  }
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes - they handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
