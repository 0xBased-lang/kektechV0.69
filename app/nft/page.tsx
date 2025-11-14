'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useStaticNFT, type TraitStats } from '@/lib/hooks/useStaticMetadata'

/**
 * Normalize string for fuzzy matching
 * - Removes spaces, underscores, dashes
 * - Converts to lowercase
 * - Handles special characters
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\s_-]+/g, '') // Remove spaces, underscores, dashes
    .replace(/[^a-z0-9]/g, '') // Remove special chars except alphanumeric
}

/**
 * Get rarity percentage for a trait with precise matching
 *
 * Handles:
 * - Case insensitivity (BasedAI vs basedai)
 * - Spaces vs underscores (Easter Eggs vs easter_eggs)
 * - Exact matches with normalization
 *
 * IMPORTANT: Does NOT do fuzzy/partial matching to avoid confusion
 * between similar traits like "BasedAI" (Body) vs "based" (Eyes)
 *
 * @param traitStats - Live trait statistics from metadata
 * @param traitType - Trait category (e.g., "Background", "Body")
 * @param value - Trait value (e.g., "BasedAI", "none")
 * @returns Formatted percentage string or empty string if not found
 */
function getTraitPercentage(
  traitStats: TraitStats | null,
  traitType: string,
  value: string
): string {
  if (!traitStats) return ''

  // Normalize inputs for flexible matching
  const normalizedType = normalizeString(traitType)
  const normalizedValue = normalizeString(value)

  // Find matching category (case-insensitive, space-insensitive)
  const categoryKey = Object.keys(traitStats).find(
    key => normalizeString(key) === normalizedType
  )

  if (!categoryKey) return ''

  const category = traitStats[categoryKey]

  // Strategy 1: Try exact match first (fastest, most accurate)
  if (category[value]) {
    return `${category[value].percentage}%`
  }

  // Strategy 2: Try normalized EXACT match (handles case/space differences)
  // This ensures "BasedAI" only matches "basedai" normalized, not "based"
  const valueKey = Object.keys(category).find(
    key => normalizeString(key) === normalizedValue
  )

  if (valueKey && category[valueKey]) {
    return `${category[valueKey].percentage}%`
  }

  // No match found - return empty string
  // This prevents false matches between similar traits
  return ''
}

/**
 * NFT Detail Page Content
 *
 * NOW USES STATIC METADATA (40x faster)
 * - Load time: <50ms (was 1-2s)
 * - No API calls required
 * - Instant trait display
 */
