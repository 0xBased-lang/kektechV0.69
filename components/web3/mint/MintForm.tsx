'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMint } from '@/lib/hooks/useMint'
import { EXPLORER_URL } from '@/config/constants'
import { CooldownTracker } from '@/lib/validation'
import { NetworkSwitcher } from '@/components/web3/NetworkSwitcher'
import { NetworkCurrencyWarning } from '@/components/web3/NetworkCurrencyWarning'
import { NetworkConfigurationBlocker } from '@/components/web3/NetworkConfigurationBlocker'
import { useNetworkValidation } from '@/lib/hooks/useNetworkValidation'
import { useNetworkConfigValidator } from '@/lib/hooks/useNetworkConfigValidator'
import { useMintedNFTs } from '@/lib/hooks/useMintedNFTs'

/**
 * MintForm Component
 *
 * Enhanced NFT minting interface with:
 * - Amount selector with validation
 * - Price calculation
 * - Transaction handling
 * - Loading states
 * - Error handling
 * - Success feedback
 * - Rate limiting (client-side cooldown)
 * - Input sanitization
 */

// Client-side rate limiting: 60 seconds between mints
const MINT_COOLDOWN_MS = 60 * 1000;
const cooldownTracker = new CooldownTracker(MINT_COOLDOWN_MS);

