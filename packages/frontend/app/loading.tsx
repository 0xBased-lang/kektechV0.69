/**
 * KEKTECH 3.0 - Global Loading State
 *
 * Displays during page transitions and initial page loads.
 * Provides visual feedback while content is being fetched.
 */

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        {/* KEKTECH Spinner */}
        <div className="relative mx-auto mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-kek-green"></div>
          <div className="absolute inset-0 rounded-full h-16 w-16 border-r-2 border-l-2 border-kek-green animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>

        {/* Loading Text */}
        <p className="text-gray-400 animate-pulse">Loading...</p>
      </div>
    </div>
  )
}
