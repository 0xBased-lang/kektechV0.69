'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LinkButton } from '@/components/ui/button'
import { fetchRankingsWithFallback } from '@/lib/api/kektech-rankings'

// Featured NFTs section with rotating images from live API

interface NFTData {
  tokenId: string
  name: string
  imageUrl: string
  rarityScore: number
}

// Fallback NFTs in case API fails
const FALLBACK_NFTS = [
  { tokenId: '65', name: 'KEKTECH #65', imageUrl: '/images/65.png', rarityScore: 85 },
  { tokenId: '171', name: 'KEKTECH #171', imageUrl: '/images/171.png', rarityScore: 72 },
  { tokenId: '180', name: 'KEKTECH #180', imageUrl: '/images/180.png', rarityScore: 95 },
  { tokenId: '69', name: 'KEKTECH #69', imageUrl: '/images/69.png', rarityScore: 88 },
  { tokenId: '686', name: 'KEKTECH #686', imageUrl: '/images/686.png', rarityScore: 45 },
  { tokenId: '782', name: 'KEKTECH #782', imageUrl: '/images/782.png', rarityScore: 68 },
]

// Get random NFTs from the collection
// Currently unused - can be used for randomizing the NFT display
// function getRandomNFTs(nfts: NFTData[], count: number): NFTData[] {
//   const shuffled = [...nfts].sort(() => Math.random() - 0.5)
//   return shuffled.slice(0, count)
// }

export function FeaturedNFTs() {
  const [allNFTs, setAllNFTs] = useState<NFTData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch all minted NFTs from API with automatic fallback
  useEffect(() => {
    async function fetchNFTs() {
      try {
        // Use the same robust API client as the gallery
        // Includes: retry logic, exponential backoff, automatic fallback to mock data
        // ⚡ PERFORMANCE OPTIMIZED: Only fetch 12 NFTs for homepage carousel (Context7 recommendation)
        // Race with timeout for faster fallback to cached/local NFTs
        const data = await Promise.race([
          fetchRankingsWithFallback(12),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout after 5 seconds')), 5000)
          )
        ]).catch((error) => {
          console.warn('⚠️  Rankings API timeout or error, using fallback NFTs:', error.message)
          return { nfts: FALLBACK_NFTS }
        })

        // Transform rankings data to our format
        const nfts: NFTData[] = data.nfts.map((nft) => ({
          tokenId: nft.tokenId,
          name: nft.name,
          imageUrl: nft.imageUrl,
          rarityScore: nft.rarityScore
        }))

        // Use all fetched NFTs for carousel (limited to 12 for performance)
        setAllNFTs(nfts)
      } catch (error) {
        // This should rarely happen since fetchRankingsWithFallback has built-in fallback
        console.error('❌ Error fetching NFTs:', error)
        setAllNFTs(FALLBACK_NFTS)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNFTs()
  }, [])

  // Duplicate NFTs array for infinite scroll effect
  const scrollNFTs = [...allNFTs, ...allNFTs]

  return (
    <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 sm:py-24 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-kek-green sm:text-4xl mb-4 font-fredoka">
            Featured NFTs
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto font-fredoka">
            Discover some of our most unique and sought-after pieces from the KEKTECH collection
          </p>
        </div>

        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 animate-pulse">
                <div className="aspect-square bg-gray-700" />
                <div className="p-3">
                  <div className="h-4 bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Horizontal Scrolling Carousel
          <div className="relative mb-12">
            <div className="flex overflow-hidden">
              <div className="flex gap-4 lg:gap-6 animate-scroll-horizontal">
                {scrollNFTs.map((nft, index) => (
                    <Link
                      key={`${nft.tokenId}-${index}`}
                      href={`/gallery`}
                      className="group block flex-shrink-0 w-48 sm:w-56"
                    >
                      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 transition-all duration-300 hover:border-kek-green hover:shadow-lg hover:shadow-kek-green/20 hover:scale-105">
                        {/* NFT Image */}
                        <div className="aspect-square relative overflow-hidden">
                          <Image
                            src={nft.imageUrl}
                            alt={nft.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="224px"
                          />
                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        {/* NFT Info */}
                        <div className="p-3">
                          <h3 className="font-semibold text-kek-green text-sm truncate font-fredoka">
                            {nft.name}
                          </h3>
                        </div>
                      </div>
                    </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <LinkButton href="/gallery" variant="primary" size="lg">
            View Full Collection
          </LinkButton>
        </div>
      </div>

      {/* CSS Animation for continuous horizontal scroll */}
      <style jsx>{`
        @keyframes scroll-horizontal {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-horizontal {
          animation: scroll-horizontal 180s linear infinite;
        }

        .animate-scroll-horizontal:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
