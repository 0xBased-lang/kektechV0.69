/**
 * Security utilities for sanitizing user input
 * Server-safe implementation without DOM dependencies
 */

/**
 * Server-safe sanitization for comment text
 * Removes HTML tags and dangerous characters
 * @param comment - Comment text from user
 * @returns Sanitized comment text
 */
export const sanitizeComment = (comment: string): string => {
  if (!comment || typeof comment !== 'string') {
    return '';
  }

  // Remove all HTML tags
  let sanitized = comment.replace(/<[^>]*>/g, '');

  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>"']/g, '');

  // Trim whitespace and limit length
  return sanitized.trim().slice(0, 1000);
};

/**
 * Server-safe text sanitization
 * Removes all HTML and dangerous characters
 * @param text - Text to sanitize
 * @returns Plain text with all HTML removed
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove all HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');

  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>"']/g, '');

  return sanitized.trim();
};

/**
 * Server-safe HTML sanitization for rich content
 * This is a basic implementation - for production, consider using a library like DOMPurify on client-side only
 * @param dirty - HTML content to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHTML = (dirty: string): string => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // For server-side, strip all HTML for safety
  // Client-side can implement proper HTML sanitization with dompurify
  if (typeof window === 'undefined') {
    // Server-side: Remove all HTML
    return dirty
      .replace(/<[^>]*>/g, '')
      .replace(/[<>"']/g, '')
      .trim();
  }

  // Client-side: Basic HTML sanitization (consider using dompurify for production)
  // This is a simplified version - only allows basic formatting tags
  let cleaned = dirty;

  // Remove script tags and content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove event handlers
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: URLs
  cleaned = cleaned.replace(/javascript:/gi, '');

  return cleaned.trim();
};

/**
 * Validate and sanitize Ethereum address
 * @param address - Ethereum address to validate
 * @returns Sanitized address or throws error if invalid
 */
export const sanitizeAddress = (address: string): string => {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address: must be a string');
  }

  // Trim whitespace
  const cleaned = address.trim().toLowerCase();

  // Validate Ethereum address format (0x + 40 hex chars)
  if (!/^0x[a-f0-9]{40}$/i.test(cleaned)) {
    throw new Error('Invalid address format');
  }

  return cleaned;
};

/**
 * Validate and sanitize transaction hash
 * @param hash - Transaction hash to validate
 * @returns Sanitized hash or throws error if invalid
 */
export const sanitizeTransactionHash = (hash: string): string => {
  if (!hash || typeof hash !== 'string') {
    throw new Error('Invalid transaction hash: must be a string');
  }

  // Trim whitespace
  const cleaned = hash.trim().toLowerCase();

  // Validate transaction hash format (0x + 64 hex chars)
  if (!/^0x[a-f0-9]{64}$/i.test(cleaned)) {
    throw new Error('Invalid transaction hash format');
  }

  return cleaned;
};

/**
 * Validate and sanitize URL
 * @param url - URL string to validate
 * @returns Sanitized URL or null if invalid
 */
export const sanitizeURL = (url: string): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
};

/**
 * Sanitize number input
 * @param value - Value to sanitize
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Sanitized number or null if invalid
 */
export const sanitizeNumber = (value: unknown, min?: number, max?: number): number | null => {
  const num = parseFloat(String(value));

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return null;
  }

  if (max !== undefined && num > max) {
    return null;
  }

  return num;
};