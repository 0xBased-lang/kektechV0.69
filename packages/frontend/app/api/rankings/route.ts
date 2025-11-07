import { NextResponse } from 'next/server'
import { RANKING_API_URL } from '@/config/constants'

/**
 * Rankings API Proxy Route
 *
 * This API route acts as a proxy to bypass CORS restrictions when accessing
 * the rankings API from the browser. The request flow is:
 *
 * Browser → /api/rankings (Next.js) → https://api.kektech.xyz/rankings → Response
 *
 * Benefits:
 * - No CORS issues (server-to-server communication)
 * - Same-origin requests from browser perspective
 * - Caching support via Next.js
 * - Error handling and retry logic
 */

/**
 * GET /api/rankings
 *
 * Fetches all NFT rankings from the external API and returns them to the client.
 * Implements retry logic and proper error handling.
 *
 * @returns JSON response with NFT rankings or error message
 */
export async function GET() {
  const maxRetries = 3
  const retryDelay = 1000
  const timeout = 10000

  let lastError: Error | null = null

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // Fetch from external API (server-side, no CORS)
      const response = await fetch(`${RANKING_API_URL}/rankings`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-cache', // Always get fresh data
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Check response status
      if (!response.ok) {
        throw new Error(`External API returned ${response.status}: ${response.statusText}`)
      }

      // Parse and validate response
      const data = await response.json()

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response: expected object')
      }

      if (!Array.isArray(data.nfts)) {
        throw new Error('Invalid API response: expected nfts array')
      }

      // Success! Return data with proper headers
      return NextResponse.json(data, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
          'Content-Type': 'application/json',
        },
      })

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Log warning (visible in Vercel logs)
      console.warn(
        `⚠️  Rankings API proxy attempt ${attempt}/${maxRetries} failed:`,
        lastError.message
      )

      // If not last attempt, wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // All retries failed - return error response
  console.error('❌ Rankings API proxy failed after all retries:', lastError)

  return NextResponse.json(
    {
      error: 'Failed to fetch rankings',
      message: lastError?.message || 'Unknown error',
      retries: maxRetries,
    },
    {
      status: 503, // Service Unavailable
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

/**
 * Runtime configuration
 * Use Node.js runtime for better fetch support
 */
export const runtime = 'nodejs'

/**
 * Revalidate cache every 60 seconds
 */
export const revalidate = 60
