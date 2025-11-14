'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import { useUserOffers, useOfferDetails, useKektvOffers, useTokenOffers } from '@/lib/hooks/useKektvOffers'
import { useUserVoucherBalances, useKektvListings } from '@/lib/hooks/useKektvListings'
import { useKektvMarketplace } from '@/lib/hooks/useKektvMarketplace'
import { useAllVoucherMetadata } from '@/lib/hooks/useVoucherMetadata'
import { OfferCard } from './OfferCard'
import { VOUCHER_IDS } from '@/config/contracts/kektv-offers'

/**
 * My Activity - Comprehensive view of user's offer activity
 *
 * Shows three sections:
 * 1. Offers You Can Accept - offers where user has sufficient vouchers
 * 2. Your Offers - offers user has created
 * 3. Your Marketplace Listings - vouchers user has listed for sale
 */
export function YourOffers() {
  const { address } = useAccount()
  const { vouchers: userVouchers } = useUserVoucherBalances()

  // User's created offers
  const { offerIds: createdOfferIds, isLoading: createdLoading, refetch: refetchCreated } = useUserOffers(address)
  const { cancelOffer, isPending } = useKektvOffers()

  // User's marketplace listings
  const { listings, isLoading: listingsLoading, refetch: refetchListings } = useKektvListings(address)

  // Fetch offers from all voucher types to find actionable ones
  const { offerIds: silverOffers } = useTokenOffers(VOUCHER_IDS.SILVER)
  const { offerIds: goldOffers } = useTokenOffers(VOUCHER_IDS.GOLD)
  const { offerIds: platinumOffers } = useTokenOffers(VOUCHER_IDS.PLATINUM)

  const allOfferIds = [...silverOffers, ...goldOffers, ...platinumOffers]

  if (!address) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-fredoka text-gray-400">
          Connect your wallet to view your activity
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Offers You Can Accept */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-[#daa520] font-fredoka">
            ✨ Offers You Can Accept
          </h2>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          These offers match your voucher holdings. Accept them to trade your vouchers for BASED.
        </p>
        <ActionableOffers
          allOfferIds={allOfferIds}
          userVouchers={userVouchers}
          userAddress={address}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800"></div>

      {/* Section 2: Your Created Offers */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#daa520] font-fredoka">
            💼 Your Offers
          </h2>
          <button
            onClick={() => refetchCreated()}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-[#daa520] transition"
          >
            🔄 Refresh
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          Offers you&apos;ve created on other users&apos; vouchers.
        </p>

        {createdLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#daa520] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your offers...</p>
          </div>
        ) : !createdOfferIds || createdOfferIds.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
            <p className="text-gray-400 mb-2">
              You haven&apos;t created any offers yet
            </p>
            <p className="text-sm text-gray-500">
              Browse All Offers and make an offer to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {createdOfferIds.map((offerId) => (
              <YourOfferCard
                key={offerId.toString()}
                offerId={offerId}
                onSuccess={refetchCreated}
                cancelOffer={cancelOffer}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800"></div>

      {/* Section 3: Your Marketplace Listings */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#daa520] font-fredoka">
            🏪 Your Marketplace Listings
          </h2>
          <button
            onClick={() => refetchListings()}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-[#daa520] transition"
          >
            🔄 Refresh
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          Vouchers you&apos;ve listed for sale on the marketplace.
        </p>

        <MarketplaceListingsSection
          listings={listings}
          isLoading={listingsLoading}
          onSuccess={refetchListings}
        />
      </div>
    </div>
  )
}

/**
 * Section showing offers user can accept based on their holdings
 */
function ActionableOffers({
  allOfferIds,
  userVouchers,
  userAddress
}: {
  allOfferIds: bigint[]
  userVouchers: Array<{ id: number; balance: bigint }>
  userAddress: `0x${string}`
}) {
  const [actionableCount, setActionableCount] = useState(0)

  if (allOfferIds.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
        <p className="text-gray-400">
          No offers available at the moment
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {actionableCount > 0 && (
        <p className="text-sm text-green-400">
          Found {actionableCount} {actionableCount === 1 ? 'offer' : 'offers'} you can accept
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allOfferIds.map((offerId) => (
          <ActionableOfferCard
            key={offerId.toString()}
            offerId={offerId}
            userVouchers={userVouchers}
            userAddress={userAddress}
            onActionableChange={(isActionable) => {
              if (isActionable) setActionableCount(prev => prev + 1)
            }}
          />
        ))}
      </div>

      {actionableCount === 0 && allOfferIds.length > 0 && (
        <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
          <p className="text-gray-400 mb-2">
            No offers match your holdings
          </p>
          <p className="text-sm text-gray-500">
            You don&apos;t have enough vouchers to accept any current offers
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Individual actionable offer card
 */
function ActionableOfferCard({
  offerId,
  userVouchers,
  userAddress,
  onActionableChange
}: {
  offerId: bigint
  userVouchers: Array<{ id: number; balance: bigint }>
  userAddress: `0x${string}`
  onActionableChange: (isActionable: boolean) => void
}) {
  const { offer, isLoading } = useOfferDetails(offerId)
  const [hasNotified, setHasNotified] = useState(false)

  // Calculate if user can accept this offer
  const userBalance = offer
    ? userVouchers.find(v => v.id === Number(offer.tokenId))?.balance || 0n
    : 0n
  const canAccept = offer && userBalance >= offer.amount

  // Check if this is user's own offer
  const isOwnOffer = offer && offer.offerer.toLowerCase() === userAddress.toLowerCase()

  // Notify parent if actionable (only once)
  if (!isLoading && offer && offer.active && canAccept && !isOwnOffer && !hasNotified) {
    onActionableChange(true)
    setHasNotified(true)
  }

  // Don't show if loading, inactive, can't accept, or is own offer
  if (isLoading || !offer || !offer.active || !canAccept || isOwnOffer) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-green-500/5 to-emerald-600/5 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-all">
      <OfferCard offer={offer} onSuccess={() => {}} canAccept={canAccept} />
    </div>
  )
}

/**
 * Individual offer card with cancel button
 */
function YourOfferCard({
  offerId,
  onSuccess,
  cancelOffer,
  isPending,
}: {
  offerId: bigint
  onSuccess: () => void
  cancelOffer: (offerId: bigint) => Promise<`0x${string}`>
  isPending: boolean
}) {
  const { offer, isLoading } = useOfferDetails(offerId)

  const handleCancel = async () => {
    try {
      await cancelOffer(offerId)

      // Wait for blockchain to update before refetching
      setTimeout(() => {
        onSuccess()
        alert('Offer cancelled successfully! BASED refunded to your wallet.')
      }, 3000) // Wait 3 seconds for blockchain confirmation
    } catch (error) {
      alert(`Cancel failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (isLoading || !offer) {
    return (
      <div className="bg-gray-900/60 rounded-lg border border-gray-700/50 p-6 animate-pulse">
        <div className="h-32 bg-gray-800 rounded"></div>
      </div>
    )
  }

  // ✅ Filter out cancelled offers (active: false)
  if (!offer.active) {
    return null
  }

  return (
    <div className="bg-gray-900/60 rounded-xl border border-gray-700/50 p-6 hover:border-[#daa520]/50 transition">
      <OfferCard offer={offer} onSuccess={onSuccess} />

      {/* Cancel Button */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="w-full px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 font-fredoka font-semibold hover:bg-red-500/20 hover:border-red-500/50 transition disabled:opacity-50"
        >
          {isPending ? '⏳ Cancelling...' : '❌ Cancel Offer'}
        </button>
      </div>
    </div>
  )
}

/**
 * Section showing user's marketplace listings
 */
function MarketplaceListingsSection({
  listings,
  isLoading,
  onSuccess,
}: {
  listings: ReturnType<typeof useKektvListings>['listings']
  isLoading: boolean
  onSuccess: () => void
}) {
  const marketplace = useKektvMarketplace()
  const { metadataMap } = useAllVoucherMetadata()

  const handleCancel = async (tokenId: number) => {
    try {
      await marketplace.cancelListing(BigInt(tokenId))
      alert('Listing cancelled successfully!')
      setTimeout(() => {
        onSuccess()
      }, 3000)
    } catch (error) {
      alert(`Cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#daa520] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading your listings...</p>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
        <p className="text-gray-400 mb-2">
          You haven&apos;t listed any vouchers for sale yet
        </p>
        <p className="text-sm text-gray-500">
          Go to the &ldquo;List for Sale&rdquo; tab to create your first listing
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map((listing) => {
        const metadata = metadataMap[listing.tokenId]
        const mediaUrl = metadata?.animation_url || metadata?.image

        return (
          <div
            key={`${listing.seller}-${listing.tokenId}`}
            className="bg-gray-900/60 rounded-xl border border-gray-700/50 p-6 hover:border-[#daa520]/50 transition"
          >
            {/* Voucher Media */}
            {mediaUrl ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-black/20 mb-4">
                <Image
                  src={mediaUrl}
                  alt={metadata?.name || listing.voucherName}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">{listing.voucherIcon}</div>
              </div>
            )}

            {/* Listing Info */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-[#daa520] font-fredoka">
                {metadata?.name || listing.voucherName}
              </h3>
            </div>

            {/* Listing Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Quantity:</span>
                <span className="text-white font-bold">{listing.amount.toString()}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Price/Each:</span>
                <span className="text-white font-bold">
                  {(Number(listing.pricePerItem) / 1e18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BASED
                </span>
              </div>
              <div className="flex justify-between text-gray-400 border-t border-gray-800 pt-2 mt-2">
                <span className="font-bold">Total:</span>
                <span className="text-[#daa520] font-bold text-lg">
                  {(Number(listing.totalPrice) / 1e18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BASED
                </span>
              </div>
            </div>

            {/* Cancel Button */}
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <button
                onClick={() => handleCancel(listing.tokenId)}
                disabled={marketplace.isPending}
                className="w-full px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 font-fredoka font-semibold hover:bg-red-500/20 hover:border-red-500/50 transition disabled:opacity-50"
              >
                {marketplace.isPending ? '⏳ Cancelling...' : '❌ Cancel Listing'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
