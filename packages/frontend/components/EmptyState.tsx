/**
 * KEKTECH 3.0 - Empty State Component
 *
 * Displays user-friendly message when no data is available.
 * Used in lists, search results, and other data display components.
 */

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      {icon && (
        <div className="mb-4 text-gray-600 dark:text-gray-500">
          {icon}
        </div>
      )}

      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-300 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-gray-600 dark:text-gray-500 mb-6 max-w-md">
          {description}
        </p>
      )}

      {action && (
        <Button
          onClick={action.onClick}
          className="bg-kek-green hover:bg-[#2fa8ad] text-white"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
