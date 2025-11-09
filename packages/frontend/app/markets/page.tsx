'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Markets Page - Redirect to new location
 *
 * This page redirects to /feels-good-markets/kek-futures
 * to maintain backwards compatibility with existing links
 */
export default function MarketsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/feels-good-markets/kek-futures')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="text-[#3fb8bd] text-6xl mb-4">⏳</div>
        <p className="text-gray-400">Redirecting to KEK Futures...</p>
      </div>
    </div>
  )
}
