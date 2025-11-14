/**
 * Rate limiting utility for API routes
 * Prevents abuse by limiting requests per IP address
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique IPs to track
  requests: number; // Max requests per interval
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store (suitable for serverless with short-lived instances)
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Check if request should be rate limited
 * @param identifier - Unique identifier (usually IP address)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and retry time
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
    requests: 10, // 10 requests per minute
  }
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const store = rateLimitStore.get(identifier);

  // Clean up old entries if store is too large
  if (rateLimitStore.size > config.uniqueTokenPerInterval) {
    const oldestAllowed = now - config.interval;
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < oldestAllowed) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!store || store.resetTime < now) {
    // First request or window expired
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.interval,
    });
    return { allowed: true };
  }

  if (store.count < config.requests) {
    // Within limit
    store.count++;
    return { allowed: true };
  }

  // Rate limited
  return {
    allowed: false,
    retryAfter: Math.ceil((store.resetTime - now) / 1000), // seconds
  };
}

/**
 * Get client IP address from request
 * @param request - Next.js request object
 * @returns IP address or 'unknown'
 */
export function getClientIP(request: Request): string {
  // Try to get IP from various headers (in order of preference)
  const headers = new Headers(request.headers);

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  return 'unknown';
}

/**
 * Middleware helper for rate limiting API routes
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Response if rate limited, null if allowed
 */
export async function rateLimitMiddleware(
  request: Request,
  config?: RateLimitConfig
): Promise<Response | null> {
  const ip = getClientIP(request);
  const { allowed, retryAfter } = await rateLimit(ip, config);

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  return null;
}
