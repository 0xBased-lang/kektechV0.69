'use client'

import { useState, useEffect } from 'react'
import { useConnect } from 'wagmi'
import { useMint } from '@/lib/hooks/useMint'
import { useMintedNFTs } from '@/lib/hooks/useMintedNFTs'
import { EXPLORER_URL } from '@/config/constants'
import { getTotalSupply, CONTRACTS } from '@/lib/blockchain/kektv'
import Image from 'next/image'

/**
 * EnhancedMintForm Component with Advanced Animations
 *
 * Features:
 * - Animated progress bars
 * - Confetti on success
 * - Glowing effects
 * - Step-by-step progress
 * - Smooth transitions
 */
export function EnhancedMintForm() {
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

  // Wallet connection
  const { connectors, connect } = useConnect()

  // Fetch minted NFTs after successful mint
  const { mintedNFTs, isLoading: isLoadingNFTs, error: nftError } = useMintedNFTs(hash, isConfirmed)

  const [localError, setLocalError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [totalMinted, setTotalMinted] = useState<number>(0)

  // Animate progress bar
  useEffect(() => {
    if (isWritePending) setProgress(33)
    else if (isConfirming) setProgress(66)
    else if (isConfirmed) setProgress(100)
    else setProgress(0)
  }, [isWritePending, isConfirming, isConfirmed])

  // Show confetti on success
  useEffect(() => {
    if (isConfirmed) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
    }
  }, [isConfirmed])

  // Fetch total minted from blockchain
  useEffect(() => {
    const fetchTotalMinted = async () => {
      try {
        const total = await getTotalSupply(CONTRACTS.KEKTECH)
        setTotalMinted(total)
      } catch (error) {
        console.error('Error fetching total supply:', error)
      }
    }

    fetchTotalMinted()
    // Refresh every 30 seconds
    const interval = setInterval(fetchTotalMinted, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMint = async () => {
    setLocalError(null)
    try {
      await mint()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Mint failed')
    }
  }

  const handleAmountChange = (value: number) => {
    if (value >= 1 && value <= maxMintPerTx) {
      setMintAmount(value)
      setLocalError(null)
    }
  }

  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      // Prioritize MetaMask/injected wallet
      const connector = connectors.find(c =>
        c.id === 'injected' ||
        c.id === 'metaMask' ||
        (c.name && c.name.toLowerCase().includes('metamask'))
      ) || connectors[0]

      if (connector) {
        await connect({ connector })
      }
    } catch (error) {
      console.error('Connection error:', error)
    }
  }

  // Don't block UI when wallet is not connected - show preview instead

  // Success state with confetti
  if (isConfirmed && hash) {
    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-kek-green bg-gradient-to-br from-gray-900 to-gray-800 p-10 text-center shadow-2xl shadow-kek-green/50">
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute h-3 w-3 animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10%`,
                  backgroundColor: ['#00ff00', '#00ffff', '#ff00ff'][Math.floor(Math.random() * 3)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                  animation: `float ${2 + Math.random()}s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="relative">
          <h3 className="mb-3 bg-gradient-to-r from-kek-green via-kek-cyan to-kek-purple bg-clip-text text-3xl font-black text-transparent">
            Mint Successful!
          </h3>
          <p className="mb-6 text-xl text-gray-300">
            Successfully minted <span className="font-bold text-kek-green">{mintAmount}</span> KEKTECH NFT{mintAmount > 1 ? 's' : ''}!
          </p>

          {/* Minted NFTs Display */}
          {isLoadingNFTs ? (
            <div className="mb-6">
              <div className="mb-3 text-sm text-gray-400">Loading your NFTs...</div>
              <div className={`grid gap-4 ${mintAmount === 1 ? 'grid-cols-1 max-w-xs mx-auto' : mintAmount === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
                {[...Array(Math.min(mintAmount, 3))].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square rounded-xl bg-gray-700/50 border-2 border-kek-cyan/30" />
                    <div className="mt-2 h-4 rounded bg-gray-700/50" />
                  </div>
                ))}
              </div>
            </div>
          ) : mintedNFTs.length > 0 ? (
            <div className="mb-6">
              <div className="mb-4 text-sm font-semibold text-kek-cyan">Your Minted NFTs:</div>
              <div className={`grid gap-4 ${mintedNFTs.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : mintedNFTs.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
                {mintedNFTs.map((nft) => (
                  <div key={nft.tokenId} className="group relative">
                    <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-kek-cyan/50 shadow-lg shadow-kek-cyan/20 transition-all hover:border-kek-green hover:shadow-kek-green/40 hover:scale-105">
                      {nft.imageUrl ? (
                        <Image
                          src={nft.imageUrl}
                          alt={nft.name}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-kek-green/20 to-kek-purple/20 flex items-center justify-center">
                          <span className="text-4xl">🎨</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">{nft.name}</div>
                    {nft.rank && (
                      <div className="text-xs text-kek-cyan">Rank #{nft.rank}</div>
                    )}
                    {nft.rarityScore && (
                      <div className="text-xs text-gray-400">Rarity: {nft.rarityScore.toFixed(2)}</div>
                    )}
                  </div>
                ))}
              </div>
              {mintAmount > 3 && (
                <div className="mt-3 text-xs text-gray-400">
                  + {mintAmount - 3} more NFT{mintAmount - 3 > 1 ? 's' : ''} minted
                </div>
              )}
            </div>
          ) : nftError ? (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="text-sm text-red-400">
                ⚠️ {nftError}
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Your NFTs were minted successfully. Check your wallet or the marketplace.
              </div>
            </div>
          ) : null}

          <div className="mb-6 rounded-xl border border-kek-green/20 bg-black/40 p-4 backdrop-blur-sm">
            <div className="text-sm text-gray-400">Transaction Hash</div>
            <div className="mt-1 truncate font-mono text-xs text-kek-cyan">{hash}</div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={`${EXPLORER_URL}/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-gradient-to-r from-kek-green to-kek-cyan px-6 py-3 font-semibold text-black shadow-lg shadow-kek-green/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-kek-green/70"
            >
              View Transaction ↗
            </a>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-purple-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-600 hover:scale-105"
            >
              Mint More
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-kek-green/30 bg-gradient-to-br from-gray-900 to-gray-800 p-8 shadow-2xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

      <div className="relative">
        {/* Progress Steps */}
        {(isWritePending || isConfirming || isConfirmed) && (
          <div className="mb-8">
            <div className="mb-3 flex justify-between text-sm">
              <span className={progress >= 33 ? 'text-kek-green' : 'text-gray-500'}>
                1. Approve
              </span>
              <span className={progress >= 66 ? 'text-kek-cyan' : 'text-gray-500'}>
                2. Confirming
              </span>
              <span className={progress >= 100 ? 'text-kek-purple' : 'text-gray-500'}>
                3. Complete
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 overflow-hidden rounded-full bg-gray-700">
              <div
                className="h-full bg-gradient-to-r from-kek-green via-kek-cyan to-kek-purple transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="h-full w-full animate-pulse bg-white/20" />
              </div>
            </div>
          </div>
        )}

        {/* Main Mint Layout - Image left, Amount selector right */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: NFT Preview Image */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-xs aspect-square rounded-xl overflow-hidden border-2 border-kek-green/50 shadow-lg shadow-kek-green/20">
              <Image
                src="/images/686.png"
                alt="𝕂Ǝ𝕂丅ᵉ匚🅷 NFT"
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right: Amount Selector */}
          <div className="flex flex-col items-center justify-center">
            <label className="mb-4 block text-sm font-semibold text-gray-300 text-center">
              Amount (Max {maxMintPerTx})
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleAmountChange(mintAmount - 1)}
                disabled={mintAmount <= 1 || isWritePending || isConfirming}
                className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-kek-green/30 bg-kek-green/10 text-3xl font-bold text-kek-green transition-all hover:border-kek-green hover:bg-kek-green/20 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-30"
              >
                −
              </button>
              <div className="flex h-20 w-28 items-center justify-center rounded-lg border-2 border-kek-cyan/50 bg-black/40">
                <span className="text-5xl font-black text-kek-cyan">{mintAmount}</span>
              </div>
              <button
                onClick={() => handleAmountChange(mintAmount + 1)}
                disabled={mintAmount >= maxMintPerTx || isWritePending || isConfirming}
                className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-kek-green/30 bg-kek-green/10 text-3xl font-bold text-kek-green transition-all hover:border-kek-green hover:bg-kek-green/20 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Price Display */}
        <div className="mb-6 rounded-xl border border-kek-purple/30 bg-black/40 p-5 backdrop-blur-sm">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Price per NFT:</span>
            <span className="font-semibold text-white">18,369 $BASED</span>
          </div>
          <div className="mt-3 flex justify-between">
            <span className="text-lg font-bold text-white">Total Cost:</span>
            <span className="text-2xl font-black text-kek-green">
              {(18369 * mintAmount).toLocaleString()} $BASED
            </span>
          </div>
        </div>

        {/* Error Display */}
        {(error || localError) && (
          <div className="mb-6 animate-pulse rounded-xl border-2 border-red-500/50 bg-red-500/10 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-red-400">
              ⚠️ {localError || error?.message || 'An error occurred'}
            </p>
          </div>
        )}

        {/* Mint Button - Show "Connect to Mint" overlay when not connected */}
        {!isConnected ? (
          <div className="relative">
            <button
              disabled
              className="w-full overflow-hidden rounded-xl bg-gradient-to-r from-kek-green to-kek-cyan p-[2px] shadow-lg opacity-50"
            >
              <div className="rounded-[10px] bg-gray-900 px-8 py-4">
                <span className="text-lg font-black text-white">
                  🚀 Mint {mintAmount} NFT{mintAmount > 1 ? 's' : ''}
                </span>
              </div>
            </button>
            <button
              onClick={handleConnectWallet}
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/95 to-pink-900/95 rounded-xl backdrop-blur-sm hover:from-purple-800/95 hover:to-pink-800/95 transition-all cursor-pointer"
            >
              <div className="text-white font-bold text-xl">Connect Wallet to Mint</div>
            </button>
          </div>
        ) : (
          <button
            onClick={handleMint}
            disabled={isWritePending || isConfirming}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-kek-green to-kek-cyan p-[2px] shadow-lg shadow-kek-green/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-kek-green/70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <div className="relative rounded-[10px] bg-gray-900 px-8 py-4 transition-all group-hover:bg-transparent">
              <span className="text-lg font-black text-white group-hover:text-black">
                {isWritePending
                  ? '⏳ Waiting for approval...'
                  : isConfirming
                    ? '⚡ Confirming transaction...'
                    : `🚀 Mint ${mintAmount} NFT${mintAmount > 1 ? 's' : ''}`}
              </span>
            </div>
          </button>
        )}

        {/* Transaction Hash */}
        {hash && !isConfirmed && (
          <div className="mt-4 rounded-xl border border-kek-cyan/30 bg-kek-cyan/10 p-4 backdrop-blur-sm">
            <p className="mb-2 text-sm font-semibold text-kek-cyan">
              ✅ Transaction submitted!
            </p>
            <a
              href={`${EXPLORER_URL}/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-kek-cyan/80 hover:text-kek-cyan hover:underline"
            >
              View on Explorer ↗
            </a>
          </div>
        )}

        {/* Info */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Your NFT will be minted on the <span className="font-semibold text-kek-green">$BASED Chain (32323)</span>
        </p>
      </div>

      {/* Dynamic Total Supply - Below main widget */}
      <div className="mt-4 text-center">
        <div className="inline-block px-6 py-3 rounded-xl border border-kek-cyan/30 bg-kek-cyan/10">
          <div className="text-sm text-gray-400 mb-1">Total Supply</div>
          <div className="text-2xl font-bold text-kek-cyan">
            {totalMinted.toLocaleString()} / 4,200
          </div>
        </div>
      </div>
    </div>
  )
}
