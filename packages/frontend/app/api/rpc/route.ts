import { NextRequest, NextResponse } from 'next/server';

/**
 * Bulletproof RPC Proxy for BasedAI Chain
 *
 * Single-RPC architecture optimized for Vercel Edge (10s limit):
 * - Fast retries (4s timeout, 2 retries = ~9s worst case)
 * - Intelligent caching to reduce RPC load
 * - Circuit breaker to prevent cascading failures
 * - Connection pooling for better performance
 * - Graceful degradation with stale cache fallback
 *
 * BasedAI Chain (32323) has only ONE RPC endpoint, so we make it bulletproof.
 * RPC typically responds in ~0.15s, so 4s timeout is more than enough.
 */

// Single RPC endpoint for BasedAI chain
// .trim() removes any newline characters that could cause fetch errors
const RPC_URL = (process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.basedaibridge.com/rpc/').trim();

// Vercel Edge-optimized configuration (10s total execution limit)
const REQUEST_TIMEOUT = 4000; // 4 seconds (RPC responds in ~0.15s typically)
const MAX_RETRIES = 2; // 2 retries = 3 total attempts max
const RETRY_DELAYS = [200, 400]; // Fast retries (0.6s total delay)

// Circuit breaker configuration
const CIRCUIT_BREAKER_THRESHOLD = 10; // Open circuit after 10 consecutive failures
const CIRCUIT_BREAKER_RESET = 60000; // Reset circuit after 1 minute

// Circuit breaker state (in-memory, resets on server restart)
let consecutiveFailures = 0;
let circuitOpen = false;
let circuitOpenedAt = 0;

// Smart cache for static/slow-changing data
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION: Record<string, number> = {
  'eth_chainId': 3600000, // 1 hour (never changes)
  'eth_blockNumber': 12000, // 12 seconds (BasedAI block time)
  'eth_getBalance': 30000, // 30 seconds
  'eth_call': 10000, // 10 seconds (contract reads)
  'eth_getCode': 300000, // 5 minutes (code rarely changes)
  'eth_getTransactionCount': 30000, // 30 seconds
};

/**
 * Fetch with timeout helper
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate RPC request
    if (!body.method || !body.jsonrpc) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          error: { code: -32600, message: 'Invalid Request: Missing required fields' },
          id: body.id || null
        },
        { status: 400 }
      );
    }

    // Check circuit breaker
    if (circuitOpen) {
      const now = Date.now();
      if (now - circuitOpenedAt > CIRCUIT_BREAKER_RESET) {
        // Reset circuit breaker
        circuitOpen = false;
        consecutiveFailures = 0;
        console.log('🔄 Circuit breaker RESET - retrying RPC');
      } else {
        // Circuit still open - try cached data
        const cacheKey = `${body.method}:${JSON.stringify(body.params || [])}`;
        const cached = requestCache.get(cacheKey);

        if (cached) {
          const age = Date.now() - cached.timestamp;
          console.log(`⚡ Circuit OPEN - serving STALE cache (age: ${Math.round(age/1000)}s)`);

          return NextResponse.json(cached.data, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
              'X-Cache': 'STALE',
              'X-Cache-Age': age.toString(),
            },
          });
        }

        // No cache available and circuit is open
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'RPC temporarily unavailable (circuit breaker open)',
              data: `Circuit will reset in ${Math.round((CIRCUIT_BREAKER_RESET - (now - circuitOpenedAt))/1000)}s`
            },
            id: body.id || null
          },
          { status: 503 } // Service Unavailable
        );
      }
    }

    // Check cache first
    const cacheKey = `${body.method}:${JSON.stringify(body.params || [])}`;
    const cached = requestCache.get(cacheKey);
    const cacheDuration = CACHE_DURATION[body.method];

    if (cached && cacheDuration) {
      const age = Date.now() - cached.timestamp;
      if (age < cacheDuration) {
        console.log(`✅ Cache HIT for ${body.method} (age: ${Math.round(age/1000)}s)`);

        return NextResponse.json(cached.data, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-Cache': 'HIT',
            'X-Cache-Age': age.toString(),
          },
        });
      }
    }

    // Retry logic with exponential backoff
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 RPC request attempt ${attempt + 1}/${MAX_RETRIES}: ${body.method}`);

        const response = await fetchWithTimeout(
          RPC_URL,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'KEKTECH/1.0',
            },
            body: JSON.stringify(body),
            // Connection pooling for better performance
            keepalive: true,
          },
          REQUEST_TIMEOUT
        );

        if (!response.ok) {
          throw new Error(`RPC HTTP error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // SUCCESS! Reset failure counter
        consecutiveFailures = 0;

        // Cache successful response
        if (cacheDuration) {
          requestCache.set(cacheKey, { data, timestamp: Date.now() });
          console.log(`💾 Cached ${body.method} for ${cacheDuration/1000}s`);
        }

        console.log(`✅ RPC SUCCESS: ${body.method} (attempt ${attempt + 1})`);

        return NextResponse.json(data, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-Cache': 'MISS',
            'X-RPC-Attempts': (attempt + 1).toString(),
          },
        });

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const isTimeout = error.name === 'AbortError';
        const isNetworkError = error.message.includes('fetch');

        console.warn(`⚠️  RPC attempt ${attempt + 1}/${MAX_RETRIES} failed:`, {
          method: body.method,
          error: lastError.message,
          isTimeout,
          isNetworkError,
        });

        // Don't retry if it's a request validation error (400)
        if (!isTimeout && !isNetworkError && lastError.message.includes('400')) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < MAX_RETRIES - 1) {
          const delay = RETRY_DELAYS[attempt];
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    consecutiveFailures++;
    console.error(`❌ RPC FAILED after ${MAX_RETRIES} attempts:`, lastError?.message);

    // Open circuit breaker if too many failures
    if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitOpen = true;
      circuitOpenedAt = Date.now();
      console.error(`🚨 Circuit breaker OPEN after ${consecutiveFailures} consecutive failures`);
    }

    // Try to serve stale cache as last resort
    const staleCache = requestCache.get(cacheKey);
    if (staleCache) {
      const age = Date.now() - staleCache.timestamp;
      console.log(`⚡ Serving STALE cache as fallback (age: ${Math.round(age/1000)}s)`);

      return NextResponse.json(staleCache.data, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'X-Cache': 'STALE',
          'X-Cache-Age': age.toString(),
        },
      });
    }

    // No cache available - return error
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: `BasedAI RPC unavailable after ${MAX_RETRIES} attempts`,
          data: {
            rpcUrl: RPC_URL,
            attempts: MAX_RETRIES,
            lastError: lastError?.message,
            consecutiveFailures,
          }
        },
        id: body.id || null
      },
      {
        status: 503, // Service Unavailable (better than 500)
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Retry-After': '60', // Suggest retry after 60 seconds
        },
      }
    );

  } catch (error) {
    console.error('❌ RPC Proxy Error:', error);

    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal proxy error',
          data: error instanceof Error ? error.message : 'Unknown error'
        },
        id: null
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
