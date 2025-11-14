/**
 * Wallet Authentication Hook
 *
 * Integrates Wagmi wallet connection with Supabase authentication
 * Uses wallet signature verification for secure, passwordless auth
 *
 * Flow:
 * 1. User connects wallet (Wagmi)
 * 2. Clicks "Sign In" to authenticate
 * 3. Signs message with wallet
 * 4. Creates Supabase session with verified wallet address
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { authenticate, isAuthenticated, signOut, isAuthenticating } = useWalletAuth()
 *
 *   return (
 *     <button onClick={authenticate} disabled={isAuthenticating}>
 *       {isAuthenticated ? 'Sign Out' : 'Sign In'}
 *     </button>
 *   )
 * }
 * ```
 */

'use client'

import { useState, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { createClient } from '@/lib/supabase/client'
import { SiweMessage } from 'siwe'

export function useWalletAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  /**
   * Check if user is already authenticated on mount
   */
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)
      } catch (err) {
        console.error('Error checking auth status:', err)
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [supabase.auth])

  /**
   * Listen to auth state changes
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)

      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  /**
   * Authenticate user with wallet signature
   * Uses SIWE (Sign-In with Ethereum) EIP-4361 standard
   *
   * Flow:
   * 1. Generate SIWE message with nonce
   * 2. Request signature from wallet via wagmi
   * 3. Verify signature on backend
   * 4. Create Supabase session with JWT token
   */
  async function authenticate() {
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    setIsAuthenticating(true)
    setError(null)

    try {
      // 1. Create SIWE message (EIP-4361 standard)
      // Note: issuedAt is automatically added by SIWE library when preparing message
      const message = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: 'Sign in to KEKTECH 3.0',
        uri: window.location.origin,
        version: '1',
        chainId: 32323, // BasedAI mainnet
        nonce: crypto.randomUUID().replace(/-/g, ''), // EIP-4361: alphanumeric only (no hyphens)
      })

      const messageString = message.prepareMessage()

      // 2. Sign message with wagmi (works with ALL wallet connectors)
      const signature = await signMessageAsync({
        message: messageString,
      })

      // 3. Verify signature on backend and get JWT token
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageString,
          signature,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Verification failed')
      }

      // Backend verification succeeded, session is now stored in cookies!
      const { success: _success, userId: _userId, walletAddress: _verifiedAddress } = await response.json()

      // 🔧 FIX: Wait for session to be available from cookies (with retry)
      // Prevents race conditions where cookies haven't fully propagated yet
      let session = null
      let retries = 0
      const maxRetries = 10 // 2 seconds max wait

      while (retries < maxRetries && !session) {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()

        if (currentSession) {
          session = currentSession
          console.log('[Auth] Session successfully retrieved from cookies after', retries, 'retries')
          break
        }

        if (sessionError) {
          console.warn('[Auth] Session check error (retry', retries + 1, '):', sessionError)
        }

        // Wait 200ms before retry
        await new Promise(resolve => setTimeout(resolve, 200))
        retries++
      }

      if (!session) {
        console.error('[Auth] Session not available after', retries, 'retries')
        throw new Error('Session not available after authentication. Please try again.')
      }

      // Success! User is authenticated (session from cookies confirmed)
      setIsAuthenticated(true)
    } catch (err) {
      console.error('Authentication error:', err)
      setError(err instanceof Error ? err.message : 'Authentication failed')
      setIsAuthenticated(false)
    } finally {
      setIsAuthenticating(false)
    }
  }

  /**
   * Sign out user
   */
  async function signOut() {
    try {
      await supabase.auth.signOut()
      setIsAuthenticated(false)
      setError(null)
    } catch (err) {
      console.error('Sign out error:', err)
      setError(err instanceof Error ? err.message : 'Sign out failed')
    }
  }

  /**
   * Get current user session
   */
  async function getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  /**
   * Get current user
   */
  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  return {
    // State
    isAuthenticated,
    isAuthenticating,
    isWalletConnected: isConnected,
    walletAddress: address,
    error,

    // Actions
    authenticate,
    signOut,
    getSession,
    getUser,
  }
}
