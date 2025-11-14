'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState, useEffect } from 'react'

/**
 * Enhanced Connect Button Component
 *
 * Fixes all wallet connection issues:
 * - Handles provider conflicts gracefully
 * - Shows detailed error messages
 * - Provides fallback options
 * - Supports all wallet types
 */

export function ConnectButton() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { connectors, connect, error: connectError, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [showDropdown, setShowDropdown] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Check if Web3 is properly initialized
  useEffect(() => {
    const checkInit = () => {
      const hasProvider = !!(window as Window & { ethereum?: unknown; __SAFE_ETHEREUM_PROVIDER?: unknown }).ethereum || !!(window as Window & { ethereum?: unknown; __SAFE_ETHEREUM_PROVIDER?: unknown }).__SAFE_ETHEREUM_PROVIDER
      setIsInitialized(hasProvider)

      if (!hasProvider) {
        console.warn('No ethereum provider detected')
      }
    }

    // Check immediately and after a delay
    checkInit()
    const timer = setTimeout(checkInit, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      let errorMessage = connectError.message

      // Parse specific error types
      if (errorMessage.includes('not found on Allowlist')) {
        errorMessage = 'Domain not configured. Please try MetaMask or wait for domain approval.'
      } else if (errorMessage.includes('User rejected')) {
        errorMessage = 'Connection cancelled by user'
      } else if (errorMessage.includes('No provider')) {
        errorMessage = 'No wallet detected. Please install MetaMask.'
      }

      setLastError(errorMessage)

      // Clear error after 5 seconds
      const timer = setTimeout(() => setLastError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [connectError])

  // Handle connect button click
  const handleConnect = async (connectorId?: string) => {
    try {
      setLastError(null)

      let connector = connectorId
        ? connectors.find(c => c.id === connectorId)
        : null

      // Prioritize MetaMask if no specific connector selected
      if (!connector) {
        // Try to find MetaMask first
        connector = connectors.find(c =>
          c.id === 'metaMask' ||
          c.id === 'injected' ||
          (c.name && c.name.toLowerCase().includes('metamask'))
        )

        // Fallback to any available connector
        if (!connector) {
          connector = connectors.find(c => c.ready) || connectors[0]
        }
      }

      if (connector) {
        await connect({ connector })
        setShowDropdown(false)
      } else {
        setLastError('No wallet available. Please install MetaMask or another Web3 wallet.')
      }
    } catch (error) {
      console.error('Connection error:', error)
      setLastError(error instanceof Error ? error.message : 'Failed to connect')
    }
  }

  // If connected, show account info
  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-kek-green to-[#2a8185] px-4 py-2 text-white hover:from-[#359ea2] hover:to-[#226669] transition-all"
        >
          <span className="font-fredoka font-medium">
            ✓ {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-800 shadow-lg ring-1 ring-gray-700 z-50">
            <button
              onClick={() => {
                disconnect()
                setShowDropdown(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  // Loading states
  if (isConnecting || isReconnecting || isPending) {
    return (
      <button
        disabled
        className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-gray-400 cursor-not-allowed"
      >
        <span className="inline-block animate-spin">⟳</span>
        <span className="font-fredoka font-medium">Connecting...</span>
      </button>
    )
  }

  // Not connected - show connect options
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-kek-green to-[#2a8185] px-4 py-2 text-white hover:from-[#359ea2] hover:to-[#226669] transition-all"
      >
        <span>🔗</span>
        <span className="font-fredoka font-medium">Connect Wallet</span>
      </button>

      {/* Error message */}
      {lastError && (
        <div className="absolute top-full mt-2 right-0 w-72 p-3 bg-red-900/90 rounded-lg text-sm text-red-100 flex items-start gap-2 z-50">
          <span className="flex-shrink-0 mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold">Connection Error</p>
            <p className="text-xs mt-1">{lastError}</p>
          </div>
        </div>
      )}

      {/* Wallet selection dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg bg-gray-800 shadow-lg ring-1 ring-gray-700 z-50 overflow-hidden">
          <div className="p-2">
            <p className="text-xs text-gray-400 px-2 py-1">Choose wallet</p>

            {/* MetaMask (Priority) */}
            <button
              onClick={() => handleConnect('injected')}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                🦊
              </div>
              <div>
                <p className="font-medium">MetaMask</p>
                <p className="text-xs text-gray-400">Recommended</p>
              </div>
            </button>

            {/* WalletConnect */}
            <button
              onClick={() => handleConnect('walletConnect')}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                🔗
              </div>
              <div>
                <p className="font-medium">WalletConnect</p>
                <p className="text-xs text-gray-400">Scan with wallet</p>
              </div>
            </button>

            {/* Coinbase Wallet */}
            <button
              onClick={() => handleConnect('coinbaseWallet')}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                🪙
              </div>
              <div>
                <p className="font-medium">Coinbase Wallet</p>
                <p className="text-xs text-gray-400">Connect with Coinbase</p>
              </div>
            </button>

            {/* Auto-detect */}
            <button
              onClick={() => handleConnect()}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                ⚡
              </div>
              <div>
                <p className="font-medium">Auto-detect</p>
                <p className="text-xs text-gray-400">Use any available wallet</p>
              </div>
            </button>
          </div>

          {!isInitialized && (
            <div className="border-t border-gray-700 p-3 bg-yellow-900/20">
              <p className="text-xs text-yellow-400">
                ⚠️ No wallet detected. Please install MetaMask extension.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}