export function MintForm() {
  const {
    mintAmount,
    setMintAmount,
    isConnected,
    isWritePending,
    isConfirming,
    isConfirmed,
    hash,
    error,
    mint,
    maxMintPerTx,
  } = useMint()

  const { isWrongNetwork } = useNetworkValidation()
  const { needsVerification, markAsValid } = useNetworkConfigValidator()
  const { mintedNFTs, isLoading: nftsLoading } = useMintedNFTs(hash, isConfirmed)

  const [localError, setLocalError] = useState<string | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [isValidating, setIsValidating] = useState(false)

  // Update cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = cooldownTracker.getRemainingTime()
      setCooldownRemaining(remaining)
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Validate amount input
  const validateAmount = useCallback((value: number): string | null => {
    if (isNaN(value)) {
      return 'Please enter a valid number'
    }
    if (value < 1) {
      return 'Amount must be at least 1'
    }
    if (value > maxMintPerTx) {
      return `Maximum ${maxMintPerTx} NFTs per transaction`
    }
    if (!Number.isInteger(value)) {
      return 'Amount must be a whole number'
    }
    return null
  }, [maxMintPerTx])

  // Handle mint button click with validation and rate limiting
  const handleMint = async () => {
    setLocalError(null)
    setIsValidating(true)

    try {
      // Check cooldown
      if (!cooldownTracker.canAct()) {
        const seconds = Math.ceil(cooldownTracker.getRemainingTime() / 1000)
        throw new Error(`Please wait ${seconds} seconds before minting again`)
      }

      // Validate amount
      const amountError = validateAmount(mintAmount)
      if (amountError) {
        throw new Error(amountError)
      }

      // Validate connection
      if (!isConnected) {
        throw new Error('Please connect your wallet first')
      }

      // Record action for rate limiting
      cooldownTracker.recordAction()

      // Execute mint
      await mint()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Mint failed')
      // Reset cooldown on error so user can retry
      cooldownTracker.reset()
    } finally {
      setIsValidating(false)
    }
  }

  // Handle amount change with validation
  const handleAmountChange = (value: number) => {
    setLocalError(null)

    const error = validateAmount(value)
    if (error) {
      setLocalError(error)
      return
    }

    setMintAmount(value)
  }

  // If not connected, show connect prompt
  if (!isConnected) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          Connect Your Wallet
        </h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Please connect your wallet to start minting KEKTECH NFTs
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Click the &quot;Connect Wallet&quot; button in the header
        </p>
      </div>
    )
  }

  // If connected but on wrong network, show network switcher
  if (isWrongNetwork) {
    return <NetworkSwitcher />
  }

  // BULLETPROOF: Block minting if network configuration needs verification
  if (needsVerification) {
    return <NetworkConfigurationBlocker onVerified={markAsValid} />
  }

  // If transaction confirmed, show success
  if (isConfirmed && hash) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-900/20">
        {/* NFT Images or Loading State */}
        {nftsLoading ? (
          <div className="mb-4">
            <div className="w-full max-w-xs mx-auto aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-kek-green flex items-center justify-center animate-pulse">
              <span className="text-gray-400 dark:text-gray-500 text-sm">Loading your NFT{mintAmount > 1 ? 's' : ''}...</span>
            </div>
          </div>
        ) : mintedNFTs.length > 0 ? (
          <div className="mb-4">
            {/* Display 1-3 NFT images in a grid */}
            <div className={`grid gap-4 mb-4 ${
              mintedNFTs.length === 1 ? 'grid-cols-1' :
              mintedNFTs.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {mintedNFTs.slice(0, 3).map((nft) => (
                <div key={nft.tokenId} className="relative group">
                  {nft.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={nft.imageUrl}
                      alt={nft.name}
                      className="w-full aspect-square object-cover rounded-lg border-2 border-kek-green shadow-lg transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-kek-green flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500">Loading...</span>
                    </div>
                  )}
                  {/* Token ID overlay */}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
                    <p className="text-xs font-medium text-white truncate">{nft.name}</p>
                  </div>
                </div>
              ))}
            </div>
            {mintAmount > 3 && (
              <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                + {mintAmount - 3} more NFT{mintAmount - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        ) : null}

        <h3 className="mb-2 text-lg font-semibold text-green-900 dark:text-green-100">
          Mint Successful!
        </h3>
        <p className="mb-4 text-green-700 dark:text-green-300">
          Successfully minted {mintAmount} KEKTECH NFT{mintAmount > 1 ? 's' : ''}!
        </p>
        <div className="space-y-2">
          <a
            href={`${EXPLORER_URL}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-kek-green px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-kek-green/80"
          >
            View Transaction ↗
          </a>
          {mintedNFTs.length > 0 && (
            <a
              href={`/nft?tokenId=${mintedNFTs[0].tokenId}`}
              className="ml-2 inline-block rounded-lg bg-kek-green/20 border-2 border-kek-green px-4 py-2 text-sm font-medium text-kek-green transition-colors hover:bg-kek-green/30"
            >
              View NFT
            </a>
          )}
          <button
            onClick={() => window.location.reload()}
            className="ml-2 inline-block rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600 shadow-lg shadow-purple-500/20"
          >
            Mint More
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Mint KEKTECH NFTs
      </h2>

      {/* Network Currency Warning */}
      <NetworkCurrencyWarning />

      {/* Amount Selector */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Amount (Max {maxMintPerTx} per transaction)
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleAmountChange(mintAmount - 1)}
            disabled={mintAmount <= 1 || isWritePending || isConfirming}
            className="rounded-lg bg-gray-200 px-4 py-2 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            −
          </button>
          <input
            type="number"
            min="1"
            max={maxMintPerTx}
            value={mintAmount}
            onChange={(e) => handleAmountChange(parseInt(e.target.value) || 1)}
            disabled={isWritePending || isConfirming}
            className="w-20 rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-lg font-semibold text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={() => handleAmountChange(mintAmount + 1)}
            disabled={mintAmount >= maxMintPerTx || isWritePending || isConfirming}
            className="rounded-lg bg-gray-200 px-4 py-2 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            +
          </button>
        </div>
      </div>

      {/* Price Display */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Price per NFT:</span>
          <span className="font-semibold">18,369 BASED</span>
        </div>
        <div className="mt-2 flex justify-between text-lg font-bold text-gray-900 dark:text-white">
          <span>Total Cost:</span>
          <span>{(18369 * mintAmount).toLocaleString()} BASED</span>
        </div>
      </div>

      {/* Error Display */}
      {(error || localError) && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">
            {localError || error?.message || 'An error occurred'}
          </p>
        </div>
      )}

      {/* Mint Button */}
      <button
        onClick={handleMint}
        disabled={
          isWritePending ||
          isConfirming ||
          isValidating ||
          cooldownRemaining > 0
        }
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isWritePending
          ? 'Waiting for approval...'
          : isConfirming
            ? 'Confirming transaction...'
            : isValidating
              ? 'Validating...'
              : cooldownRemaining > 0
                ? `Please wait ${Math.ceil(cooldownRemaining / 1000)}s...`
                : `Mint ${mintAmount} NFT${mintAmount > 1 ? 's' : ''}`}
      </button>

      {/* Cooldown Info */}
      {cooldownRemaining > 0 && (
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Rate limit: Please wait {Math.ceil(cooldownRemaining / 1000)} seconds before minting again
        </p>
      )}

      {/* Transaction Hash Display */}
      {hash && !isConfirmed && (
        <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">
            Transaction submitted!
          </p>
          <a
            href={`${EXPLORER_URL}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            View on Explorer ↗
          </a>
        </div>
      )}

      {/* Info */}
      <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
        Your NFT will be minted on the $BASED Chain (32323)
      </p>
    </div>
  )
}
