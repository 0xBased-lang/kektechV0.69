'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Marketplace Page - Redirect to new location
 *
 * This page redirects to /feels-good-markets/nft-marketplace
 * to maintain backwards compatibility with existing links
 */
export default function MarketplacePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/feels-good-markets/nft-marketplace')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="text-[#3fb8bd] text-6xl mb-4">⏳</div>
        <p className="text-gray-400">Redirecting to NFT Marketplace...</p>
      </div>
    </div>
  )
}
