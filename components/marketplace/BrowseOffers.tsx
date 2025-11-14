'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { useTokenOffers, useOfferDetails } from '@/lib/hooks/useKektvOffers'
import { useAllVoucherMetadata } from '@/lib/hooks/useVoucherMetadata'
import { useVoucherHolders } from '@/lib/hooks/useVoucherHolders'
import { useUserVoucherBalances } from '@/lib/hooks/useKektvListings'
import { OfferCard } from './OfferCard'
import { VOUCHER_IDS } from '@/config/contracts/kektv-offers'

// Only show voucher IDs 1, 2, and 3 (exclude 0)
const VOUCHER_OPTIONS = [
  { id: VOUCHER_IDS.SILVER, fallbackIcon: '🥈', color: 'gray' },
  { id: VOUCHER_IDS.GOLD, fallbackIcon: '🥇', color: 'gray' },
  { id: VOUCHER_IDS.PLATINUM, fallbackIcon: '💠', color: 'gray' },
]

/**
 * Browse all active offers on KEKTV vouchers
 */
export function BrowseOffers() {
  const [selectedToken, setSelectedToken] = useState<number | null>(null)
  const { metadataMap } = useAllVoucherMetadata()
  const { vouchers: userVouchers } = useUserVoucherBalances()

  // If a token is selected, fetch its offers
  const { offerIds, isLoading, refetch } = useTokenOffers(selectedToken)

  // Fetch live holder data for selected token
  const { holders, totalSupply, holderCount, isLoading: holdersLoading} = useVoucherHolders(selectedToken)

  // Calculate actionable offers (offers user can accept based on holdings)
  // Memoized to avoid repeated find() operations on every render
  const userBalance = useMemo(() =>
    selectedToken !== null ?
      userVouchers.find(v => v.id === selectedToken)?.balance || 0n
      : 0n,
    [selectedToken, userVouchers]
  )

  return (
    <div className="space-y-8">
      {/* Voucher Type Selector */}
      <div>
        <h3 className="text-xl font-bold text-[#daa520] mb-4 font-fredoka text-center">
          Select Voucher Type
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {VOUCHER_OPTIONS.map((voucher) => {
            const metadata = metadataMap[voucher.id]
            const mediaUrl = metadata?.animation_url || metadata?.image
            const voucherName = metadata?.name || voucher.fallbackIcon
            const isSelected = selectedToken === voucher.id

            return (
              <button
                key={voucher.id}
                onClick={() => setSelectedToken(voucher.id)}
                className={`
                  bg-gradient-to-br from-[#daa520]/10 to-yellow-600/10 rounded-lg border overflow-hidden transition-all
                  ${isSelected
                    ? 'border-[#daa520] ring-2 ring-[#daa520]/50 shadow-lg shadow-[#daa520]/20'
                    : 'border-[#daa520]/20 hover:border-[#daa520]/40'
                  }
                `}
              >
                <div className="p-6">
                  {/* Voucher Media */}
                  {mediaUrl ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-black/20 mb-4">
                      <Image
                        src={mediaUrl}
                        alt={voucherName}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-2">{voucher.fallbackIcon}</div>
                    </div>
                  )}

                  {/* Voucher Name */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-[#daa520] font-fredoka">
                      {voucherName}
                    </h3>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Holder Information (when token selected) */}
      {selectedToken !== null && (
        <div className="bg-gray-900/60 rounded-lg border border-[#daa520]/20 p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#daa520] font-fredoka">
              Current Holders
            </h3>
            {!holdersLoading && (
              <div className="text-sm text-gray-400">
                {holderCount} holders • {totalSupply.toString()} total vouchers
              </div>
            )}
          </div>

          {holdersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#daa520] mx-auto mb-2"></div>
              <p className="text-xs text-gray-500">Loading holder data...</p>
            </div>
          ) : holders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No holders found for this voucher type
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-4">
                💡 General offers can be accepted by any holder listed below (first come, first served)
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {holders.map((holder, index) => (
                  <div
                    key={holder.address}
                    className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-500 font-mono">#{index + 1}</div>
                      <div className="font-mono text-sm text-gray-300">
                        {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#daa520]">
                      {holder.balance.toString()}× vouchers
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Offers Display */}
      {selectedToken === null ? (
        <div className="text-center py-24">
          <div className="text-8xl mb-6">👆</div>
          <h3 className="text-2xl font-bold text-[#daa520] mb-4 font-fredoka">Select a Voucher Type</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Choose a voucher type above to see all active offers
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-[#daa520] mb-6 font-fredoka text-center">
            Loading Offers...
          </h3>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Skeleton Loaders - 3 cards */}
            {[1, 2, 3].map((i) => (
              <OfferCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : offerIds.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-8xl mb-6">💼</div>
          <h3 className="text-2xl font-bold text-[#daa520] mb-4 font-fredoka">No Active Offers</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            No one has made offers on this voucher type yet. Be the first!
          </p>
        </div>
      ) : (
        <OffersList
          offerIds={offerIds}
          onSuccess={refetch}
          userBalance={userBalance}
        />
      )}
    </div>
  )
}

/**
 * Display list of offers given their IDs
 */
function OffersList({
  offerIds,
  onSuccess,
  userBalance,
}: {
  offerIds: bigint[]
  onSuccess: () => void
  userBalance: bigint
}) {
  const [activeOfferCount, setActiveOfferCount] = useState(0)

  // Reset counter when offer list changes
  useEffect(() => {
    setActiveOfferCount(0)
  }, [offerIds])

  return (
    <div>
      {activeOfferCount > 0 && (
        <h3 className="text-xl font-bold text-[#daa520] mb-6 font-fredoka text-center">
          Active Offers ({activeOfferCount})
        </h3>
      )}
      <div className={`grid gap-6 ${
        activeOfferCount === 1 ? 'grid-cols-1 max-w-md mx-auto' :
        activeOfferCount === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto' :
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {offerIds.map((offerId) => (
          <OfferItem
            key={offerId.toString()}
            offerId={offerId}
            onSuccess={onSuccess}
            userBalance={userBalance}
            onActiveChange={(isActive) => {
              if (isActive) setActiveOfferCount(prev => prev + 1)
            }}
          />
        ))}
      </div>

      {/* Empty State - All offers inactive */}
      {offerIds.length > 0 && activeOfferCount === 0 && (
        <div className="text-center py-16">
          <div className="text-7xl mb-4">⏳</div>
          <h3 className="text-2xl font-bold text-[#daa520] mb-3 font-fredoka">
            All Offers Inactive
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            All offers for this voucher have been accepted, cancelled, or expired.
            Check back later for new offers!
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Individual offer item that fetches and displays offer details
 */
function OfferItem({
  offerId,
  onSuccess,
  userBalance,
  onActiveChange,
}: {
  offerId: bigint
  onSuccess: () => void
  userBalance: bigint
  onActiveChange?: (isActive: boolean) => void
}) {
  const { offer, isLoading } = useOfferDetails(offerId)
  const hasNotified = useRef(false)

  // Check if user can accept this offer
  const canAccept = offer && userBalance >= offer.amount

  // Notify parent when we know if this offer is active (only once)
  useEffect(() => {
    if (!isLoading && offer && offer.active && onActiveChange && !hasNotified.current) {
      onActiveChange(true)
      hasNotified.current = true
    }
  }, [isLoading, offer, onActiveChange])

  if (isLoading || !offer || !offer.active) {
    return null // Don't show inactive or loading offers
  }

  return <OfferCard offer={offer} onSuccess={onSuccess} canAccept={canAccept} />
}

/**
 * Skeleton loader that matches OfferCard layout
 * Provides visual feedback during offer data fetching
 */
function OfferCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-[#daa520]/10 to-yellow-600/10 rounded-lg border border-[#daa520]/20 animate-pulse">
      <div className="p-6 space-y-4">
        {/* Media Skeleton */}
        <div className="relative w-full h-48 rounded-lg bg-gray-800/50" />

        {/* Title Skeleton */}
        <div className="text-center">
          <div className="h-6 bg-gray-800/50 rounded w-2/3 mx-auto" />
        </div>

        {/* Details Skeleton */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-800/50 rounded w-20" />
            <div className="h-4 bg-gray-800/50 rounded w-24" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-800/50 rounded w-20" />
            <div className="h-4 bg-gray-800/50 rounded w-16" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-800/50 rounded w-24" />
            <div className="h-4 bg-gray-800/50 rounded w-20" />
          </div>
          <div className="flex justify-between border-t border-gray-800 pt-2 mt-2">
            <div className="h-4 bg-gray-800/50 rounded w-16" />
            <div className="h-5 bg-gray-800/50 rounded w-24" />
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="mt-4 h-12 bg-gray-800/50 rounded-lg" />
      </div>
    </div>
  )
}
