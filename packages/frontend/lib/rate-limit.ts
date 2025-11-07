/**
 * Rate Limiting Utilities
 *
 * Provides rate limiting for API routes and operations to prevent abuse.
 *
 * Features:
 * - IP-based rate limiting
 * - Multiple rate limiters for different operations
 * - In-memory fallback when Redis is unavailable
 * - Configurable limits and windows
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Redis is configured
const isRedisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis client (or null if not configured)
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * In-memory rate limiter fallback
 * Used when Redis is not configured
 */
class MemoryRateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();
  private maxLimit: number;
  private window: number;

  constructor(limit: number, windowMs: number) {
    this.maxLimit = limit;
    this.window = windowMs;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }

  async limit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.window,
      });
      return {
        success: true,
        limit: this.maxLimit,
        remaining: this.maxLimit - 1,
        reset: now + this.window,
      };
    }

    // Existing window
    if (entry.count >= this.maxLimit) {
      return {
        success: false,
        limit: this.maxLimit,
        remaining: 0,
        reset: entry.resetTime,
      };
    }

    entry.count++;
    return {
      success: true,
      limit: this.maxLimit,
      remaining: this.maxLimit - entry.count,
      reset: entry.resetTime,
    };
  }
}

/**
 * Rate limiter for minting operations
 * 5 mints per hour per IP
 */
export const mintRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      analytics: true,
      prefix: 'ratelimit:mint',
    })
  : new MemoryRateLimiter(5, 60 * 60 * 1000); // 5 per hour

/**
 * Rate limiter for RPC calls
 * 100 calls per minute per IP
 */
export const rpcRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:rpc',
    })
  : new MemoryRateLimiter(100, 60 * 1000); // 100 per minute

/**
 * Rate limiter for wallet connections
 * 10 connections per minute per IP
 */
export const walletConnectRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'ratelimit:wallet',
    })
  : new MemoryRateLimiter(10, 60 * 1000); // 10 per minute

/**
 * Rate limiter for general API calls
 * 60 calls per minute per IP
 */
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : new MemoryRateLimiter(60, 60 * 1000); // 60 per minute

/**
 * Get IP address from request headers
 */
export function getIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (real) {
    return real.trim();
  }

  return 'unknown';
}

/**
 * Apply rate limiting to a request
 * Returns response if rate limited, null otherwise
 */
export async function applyRateLimit(
  request: Request,
  limiter: Ratelimit | MemoryRateLimiter
): Promise<Response | null> {
  const ip = getIP(request);
  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    const resetDate = new Date(reset);
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again after ${resetDate.toISOString()}`,
        limit,
        remaining,
        reset: resetDate.toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: Response,
  limit: number,
  remaining: number,
  reset: number
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', remaining.toString());
  headers.set('X-RateLimit-Reset', reset.toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Log Redis configuration status
if (typeof window === 'undefined') {
  if (isRedisConfigured) {
    console.warn('✅ Rate limiting: Using Upstash Redis');
  } else {
    console.warn('⚠️  Rate limiting: Using in-memory fallback (configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production)');
  }
}
