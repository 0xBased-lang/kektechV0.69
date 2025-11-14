'use client'

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { AlertTriangle, Network } from 'lucide-react'
import { basedChain } from '@/config/chains'
import { useEffect, useState } from 'react'

/**
 * Network Switcher Component
 *
 * Detects when user is on wrong network and provides one-click switching.
 * Handles both network switching and adding BasedAI network to MetaMask.
 */

interface NetworkSwitcherProps {
  /** Inline mode (smaller, for navbar) */
  inline?: boolean
  /** Show even when disconnected */
  showWhenDisconnected?: boolean
}

export function NetworkSwitcher({
  inline = false,
  showWhenDisconnected = false
}: NetworkSwitcherProps) {
  const { isConnected } = useAccount()
  const currentChainId = useChainId()
  const { chains, switchChain, isPending, error } = useSwitchChain()
  const [showError, setShowError] = useState(false)

  const isWrongNetwork = isConnected && currentChainId !== basedChain.id

  // Debug logging
  console.log('🌐 NetworkSwitcher Debug:', {
    isConnected,
    currentChainId,
    basedChainId: basedChain.id,
    isWrongNetwork,
    inline,
    showWhenDisconnected
  })

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      setShowError(true)
      const timer = setTimeout(() => setShowError(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Don't show if not connected (unless explicitly requested)
  if (!isConnected && !showWhenDisconnected) {
    return null
  }

  // Don't show if on correct network
  if (!isWrongNetwork) {
    return null
  }

  const handleSwitchNetwork = async () => {
    try {
      // Try to switch to BasedAI chain
      await switchChain({ chainId: basedChain.id })
    } catch (err) {
      const error = err as { code?: number; message?: string }
      console.error('Failed to switch network:', error)

      // If network doesn't exist in wallet, try to add it
      if (error?.code === 4902 || error?.message?.includes('Unrecognized chain')) {
        try {
          await addBasedAINetwork()
        } catch (addError) {
          console.error('Failed to add network:', addError)
        }
      }
    }
  }

  // Add BasedAI network to MetaMask
  const addBasedAINetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask to add BasedAI network')
      return
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${basedChain.id.toString(16)}`, // Convert to hex
            chainName: basedChain.name,
            nativeCurrency: basedChain.nativeCurrency,
            rpcUrls: [basedChain.rpcUrls.default.http[0]],
            blockExplorerUrls: [basedChain.blockExplorers.default.url],
          },
        ],
      })
    } catch (error) {
      const err = error as { message?: string }
      throw new Error(`Failed to add network: ${err.message || 'Unknown error'}`)
    }
  }

  const currentChainName = chains.find(c => c.id === currentChainId)?.name || 'Unknown Network'

  // Inline mode (for navbar)
  if (inline) {
    return (
      <button
        onClick={handleSwitchNetwork}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-kek-green/10 to-kek-green/5 border border-kek-green/40 rounded-lg hover:from-kek-green/20 hover:to-kek-green/10 hover:border-kek-green/60 hover:shadow-lg hover:shadow-kek-green/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-fredoka"
        title={`Switch from ${currentChainName} to BasedAI Network`}
      >
        <Network className="w-4 h-4 text-kek-green" />
        <span className="text-sm font-medium text-kek-green">
          {isPending ? 'Switching...' : 'Switch Network'}
        </span>
      </button>
    )
  }

  // Full banner mode (for main content)
  return (
    <div className="w-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/50 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-8 h-8 text-yellow-500 animate-pulse" />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-xl font-bold text-yellow-500 mb-2">
              Wrong Network Detected
            </h3>
            <p className="text-gray-300">
              You&apos;re currently connected to <span className="font-semibold text-white">{currentChainName}</span>.
              <br />
              Please switch to <span className="font-semibold text-cyan-400">BasedAI Network</span> to mint NFTs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSwitchNetwork}
              disabled={isPending}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50"
            >
              <Network className="w-5 h-5" />
              {isPending ? 'Switching Network...' : 'Switch to BasedAI'}
            </button>

            <button
              onClick={addBasedAINetwork}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium rounded-lg transition-all"
            >
              Add BasedAI Network to MetaMask
            </button>
          </div>

          {showError && error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">
                <span className="font-semibold">Error:</span> {error.message}
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-gray-400">
              <span className="font-semibold">Network Details:</span>
            </p>
            <ul className="mt-1 text-xs text-gray-500 space-y-1">
              <li>• Chain ID: {basedChain.id} (0x{basedChain.id.toString(16)})</li>
              <li>• RPC: {basedChain.rpcUrls.default.http[0]}</li>
              <li>• Symbol: {basedChain.nativeCurrency.symbol}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
