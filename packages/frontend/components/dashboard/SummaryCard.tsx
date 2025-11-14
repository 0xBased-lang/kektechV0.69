interface SummaryCardProps {
  title: string
  value: string
  subvalue: string
  icon: string
  gradient: string
  onClick?: () => void
  disabled?: boolean
  isLoading?: boolean
}

/**
 * Summary Card Component
 *
 * Clickable card for dashboard overview with loading states
 * Used in OverviewTab to provide quick navigation
 */
export function SummaryCard({
  title,
  value,
  subvalue,
  icon,
  gradient,
  onClick,
  disabled = false,
  isLoading = false
}: SummaryCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        group relative bg-gray-900/60 border-2 border-gray-800 rounded-xl p-6 text-left
        transition-all duration-300
        ${disabled || isLoading
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-kek-green hover:shadow-lg hover:shadow-kek-green/20 cursor-pointer'
        }
      `}
    >
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />

      {/* Content */}
      <div className="relative">
        {/* Icon */}
        <div className="text-4xl mb-4">{icon}</div>

        {/* Title */}
        <h3 className="text-sm text-gray-400 mb-2">{title}</h3>

        {/* Value */}
        {isLoading ? (
          <div className="h-8 bg-gray-800 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-xl font-fredoka font-bold text-white mb-1">{value}</p>
        )}

        {/* Subvalue */}
        {isLoading ? (
          <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
        ) : (
          <p className="text-sm text-gray-500">{subvalue}</p>
        )}

        {/* Arrow hint */}
        {!disabled && !isLoading && (
          <div className="absolute top-6 right-6 text-gray-600 group-hover:text-kek-green transition">
            →
          </div>
        )}
      </div>
    </button>
  )
}
