'use client'

/**
 * KEKTECH 3.0 - Global Error Boundary
 *
 * Catches unhandled errors in the application and displays a user-friendly error page
 * with the option to retry the failed operation.
 */

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console (and potentially to error tracking service)
    console.error('Global error caught:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg
            className="w-20 h-20 mx-auto text-red-500 mb-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>

          <h2 className="text-2xl font-bold text-red-500 mb-2">
            Something went wrong!
          </h2>

          <p className="text-gray-400 mb-2">
            {error.message || 'An unexpected error occurred'}
          </p>

          {error.digest && (
            <p className="text-xs text-gray-600 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-kek-green hover:bg-[#2fa8ad] text-white"
          >
            Try again
          </Button>

          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border-gray-700 hover:bg-gray-900"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}
