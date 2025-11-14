'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Positions Page - Redirect to new location
 *
 * This page redirects to /feels-good-markets/kek-futures/positions
 * to maintain backwards compatibility with existing links
 */
export default function PositionsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/feels-good-markets/kek-futures/positions')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="text-kek-green text-6xl mb-4">⏳</div>
        <p className="text-gray-400">Redirecting to My Positions...</p>
      </div>
    </div>
  )
}
