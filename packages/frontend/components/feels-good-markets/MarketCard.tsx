import Link from 'next/link'
import { ReactNode } from 'react'

interface MarketCardProps {
  title: string
  description: string
  features: string[]
  icon: string
  gradient: string
  ctaText: string
  ctaLink?: string
  badge?: string
  badgeVariant?: 'success' | 'warning'
  isPrimary?: boolean
  isDisabled?: boolean
  size?: 'standard' | 'large'
}

/**
 * Market Card Component
 *
 * Reusable card for displaying markets on Feels Good Markets landing page
 * Supports primary/secondary variants, badges, and disabled states
 */
export function MarketCard({
  title,
  description,
  features,
  icon,
  gradient,
  ctaText,
  ctaLink,
  badge,
  badgeVariant = 'success',
  isPrimary = false,
  isDisabled = false,
  size = 'standard'
}: MarketCardProps) {
  const CardWrapper = ({ children }: { children: ReactNode }) => {
    if (isDisabled || !ctaLink) {
      return <div className="h-full">{children}</div>
    }
    return <Link href={ctaLink} className="block h-full">{children}</Link>
  }

  return (
    <CardWrapper>
      <div
        className={`
          group relative h-full
          bg-gray-900/60 border-2 rounded-xl p-8
          transition-all duration-300
          ${isPrimary
            ? 'border-kek-green shadow-lg shadow-kek-green/30 md:row-span-2'
            : 'border-gray-800'
          }
          ${isDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:shadow-2xl hover:shadow-kek-green/20 cursor-pointer hover:border-kek-green'
          }
          ${size === 'large' ? 'md:col-span-2 lg:col-span-1' : ''}
        `}
      >
        {/* Icon Circle */}
        <div className="mb-6 flex justify-center">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradient} p-1`}>
            <div className="w-full h-full rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
              <span className="text-5xl">{icon}</span>
            </div>
          </div>
        </div>

        {/* Badge */}
        {badge && (
          <div className="flex justify-center mb-4">
            <span
              className={`
                inline-block px-4 py-1.5 rounded-full text-xs font-bold border
                ${badgeVariant === 'success'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                }
              `}
            >
              {badge}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-2xl font-fredoka font-bold text-white mb-3 text-center">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 mb-6 text-center">
          {description}
        </p>

        {/* Feature List */}
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-kek-green flex-shrink-0">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          disabled={isDisabled}
          className={`
            w-full py-3 rounded-lg font-fredoka font-bold transition-all
            ${isPrimary
              ? 'bg-gradient-to-r from-kek-green to-[#4ecca7] text-black shadow-lg hover:shadow-xl hover:shadow-[#4ecca7]/30 hover:scale-105 active:scale-95'
              : 'border-2 border-kek-green/60 text-kek-green hover:bg-kek-green/10 hover:border-kek-green'
            }
            ${isDisabled && 'opacity-50 cursor-not-allowed hover:scale-100'}
            disabled:cursor-not-allowed
          `}
        >
          {ctaText}
        </button>

        {/* Hover Glow Effect */}
        {!isDisabled && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-kek-green/0 to-[#4ecca7]/0 group-hover:from-kek-green/5 group-hover:to-[#4ecca7]/5 transition-all duration-300 pointer-events-none" />
        )}
      </div>
    </CardWrapper>
  )
}
