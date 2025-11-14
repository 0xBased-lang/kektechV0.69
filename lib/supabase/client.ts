/**
 * Supabase Browser Client
 *
 * Used for client-side operations (React components, hooks, etc.)
 * Automatically handles session management via cookies
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Create a Supabase client for browser-side usage
 *
 * Features:
 * - Automatic session refresh
 * - Cookie-based session storage
 * - Type-safe database operations
 *
 * @returns Typed Supabase client instance
 */
export function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
    )
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}
