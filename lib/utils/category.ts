/**
 * Category Conversion Utilities
 * Converts string categories to bytes32 for contract calls
 */

import { keccak256, encodePacked } from 'viem';

/**
 * Convert category string to bytes32 for contract calls
 * Uses keccak256 hash for deterministic conversion
 *
 * @param category - Category string (e.g., "Politics", "Crypto")
 * @returns bytes32 hex string (e.g., "0x1234...abcd")
 *
 * @example
 * const categoryBytes32 = categoryToBytes32("Politics");
 * // Returns: "0x1234567890abcdef..." (64 hex chars after 0x)
 */
export function categoryToBytes32(category: string): `0x${string}` {
  return keccak256(encodePacked(['string'], [category]));
}

/**
 * Standard categories supported by KEKTECH 3.0
 * These are the predefined categories users can select
 */
export const CATEGORIES = [
  'Politics',
  'Crypto',
  'Sports',
  'Entertainment',
  'Technology',
  'Science',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

/**
 * Category display mapping
 * Maps category strings to their display names
 */
export const CATEGORY_DISPLAY: Record<string, string> = {
  'Politics': 'Politics',
  'Crypto': 'Crypto',
  'Sports': 'Sports',
  'Entertainment': 'Entertainment',
  'Technology': 'Technology',
  'Science': 'Science',
  'Other': 'Other',
};

/**
 * Get category display name
 * @param category - Category string
 * @returns Display name for the category
 */
export function getCategoryDisplay(category: string): string {
  return CATEGORY_DISPLAY[category] || category;
}

/**
 * Validate category string
 * @param category - Category to validate
 * @returns true if valid, false otherwise
 */
export function isValidCategory(category: string): boolean {
  return CATEGORIES.includes(category as Category);
}
