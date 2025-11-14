/**
 * Input Validation Utilities
 *
 * Provides validation for user inputs to prevent security vulnerabilities
 * and ensure data integrity.
 */

import { z } from 'zod';
import { isAddress, parseUnits } from 'viem';

/**
 * Ethereum address validation schema
 */
export const ethereumAddressSchema = z
  .string()
  .refine((addr) => isAddress(addr), {
    message: 'Invalid Ethereum address',
  });

/**
 * Token amount validation schema
 * Validates numeric strings with optional decimals
 */
export const tokenAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,18})?$/, {
    message: 'Invalid amount format. Use numbers only (max 18 decimals)',
  })
  .refine(
    (amount) => {
      try {
        const value = parseFloat(amount);
        return value > 0 && !isNaN(value);
      } catch {
        return false;
      }
    },
    {
      message: 'Amount must be a positive number',
    }
  );

/**
 * Mint request validation schema
 */
export const mintRequestSchema = z.object({
  amount: tokenAmountSchema,
  recipient: ethereumAddressSchema.optional(),
  nonce: z.string().min(1, 'Nonce is required'),
});

/**
 * Environment validation schema
 */
export const envSchema = z.object({
  // Public variables (exposed to client)
  NEXT_PUBLIC_REOWN_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_CONTRACT_ADDRESS: ethereumAddressSchema,
  NEXT_PUBLIC_CHAIN_ID: z.string().regex(/^\d+$/).transform(Number),
  NEXT_PUBLIC_RPC_URL: z.string().url(),
  NEXT_PUBLIC_EXPLORER_URL: z.string().url(),
  NEXT_PUBLIC_METADATA_API: z.string().url(),
  NEXT_PUBLIC_RANKING_API: z.string().url(),

  // Optional server-side variables
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  ADMIN_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  MONGODB_URI: z.string().url().optional(),
});

/**
 * Validate token amount with min/max bounds
 */
export function validateAmount(
  amount: string,
  decimals: number = 18,
  min?: bigint,
  max?: bigint
): { valid: boolean; error?: string; value?: bigint } {
  // Validate format
  const formatResult = tokenAmountSchema.safeParse(amount);
  if (!formatResult.success) {
    return {
      valid: false,
      error: formatResult.error.issues[0]?.message || 'Invalid amount format',
    };
  }

  // Parse to BigInt
  let value: bigint;
  try {
    value = parseUnits(amount, decimals);
  } catch {
    return {
      valid: false,
      error: 'Failed to parse amount',
    };
  }

  // Check minimum
  if (min !== undefined && value < min) {
    return {
      valid: false,
      error: `Amount must be at least ${min.toString()}`,
    };
  }

  // Check maximum
  if (max !== undefined && value > max) {
    return {
      valid: false,
      error: `Amount cannot exceed ${max.toString()}`,
    };
  }

  return {
    valid: true,
    value,
  };
}

/**
 * Validate Ethereum address
 */
export function validateAddress(address: string): { valid: boolean; error?: string } {
  const result = ethereumAddressSchema.safeParse(address);
  if (!result.success) {
    return {
      valid: false,
      error: result.error.issues[0]?.message || 'Invalid address',
    };
  }

  return { valid: true };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>\"'&]/g, (char) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return escapeMap[char] || char;
    })
    .trim();
}

/**
 * Validate and parse environment variables
 */
export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((e) => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

/**
 * Generate cryptographic nonce for replay protection
 */
export function generateNonce(address: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${address}-${timestamp}-${random}`;
}

/**
 * Validate nonce (basic timestamp check)
 */
export function validateNonce(nonce: string, maxAgeMs: number = 5 * 60 * 1000): boolean {
  try {
    const parts = nonce.split('-');
    if (parts.length !== 3) return false;

    const timestamp = parseInt(parts[1], 10);
    if (isNaN(timestamp)) return false;

    const age = Date.now() - timestamp;
    return age >= 0 && age <= maxAgeMs;
  } catch {
    return false;
  }
}

/**
 * Rate limiting cooldown tracker (client-side)
 */
export class CooldownTracker {
  private lastAction: number = 0;
  private cooldownMs: number;

  constructor(cooldownMs: number) {
    this.cooldownMs = cooldownMs;
  }

  canAct(): boolean {
    const now = Date.now();
    return now - this.lastAction >= this.cooldownMs;
  }

  getRemainingTime(): number {
    const now = Date.now();
    const elapsed = now - this.lastAction;
    return Math.max(0, this.cooldownMs - elapsed);
  }

  recordAction(): void {
    this.lastAction = Date.now();
  }

  reset(): void {
    this.lastAction = 0;
  }
}
