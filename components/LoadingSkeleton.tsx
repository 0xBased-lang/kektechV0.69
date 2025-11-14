/**
 * KEKTECH 3.0 - Loading Skeleton Components
 *
 * Skeleton loaders for different UI components while data is loading.
 * Provides smooth, professional loading experience.
 */

/**
 * Base skeleton component with shimmer animation
 */
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded ${className}`}
      style={{
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

/**
 * Skeleton for individual comment
 */
export function CommentSkeleton() {
  return (
    <div className="border border-gray-800 rounded-lg p-4 space-y-3">
      {/* User info */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Comment text */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Vote buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

/**
 * Skeleton for market card
 */
export function MarketCardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      {/* Market title */}
      <Skeleton className="h-6 w-3/4 mb-4" />

      {/* Market description */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Market stats */}
      <div className="flex gap-4 mb-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Action button */}
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

/**
 * Skeleton for vote component
 */
export function VoteSkeleton() {
  return (
    <div className="border border-gray-800 rounded-lg p-6">
      {/* Vote buttons */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>

      {/* Progress bar */}
      <Skeleton className="h-2 w-full mb-2" />

      {/* Vote counts */}
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

/**
 * Skeleton for comment list (multiple comments)
 */
export function CommentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for market grid
 */
export function MarketGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <MarketCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for user profile
 */
export function ProfileSkeleton() {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      {/* Avatar and name */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
      </div>
    </div>
  )
}

// Add shimmer animation to global styles
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `
  document.head.appendChild(style)
}
