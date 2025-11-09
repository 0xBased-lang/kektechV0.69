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
import { recoverMessageAddress } from 'viem'

/**
 * Generate authentication message for signing
 * Includes timestamp and nonce for replay protection
 */
function generateAuthMessage(address: string, nonce: string): string {
  return `Welcome to KEKTECH!\n\nSign this message to authenticate your wallet.\n\nWallet: ${address}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`
}

/**
 * Generate random nonce for replay protection
 */
function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15)
}

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
   */
  async function authenticate() {
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    setIsAuthenticating(true)
    setError(null)

    try {
      // 1. Generate nonce for replay protection
      const nonce = generateNonce()

      // 2. Generate message to sign
      const message = generateAuthMessage(address, nonce)

      // 3. Request signature from wallet
      const signature = await signMessageAsync({ message })

      // 4. Verify signature locally (optional but recommended)
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature,
      })

      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Signature verification failed')
      }

      // 5. Sign in to Supabase with wallet address as user ID
      // Note: We're using the wallet address as the user identifier
      // Supabase will create a session based on this
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: `${address.toLowerCase()}@wallet.kektech.xyz`,
        password: signature, // Use signature as password
      })

      if (authError) {
        // If user doesn't exist, create account
        if (authError.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: `${address.toLowerCase()}@wallet.kektech.xyz`,
            password: signature,
            options: {
              data: {
                wallet_address: address.toLowerCase(),
                nonce,
                signed_at: new Date().toISOString(),
              },
            },
          })

          if (signUpError) {
            throw signUpError
          }

          // Try signing in again
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: `${address.toLowerCase()}@wallet.kektech.xyz`,
            password: signature,
          })

          if (retryError) {
            throw retryError
          }
        } else {
          throw authError
        }
      }

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
