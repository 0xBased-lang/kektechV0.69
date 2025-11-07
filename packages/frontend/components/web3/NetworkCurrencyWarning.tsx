'use client'

import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { AlertTriangle, X, CheckCircle } from 'lucide-react'
import { basedChain } from '@/config/chains'

/**
 * NetworkCurrencyWarning Component
 *
 * Warns users if their MetaMask might have BasedAI network configured with
 * wrong currency symbol (ETH instead of BASED).
 *
 * This happens when users manually added the network or added it from another site
 * before visiting our DApp.
 */
export function NetworkCurrencyWarning() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const [dismissed, setDismissed] = useState(false)

  // Only show if connected to BasedAI chain
  const shouldShow = isConnected && chainId === basedChain.id && !dismissed

  if (!shouldShow) return null

  const handleFixNetwork = async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) return

      // Guide user to fix the network configuration
      const confirmed = window.confirm(
        `⚠️ IMPORTANT: Network Configuration Check\n\n` +
        `To ensure safe minting, please verify your MetaMask settings:\n\n` +
        `1. Click "OK" to open MetaMask\n` +
        `2. Check if your balance shows "ETH" or "BASED"\n` +
        `3. If it shows "ETH", you need to fix the network\n\n` +
        `Would you like instructions on how to fix it?`
      )

      if (!confirmed) return

      // Show detailed instructions
      alert(
        `🔧 How to Fix BasedAI Network in MetaMask:\n\n` +
        `STEP 1: Remove the Network\n` +
        `• Open MetaMask\n` +
        `• Click network dropdown (top left)\n` +
        `• Click "Add Network" or "Settings"\n` +
        `• Find "BasedAI" and click "Delete"\n\n` +
        `STEP 2: Close this popup and click our "Switch Network" button\n` +
        `• Or use "Add BasedAI Network to MetaMask" button\n` +
        `• This will add it with correct settings\n\n` +
        `STEP 3: Verify\n` +
        `• Check MetaMask shows "BASED" not "ETH"\n` +
        `• Try minting again - should show "18,369 BASED"`
      )

      setDismissed(true)
    } catch (error) {
      console.error('Error showing network fix guide:', error)
    }
  }

  return (
    <div className="w-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-[#3fb8bd]/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-[#3fb8bd] flex-shrink-0 mt-0.5" />

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#3fb8bd]">
              ⚠️ Network Configuration Check
            </h3>
            <button
              onClick={() => setDismissed(true)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss warning"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 text-sm text-gray-300">
            <p>
              <strong className="text-white">Before minting, please verify:</strong>
            </p>

            <div className="bg-black/20 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  Open <strong className="text-[#3fb8bd]">MetaMask</strong>
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  Check if your balance shows <strong className="text-green-400">&quot;BASED&quot;</strong> or <strong className="text-red-400">&quot;ETH&quot;</strong>
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  When minting, MetaMask should show <strong className="text-green-400">&quot;18,369 BASED&quot;</strong>
                </span>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-300 font-semibold">
                ⚠️ If MetaMask shows &quot;ETH&quot; instead of &quot;BASED&quot;:
              </p>
              <p className="text-red-200 text-xs mt-1">
                Your network is misconfigured and needs to be fixed to mint safely.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <button
              onClick={handleFixNetwork}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#3fb8bd] hover:bg-[#3fb8bd]/80 text-white font-semibold rounded-lg transition-all text-sm"
            >
              📋 Show Fix Instructions
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium rounded-lg transition-all text-sm"
            >
              I&apos;ve Verified - Dismiss
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            <strong>Why this happens:</strong> MetaMask caches network settings.
            If BasedAI was added with wrong settings before, it needs to be re-added correctly.
          </p>
        </div>
      </div>
    </div>
  )
}
