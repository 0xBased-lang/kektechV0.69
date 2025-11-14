/**
 * Security utilities for API routes
 * Origin validation, signature validation, and request security
 */

/**
 * Validate request origin
 * Protects against CSRF by checking Origin and Referer headers
 */
export function validateOrigin(request: Request): boolean {
  const headers = new Headers(request.headers);
  const origin = headers.get('origin');
  const referer = headers.get('referer');

  // Allowed origins for production and development
  const allowedOrigins = [
    // Production domains
    'https://kektech-frontend.vercel.app', // Vercel deployment
    'https://kektech.xyz',                 // Primary domain
    'https://www.kektech.xyz',             // WWW variant
    // Development origins
    'http://localhost:3000',
    'http://localhost:3001',               // Dev server alternative port
    'http://localhost:3006',               // Dev server when ports 3000/3001 are in use
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3006',
  ];

  // Check origin header (most reliable)
  if (origin) {
    return allowedOrigins.some((allowed) => origin.startsWith(allowed));
  }

  // Fallback to referer (less reliable)
  if (referer) {
    return allowedOrigins.some((allowed) => referer.startsWith(allowed));
  }

  // No origin or referer (suspicious)
  return false;
}

/**
 * Validate signature parameters
 * Checks for required signature fields and format
 */
export function validateSignatureParams(params: {
  message?: string;
  signature?: string;
  address?: string;
}): { valid: boolean; error?: string } {
  const { message, signature, address } = params;

  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Missing or invalid message' };
  }

  if (!signature || typeof signature !== 'string') {
    return { valid: false, error: 'Missing or invalid signature' };
  }

  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Missing or invalid address' };
  }

  // Basic Ethereum address validation
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!addressRegex.test(address)) {
    return { valid: false, error: 'Invalid Ethereum address format' };
  }

  // Basic signature validation (should be 132 characters: 0x + 130 hex chars)
  const signatureRegex = /^0x[a-fA-F0-9]{130}$/;
  if (!signatureRegex.test(signature)) {
    return { valid: false, error: 'Invalid signature format' };
  }

  return { valid: true };
}

/**
 * Check if signature has expired (for replay protection)
 * @param timestamp - Unix timestamp in milliseconds
 * @param maxAge - Maximum age in milliseconds (default: 5 minutes)
 */
export function isSignatureExpired(
  timestamp: number,
  maxAge: number = 5 * 60 * 1000
): boolean {
  const now = Date.now();
  const age = now - timestamp;

  return age > maxAge || age < 0; // Reject future timestamps too
}

/**
 * Parse authentication message to extract timestamp and nonce
 * Expected format: "Sign in to KEKTECH\nTimestamp: {timestamp}\nNonce: {nonce}"
 */
export function parseAuthMessage(message: string): {
  timestamp?: number;
  nonce?: string;
  valid: boolean;
} {
  try {
    const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
    const nonceMatch = message.match(/Nonce:\s*([a-zA-Z0-9-]+)/);

    if (!timestampMatch || !nonceMatch) {
      return { valid: false };
    }

    const timestamp = parseInt(timestampMatch[1], 10);
    const nonce = nonceMatch[1];

    if (isNaN(timestamp)) {
      return { valid: false };
    }

    return {
      timestamp,
      nonce,
      valid: true,
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Security middleware helper
 * Combines multiple security checks
 */
export async function securityMiddleware(
  request: Request,
  options: {
    requireOrigin?: boolean;
    requireSignature?: boolean;
  } = {}
): Promise<Response | null> {
  const { requireOrigin = true } = options;

  // Check origin for state-changing requests (POST, PUT, DELETE)
  if (requireOrigin && request.method !== 'GET') {
    if (!validateOrigin(request)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid origin',
          message: 'Request origin not allowed',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  return null;
}

/**
 * Generate nonce for signature requests
 * @returns Random nonce string
 */
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Create authentication message for wallet signing
 * @param nonce - Unique nonce
 * @returns Message string to be signed
 */
export function createAuthMessage(nonce: string): string {
  const timestamp = Date.now();
  return `Sign in to KEKTECH

Timestamp: ${timestamp}
Nonce: ${nonce}

This request will not trigger a blockchain transaction or cost any gas fees.`;
}