function NFTDetailPageContent() {
  const searchParams = useSearchParams()
  const tokenId = searchParams.get('id') || ''

  // Load NFT and trait statistics from static metadata (instant!)
  const { nft, traitStats, isLoading: loading, error: fetchError } = useStaticNFT(tokenId)

  const error = !tokenId ? 'No token ID provided' : fetchError?.message || null

  if (!tokenId) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-b from-black to-gray-950 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-300">
              <p>No NFT ID provided</p>
              <Link href="/gallery" className="mt-4 inline-block text-kek-green hover:underline">
                ← Back to Gallery
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-black via-gray-950 to-gray-900">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/gallery"
            className="font-fredoka mb-8 inline-flex items-center text-lg text-kek-green transition-colors hover:text-[#4ecca7]"
          >
            ← Back to Collection
          </Link>

          {/* Loading State */}
          {loading && (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-kek-green border-t-transparent" />
                <p className="font-fredoka text-lg text-gray-300">Loading NFT details...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
              <p className="font-fredoka text-lg text-red-400">{error}</p>
            </div>
          )}

          {/* NFT Details */}
          {nft && !loading && !error && (
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left Column - Image */}
              <div className="group relative aspect-square overflow-hidden rounded-xl border-2 border-kek-green/30 bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl transition-all hover:border-kek-green hover:shadow-kek-green/20">
                <Image
                  src={nft.imageUrl}
                  alt={nft.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                />
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Title and External Links */}
                <div>
                  <h1 className="font-fredoka mb-2 text-4xl font-bold text-kek-green">
                    {nft.name}
                  </h1>
                  <p className="font-fredoka mb-4 text-xl text-white">
                    Token ID: #{nft.tokenId}
                  </p>
                  {/* External Links */}
                  <div className="flex gap-4">
                    <a
                      href={`https://aftermint.trade/nft/0x40b6184b901334c0a88f528c1a0a1de7a77490f1/${nft.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-kek-green/30 bg-kek-green/10 px-4 py-2 font-fredoka text-sm text-kek-green transition-all hover:border-kek-green hover:bg-kek-green/20"
                    >
                      <Image
                        src="/aftermint-logo.avif"
                        alt="AfterMint"
                        width={20}
                        height={20}
                        className="h-5 w-5 object-contain"
                      />
                      Aftermint
                    </a>
                    <a
                      href={`https://explorer.bf1337.org/token/0x40B6184b901334C0A88f528c1A0a1de7a77490f1/instance/${nft.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-[#4ecca7]/30 bg-[#4ecca7]/10 px-4 py-2 font-fredoka text-sm text-[#4ecca7] transition-all hover:border-[#4ecca7] hover:bg-[#4ecca7]/20"
                    >
                      <Image
                        src="/images/bf.png"
                        alt="BasedFun Explorer"
                        width={20}
                        height={20}
                        className="h-5 w-5 object-contain"
                      />
                      Explorer
                    </a>
                  </div>
                </div>

                {/* About Section */}
                <div className="rounded-xl border border-kek-green/20 bg-gray-900/50 p-6">
                  <h2 className="font-fredoka mb-3 text-2xl font-bold text-kek-green">
                    ABOUT
                  </h2>
                  <p className="font-fredoka leading-relaxed text-gray-300">
                    4200 𝕂Ǝ𝕂丅ᵉ匚🅷 Artifacts: digital masterpieces blending tech and meme fun, hand-drawn by 𝔹enzo𝔹ert & princess 𝔹u𝔹𝔹legum. An homage to OG Pepecoin 🐸👑
                  </p>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-kek-green/20 bg-gray-900/50 p-6">
                    <div className="text-sm text-gray-400">Global Rank</div>
                    <div className="font-fredoka text-3xl font-bold text-kek-green">
                      #{nft.rank}
                    </div>
                  </div>
                  <div className="rounded-xl border border-purple-400/20 bg-gray-900/50 p-6">
                    <div className="text-sm text-gray-400">Rarity Score</div>
                    <div className="font-fredoka text-3xl font-bold text-purple-400">
                      {nft.rarityScore.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Attributes/Traits */}
                {nft.attributes && nft.attributes.length > 0 && (
                  <div className="rounded-xl border border-kek-green/20 bg-gray-900/50 p-6">
                    <h2 className="font-fredoka mb-4 text-2xl font-bold text-kek-green">
                      TRAITS
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {nft.attributes.map((attr, index) => {
                        const percentage = getTraitPercentage(traitStats, attr.trait_type, String(attr.value))
                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-kek-green/30 bg-black/60 p-4 transition-all hover:border-kek-green hover:bg-black/80"
                          >
                            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-kek-green">
                              {attr.trait_type}
                            </div>
                            <div className="font-fredoka mb-1 text-lg font-normal capitalize text-gray-300">
                              {String(attr.value).replace(/_/g, ' ')}
                            </div>
                            {percentage && (
                              <div className="text-xs font-semibold text-purple-400">
                                {percentage}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}


/**
 * NFT Detail Page
 *
 * Wrapped in Suspense for useSearchParams
 */
export default function NFTDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-b from-black to-gray-950 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-kek-green border-t-transparent" />
                <p className="font-fredoka text-lg text-gray-300">Loading...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <NFTDetailPageContent />
    </Suspense>
  )
}
