import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with proper precedence
 *
 * @param inputs - Class names to merge
 * @returns Merged class names
 *
 * @example
 * cn('px-2 py-1', 'px-4') // Returns: 'py-1 px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
