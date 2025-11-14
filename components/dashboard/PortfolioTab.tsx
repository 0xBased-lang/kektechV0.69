import { ComprehensiveDashboard } from './ComprehensiveDashboard'

interface PortfolioTabProps {
  address: string
}

/**
 * Portfolio Tab Component
 *
 * Displays all KEKTECH assets:
 * - TECH token balance
 * - KEKTECH NFT collection
 * - KEKTV vouchers (ERC-1155)
 *
 * Reuses existing ComprehensiveDashboard component
 */
export function PortfolioTab({ address }: PortfolioTabProps) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-fredoka font-bold text-white mb-2">
          KEKTECH Portfolio
        </h2>
        <p className="text-gray-400">
          Your complete collection of TECH tokens, NFTs, and KEKTV vouchers
        </p>
      </div>

      <ComprehensiveDashboard address={address} />
    </div>
  )
}
