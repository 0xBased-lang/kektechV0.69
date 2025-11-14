interface PnLSummaryProps {
  address: string
}

/**
 * P&L Summary Component
 *
 * Displays profit/loss breakdown for prediction markets
 * TODO: Integrate with real prediction market data
 */
export function PnLSummary({ address: _address }: PnLSummaryProps) {
  // TODO: Add hooks to fetch real P&L data
  // const { totalPnL, realizedPnL, unrealizedPnL } = useUserPnL(_address)

  const totalPnL = 0
  const realizedPnL = 0
  const unrealizedPnL = 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total P&L */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-400">Total P&L</h4>
          <span className="text-2xl">📊</span>
        </div>
        <div className="mb-1">
          <span className={`text-3xl font-fredoka font-bold ${
            totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} BASED
          </span>
        </div>
        <p className="text-xs text-gray-500">All-time performance</p>
      </div>

      {/* Realized P&L */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-400">Realized P&L</h4>
          <span className="text-2xl">✅</span>
        </div>
        <div className="mb-1">
          <span className={`text-3xl font-fredoka font-bold ${
            realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {realizedPnL >= 0 ? '+' : ''}{realizedPnL.toFixed(2)} BASED
          </span>
        </div>
        <p className="text-xs text-gray-500">From closed positions</p>
      </div>

      {/* Unrealized P&L */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-400">Unrealized P&L</h4>
          <span className="text-2xl">⏳</span>
        </div>
        <div className="mb-1">
          <span className={`text-3xl font-fredoka font-bold ${
            unrealizedPnL >= 0 ? 'text-gray-400' : 'text-gray-400'
          }`}>
            {unrealizedPnL >= 0 ? '+' : ''}{unrealizedPnL.toFixed(2)} BASED
          </span>
        </div>
        <p className="text-xs text-gray-500">From open positions</p>
      </div>
    </div>
  )
}
