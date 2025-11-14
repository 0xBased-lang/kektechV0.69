import { PositionList } from '@/components/kektech/positions/PositionList'
import { PnLSummary } from './PnLSummary'

interface FeelsGoodTabProps {
  address: string
}

/**
 * Feels Good Tab Component
 *
 * Displays prediction market participation:
 * - P&L summary (profit/loss breakdown)
 * - Active positions (PositionList component)
 * - Future: KEK Futures and Frog Futures sub-tabs
 */
export function FeelsGoodTab({ address }: FeelsGoodTabProps) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-fredoka font-bold text-white mb-2">
          Feels Good Positions
        </h2>
        <p className="text-gray-400">
          Track your prediction market positions and performance
        </p>
      </div>

      {/* P&L Summary */}
      <PnLSummary address={address} />

      {/* Position List */}
      <div className="mt-8">
        <h3 className="text-xl font-fredoka font-bold text-white mb-4">
          My Positions
        </h3>
        <PositionList />
      </div>

      {/* Future: Sub-tabs for KEK Futures / Frog Futures */}
      <div className="mt-12 bg-gray-900/60 border border-gray-800 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">🚀</div>
        <h4 className="text-lg font-fredoka font-bold text-white mb-2">
          More Markets Coming Soon
        </h4>
        <p className="text-gray-400 text-sm mb-4">
          KEK Futures and Frog Futures will have dedicated sub-tabs for better organization
        </p>
        <div className="flex justify-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <span className="text-kek-green">■</span>
            KEK Futures
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[#4ecca7]">■</span>
            Frog Futures
          </span>
        </div>
      </div>
    </div>
  )
}
