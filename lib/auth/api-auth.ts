/**
 * API Authentication Helper
 *
 * Provides reusable authentication functions for API routes
 * Uses Supabase for session management and wallet address extraction
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Verify user authentication and extract wallet address
 *
 * Returns authenticated wallet address or error response
 *
 * @example
 * ```ts
 * export async function POST(request: Request) {
 *   const auth = await verifyAuth()
 *   if (auth.error) return auth.error
 *
 *   const walletAddress = auth.walletAddress
 *   // ... use verified wallet address
 * }
 * ```
 */
export async function verifyAuth(): Promise<{
  walletAddress?: string
  error?: NextResponse
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        error: NextResponse.json(
          { success: false, error: 'Unauthorized - Please sign in with your wallet' },
          { status: 401 }
        )
      }
    }

    // Extract wallet address from user metadata
    const walletAddress = user.user_metadata?.wallet_address || user.email?.split('@')[0]

    if (!walletAddress) {
      return {
        error: NextResponse.json(
          { success: false, error: 'Wallet address not found in session' },
          { status: 400 }
        )
      }
    }

    return { walletAddress }
  } catch (error) {
    console.error('Auth verification error:', error)
    return {
      error: NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}
