'use client'

import { useReadContract } from 'wagmi'
import { KEKTECH_MAIN, KEKTECH_MAIN_ABI } from '@/config/contracts'

/**
 * LiveSupplyCounter Component
 * 
 * Displays real-time NFT supply data from the smart contract:
 * - Current minted count
 * - Remaining supply
 * - Progress bar with percentage
 * - Auto-updates when new NFTs are minted
 */
export function LiveSupplyCounter() {
  const { data: totalSupply, isLoading: supplyLoading } = useReadContract({
    address: KEKTECH_MAIN.address,
    abi: KEKTECH_MAIN_ABI,
    functionName: 'totalSupply',
    query: {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  })

  const { data: maxSupply, isLoading: maxLoading } = useReadContract({
    address: KEKTECH_MAIN.address,
    abi: KEKTECH_MAIN_ABI,
    functionName: 'MAX_SUPPLY',
  })

  if (supplyLoading || maxLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-kek-green/20 animate-pulse">
        <div className="h-6 bg-gray-800 rounded mb-4 w-1/2"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-800 rounded w-2/3"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
        </div>
        <div className="mt-4 h-2 bg-gray-800 rounded"></div>
      </div>
    )
  }

  const current = Number(totalSupply || 0)
  const max = Number(maxSupply || 4200)
  const remaining = max - current
  const percentage = max > 0 ? (current / max) * 100 : 0

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-kek-green/20 hover:border-kek-green/40 transition-all duration-300">
      <h3 className="text-xl font-bold text-kek-green mb-4 flex items-center">
        <span className="mr-2">📊</span>
        Collection Status
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Minted:</span>
          <span className="text-kek-green font-bold text-lg">
            {current.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Remaining:</span>
          <span className="text-kek-purple font-bold text-lg">
            {remaining.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Total Supply:</span>
          <span className="text-kek-cyan font-bold text-lg">
            {max.toLocaleString()}
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progress</span>
          <span>{percentage.toFixed(1)}% minted</span>
        </div>
        <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-kek-green via-kek-cyan to-kek-purple h-3 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-kek-green/30"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-4 text-center">
        {remaining > 0 ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-kek-green/20 text-kek-green border border-kek-green/30">
            <span className="w-2 h-2 bg-kek-green rounded-full mr-2 animate-pulse"></span>
            Minting Active
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            Sold Out
          </span>
        )}
      </div>
    </div>
  )
}
