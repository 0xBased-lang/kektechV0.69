'use client'
import { useAccount } from 'wagmi'
import { useReceivedOffers, useOfferDetails } from '@/lib/hooks/useKektvOffers'
import { OfferCard } from './OfferCard'

/**
 * Display offers you've received on your vouchers
 * Allows you to accept or reject offers
 */
export function ReceivedOffers() {
  const { address } = useAccount()
  const { offerIds, isLoading, refetch } = useReceivedOffers(address)

  if (!address) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-fredoka text-gray-400">
          Connect your wallet to view received offers
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#daa520] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading received offers...</p>
      </div>
    )
  }

  if (!offerIds || offerIds.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 mb-6">
          <svg
            className="w-full h-full text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <p className="text-xl font-fredoka text-gray-400 mb-2">
          No offers received yet
        </p>
        <p className="text-sm text-gray-500">
          When someone makes an offer on your vouchers, they&apos;ll appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-[#daa520] font-fredoka">
          Received Offers ({offerIds.length})
        </h3>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-[#daa520] transition"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offerIds.map((offerId) => (
          <ReceivedOfferCard
            key={offerId.toString()}
            offerId={offerId}
            onSuccess={refetch}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual received offer card
 */
function ReceivedOfferCard({
  offerId,
  onSuccess,
}: {
  offerId: bigint
  onSuccess: () => void
}) {
  const { offer, isLoading } = useOfferDetails(offerId)

  if (isLoading || !offer) {
    return (
      <div className="bg-gray-900/60 rounded-lg border border-gray-700/50 p-6 animate-pulse">
        <div className="h-32 bg-gray-800 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/60 rounded-xl border border-gray-700/50 p-6 hover:border-[#daa520]/50 transition">
      <OfferCard offer={offer} onSuccess={onSuccess} />
    </div>
  )
}
