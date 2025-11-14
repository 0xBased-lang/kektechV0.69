/**
 * Supabase Server Client
 *
 * Used for server-side operations (API routes, Server Components, Server Actions)
 * Handles cookie-based authentication in Next.js App Router
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Create a Supabase client for server-side usage
 *
 * Features:
 * - Cookie-based session management
 * - Secure server-side authentication
 * - Type-safe database operations
 * - Automatic token refresh
 *
 * Usage in API routes:
 * ```ts
 * import { createClient } from '@/lib/supabase/server'
 *
 * export async function GET(request: Request) {
 *   const supabase = await createClient()
 *   const { data: { user }, error } = await supabase.auth.getUser()
 *   // ...
 * }
 * ```
 *
 * @returns Typed Supabase client instance
 */
export async function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
    )
  }

  // ✅ FIXED: Await cookies() for Next.js 15 compatibility
  const cookieStore = await cookies()

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
