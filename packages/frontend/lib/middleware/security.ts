/**
 * Security Middleware - Combines all security checks
 * Applies rate limiting, origin validation, and input sanitization
 */

import { NextRequest } from 'next/server';
import { rateLimitMiddleware } from '@/lib/utils/rate-limit';
import { securityMiddleware } from '@/lib/utils/security';

/**
 * Apply all security checks to an API route
 * Use this at the start of every POST/PUT/DELETE handler
 *
 * @param request - Next.js request object
 * @param options - Optional configuration
 * @returns Response if security check fails, null if all checks pass
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   // Apply security checks FIRST
 *   const securityError = await applySecurityMiddleware(request);
 *   if (securityError) return securityError;
 *
 *   // Then proceed with your route logic...
 * }
 * ```
 */
export async function applySecurityMiddleware(
  request: NextRequest,
  options?: {
    skipRateLimit?: boolean; // Skip rate limiting for specific routes
    skipOriginCheck?: boolean; // Skip origin validation (use cautiously)
  }
): Promise<Response | null> {
  // 1. Origin validation (CSRF protection)
  if (!options?.skipOriginCheck) {
    const securityCheck = await securityMiddleware(request, {
      requireOrigin: request.method !== 'GET', // Only for state-changing requests
    });
    if (securityCheck) {
      console.log('[Security] Origin validation failed:', {
        method: request.method,
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      });
      return securityCheck;
    }
  }

  // 2. Rate limiting
  if (!options?.skipRateLimit) {
    const rateLimitCheck = await rateLimitMiddleware(request);
    if (rateLimitCheck) {
      console.log('[Security] Rate limit exceeded:', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        path: request.nextUrl.pathname,
      });
      return rateLimitCheck;
    }
  }

  // All checks passed
  return null;
}

/**
 * Apply security checks with custom rate limit configuration
 *
 * @example
 * ```typescript
 * // Higher rate limit for specific endpoint
 * const securityError = await applySecurityMiddlewareWithConfig(request, {
 *   interval: 60 * 1000, // 1 minute
 *   requests: 20, // Allow 20 requests per minute
 * });
 * ```
 */
export async function applySecurityMiddlewareWithConfig(
  request: NextRequest,
  rateLimitConfig?: {
    interval?: number;
    requests?: number;
    uniqueTokenPerInterval?: number;
  }
): Promise<Response | null> {
  // 1. Origin validation
  const securityCheck = await securityMiddleware(request, {
    requireOrigin: request.method !== 'GET',
  });
  if (securityCheck) return securityCheck;

  // 2. Rate limiting with custom config
  const rateLimitCheck = await rateLimitMiddleware(request, rateLimitConfig);
  if (rateLimitCheck) return rateLimitCheck;

  return null;
}

/**
 * Extract and log security information for debugging
 * Use in development only
 */
export function logSecurityInfo(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') return;

  console.log('[Security Debug]', {
    method: request.method,
    path: request.nextUrl.pathname,
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent'),
  });
}
