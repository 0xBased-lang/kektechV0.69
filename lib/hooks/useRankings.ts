'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchRankingsWithFallback, type RankingNFT } from '@/lib/api/kektech-rankings'

/**
 * useRankings Hook
 * 
 * Provides real-time NFT rankings data with:
 * - Automatic polling every 30 seconds
 * - Manual refresh capability
 * - Loading and error states
 * - Automatic fallback to mock data
 * - Cleanup on unmount
 */
export function useRankings(pollInterval = 30000) {
  const [rankings, setRankings] = useState<RankingNFT[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      
      // Fetch from rankings API with automatic fallback to mock data
      const data = await fetchRankingsWithFallback()
      
      setRankings(data.nfts || [])
      setTotal(data.nfts?.length || 0)
      setLastUpdated(new Date())
      
      // Log successful update (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Rankings updated: ${data.nfts?.length || 0} NFTs at ${new Date().toLocaleTimeString()}`)
      }
    } catch (err) {
      // This should rarely happen since fetchRankingsWithFallback has built-in fallback
      console.error('❌ Rankings: Failed to fetch data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load rankings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchData()

    // Set up polling interval
    const interval = setInterval(fetchData, pollInterval)

    // Cleanup on unmount
    return () => {
      clearInterval(interval)
    }
  }, [fetchData, pollInterval])

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLoading(true)
    await fetchData()
  }, [fetchData])

  return { 
    rankings, 
    total, 
    loading, 
    error, 
    lastUpdated,
    refresh 
  }
}
