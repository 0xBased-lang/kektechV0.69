'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState, useEffect } from 'react'
import { type State, WagmiProvider } from 'wagmi'
import { config, checkWagmiConfig } from '@/config/wagmi'
import { initializeEthereumProvider, waitForProvider } from '@/config/web3-provider-fix'

/**
 * Enhanced Providers Component
 *
 * Fixes all Web3 initialization issues:
 * - Safely initializes ethereum provider
 * - Prevents conflicts between wallet extensions
 * - Handles errors gracefully
 * - Provides debug logging
 */

interface ProvidersProps {
  children: ReactNode
  initialState?: State
}

export function Providers({ children, initialState }: ProvidersProps) {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize ethereum provider safely
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize provider without conflicts
        initializeEthereumProvider()

        // Wait for provider to be available
        const hasProvider = await waitForProvider(5000)

        if (!hasProvider) {
          console.warn('No ethereum provider detected after 5 seconds')
        }

        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
          checkWagmiConfig()
        }

        setIsReady(true)
      } catch (err) {
        console.error('Failed to initialize Web3 providers:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        // Still set ready to allow app to function without Web3
        setIsReady(true)
      }
    }

    // Only run on client side
    if (typeof window !== 'undefined') {
      initialize()
    } else {
      setIsReady(true) // SSR is ready immediately
    }
  }, [])

  // Create query client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  )

  // Show loading state while initializing
  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3fb8bd] mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing Web3...</p>
        </div>
      </div>
    )
  }

  // Show error state if critical error occurred
  if (error && process.env.NODE_ENV === 'development') {
    console.error('Web3 Initialization Error:', error)
  }

  return (
    <WagmiProvider config={config} initialState={initialState} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        {error && process.env.NODE_ENV === 'development' && (
          <div className="fixed top-0 left-0 right-0 bg-red-900/20 border-b border-red-500 p-2 text-center text-xs text-red-300">
            Web3 initialization warning: {error}
          </div>
        )}
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}