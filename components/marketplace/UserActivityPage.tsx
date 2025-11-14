/**
 * User Activity Page
 * Comprehensive trading hub with NFT card-based layout
 * Shows your listings, offers, and offers you can accept as visual cards
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import { useMyOfferHistory } from '@/lib/hooks/useOfferHistory'
import { useKektvListings } from '@/lib/hooks/useKektvListings'
import { useKektvOffers } from '@/lib/hooks/useKektvOffers'
import { useKektvMarketplace } from '@/lib/hooks/useKektvMarketplace'
import { useUserOffers, useOfferDetails } from '@/lib/hooks/useKektvOffers'
import { useAllVoucherMetadata } from '@/lib/hooks/useVoucherMetadata'
import { useAllReceivableOffers } from '@/lib/hooks/useAllReceivableOffers'
import { useVoucherBalance } from '@/lib/hooks/useVoucherBalance'
import { useKektvOffersApproval } from '@/lib/hooks/useKektvOffersApproval'
import { useMarketplaceListing } from '@/lib/hooks/useMarketplaceListing'
import { useActiveOfferCount } from '@/lib/hooks/useActiveOfferCount'
import { formatUnits } from 'ethers'
import type { TradingEvent } from '@/lib/services/explorer-api'
import { VOUCHER_NAMES } from '@/config/contracts/kektv-offers'

// Constants
const EXPLORER_BASE_URL = 'https://explorer.bf1337.org'

// Helper function to safely get voucher name
function getVoucherName(tokenId: number | bigint | undefined): string {
  if (tokenId === undefined) return 'Unknown Voucher'
  const id = Number(tokenId)
  if (id in VOUCHER_NAMES) {
    return VOUCHER_NAMES[id as keyof typeof VOUCHER_NAMES]
  }
  return `Voucher #${id}`
}

// Helper function to safely calculate price per item
function calculatePricePerItem(offerPrice: bigint, amount: bigint): number {
  const priceNum = Number(offerPrice)
  const amountNum = Number(amount)
  if (amountNum === 0 || !isFinite(amountNum) || amountNum < 0) return 0
  return priceNum / amountNum / 1e18
}

// Helper function to safely calculate total price
function calculateTotalPrice(offerPrice: bigint): number {
  return Number(offerPrice) / 1e18
}

export function UserActivityPage() {
  const { address, isConnected } = useAccount()
  const { data: events, isLoading, refetch: refetchHistory } = useMyOfferHistory()
  const { listings, refetch: refetchListings } = useKektvListings(address)
  const { offerIds: madeOfferIds, refetch: refetchMade } = useUserOffers(address)
  const { offerIds: receivedOfferIds, refetch: refetchReceived } = useAllReceivableOffers() // NEW: Comprehensive offer detection
  const { metadataMap } = useAllVoucherMetadata()
  const { ownedVouchers } = useVoucherBalance() // For filtering offers
  const [activeTab, setActiveTab] = useState<'accept' | 'your-offers' | 'listings'>('accept')

  // FIX: Count only ACTIVE offers (fixes "shows 2, displays 1" bug)
  const { activeCount: activeReceivedCount } = useActiveOfferCount(receivedOfferIds)
  const { activeCount: activeMadeCount } = useActiveOfferCount(madeOfferIds)

  // DEBUG: Log offer IDs to diagnose display issues
  console.log('🎯 UserActivityPage - Offer IDs:', {
    address,
    madeOfferIds: madeOfferIds.map(id => id.toString()),
    receivedOfferIds: receivedOfferIds.map(id => id.toString()),
    madeCount: madeOfferIds.length,
    receivedCount: receivedOfferIds.length,
  })

  const handleRefresh = async () => {
    await Promise.all([refetchHistory(), refetchListings(), refetchMade(), refetchReceived()])
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-2xl font-bold text-[#daa520] mb-2 font-fredoka">
          Connect Your Wallet
        </h2>
        <p className="text-gray-400">Connect your wallet to view your trading activity</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#daa520] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading your activity...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 py-6">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-4xl font-bold text-[#daa520] font-fredoka">My Trading Activity</h1>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-[#daa520] transition disabled:opacity-50"
          >
            🔄 Refresh
          </button>
        </div>
        <p className="text-gray-400">Manage your offers, listings, and view trading history</p>
      </div>

      {/* Compact Horizontal Statistics Bar - STICKY (Doubles as navigation) */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-sm border-b border-gray-700/50">
        <div className="flex items-center justify-around py-4 px-6">
          <StatBarItem
            icon="✨"
            label="Offers to Accept"
            value={activeReceivedCount}
            highlight={activeReceivedCount > 0}
            onClick={() => setActiveTab('accept')}
            isActive={activeTab === 'accept'}
          />
          <StatBarItem
            icon="💼"
            label="Your Active Offers"
            value={activeMadeCount}
            highlight={activeMadeCount > 0}
            onClick={() => setActiveTab('your-offers')}
            isActive={activeTab === 'your-offers'}
          />
          <StatBarItem
            icon="🏪"
            label="Active Listings"
            value={listings.length}
            highlight={listings.length > 0}
            onClick={() => setActiveTab('listings')}
            isActive={activeTab === 'listings'}
          />
        </div>
      </div>

      {/* Single Active Section - Conditional Rendering */}
      <div className="p-6">
        {activeTab === 'accept' && (
          <OffersYouCanAcceptSection
            offerIds={receivedOfferIds}
            onRefresh={handleRefresh}
            metadataMap={metadataMap}
            ownedVouchers={ownedVouchers}
            userAddress={address}
          />
        )}

        {activeTab === 'your-offers' && (
          <YourOffersSection
            offerIds={madeOfferIds}
            onRefresh={handleRefresh}
            metadataMap={metadataMap}
          />
        )}

        {activeTab === 'listings' && (
          <YourMarketplaceListingsSection
            listings={listings}
            onRefresh={handleRefresh}
            metadataMap={metadataMap}
          />
        )}
      </div>

      {/* Historical Activity - Moved to bottom */}
      <div className="px-6 pb-6 space-y-4 pt-6 border-t border-gray-700">
        <h2 className="text-2xl font-bold text-[#daa520] font-fredoka">📜 Activity History</h2>
        <ActivityHistory events={events || []} userAddress={address!} />
      </div>
    </div>
  )
}

/**
 * Stat Bar Item - Compact horizontal stat with click-to-navigate
 */
function StatBarItem({
  icon,
  label,
  value,
  highlight,
  onClick,
  isActive,
}: {
  icon: string
  label: string
  value: number
  highlight?: boolean
  onClick: () => void
  isActive: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-2 rounded-lg transition-all cursor-pointer ${
        isActive
          ? 'bg-[#daa520]/20 border border-[#daa520]/50'
          : 'border border-transparent hover:bg-gray-800/50'
      }`}
    >
      <span className="text-3xl">{icon}</span>
      <div className="text-left">
        <div className={`text-2xl font-bold ${highlight ? 'text-[#daa520]' : 'text-white'}`}>
          {value}
        </div>
        <div className="text-xs text-gray-400 whitespace-nowrap">{label}</div>
      </div>
    </button>
  )
}

/**
 * Offers You Can Accept Section - NFT Card Grid
 */
function OffersYouCanAcceptSection({
  offerIds,
  onRefresh,
  metadataMap,
  ownedVouchers,
  userAddress,
}: {
  offerIds: bigint[]
  onRefresh: () => void
  metadataMap: ReturnType<typeof useAllVoucherMetadata>['metadataMap']
  ownedVouchers: ReturnType<typeof useVoucherBalance>['ownedVouchers']
  userAddress: `0x${string}` | undefined
}) {
  if (offerIds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💰</div>
        <p className="text-lg text-gray-400">No offers to accept right now</p>
        <p className="text-sm text-gray-500 mt-2">Offers on your vouchers will appear here as NFT cards</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-5">
      {offerIds.map((offerId) => (
        <AcceptableOfferNFTCard
          key={offerId.toString()}
          offerId={offerId}
          onRefresh={onRefresh}
          metadataMap={metadataMap}
          ownedVouchers={ownedVouchers}
          userAddress={userAddress}
        />
      ))}
    </div>
  )
}

/**
 * Acceptable Offer NFT Card - Full voucher card with image
 * NOW WITH SMART FILTERING:
 * - Filters out offers you made yourself
 * - Filters out inactive offers
 * - Filters out general offers for tokens you don't own
 */
function AcceptableOfferNFTCard({
  offerId,
  onRefresh,
  metadataMap,
  ownedVouchers,
  userAddress,
}: {
  offerId: bigint
  onRefresh: () => void
  metadataMap: ReturnType<typeof useAllVoucherMetadata>['metadataMap']
  ownedVouchers: ReturnType<typeof useVoucherBalance>['ownedVouchers']
  userAddress: `0x${string}` | undefined
}) {
  const { offer, isLoading } = useOfferDetails(offerId)
  const { acceptOffer, rejectOffer, isPending } = useKektvOffers()
  const { cancelListing } = useKektvMarketplace()
  const {
    isApproved,
    isLoading: isCheckingApproval,
    approveOffersContract,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    refetch: refetchApproval
  } = useKektvOffersApproval()

  // Check if this token is listed on marketplace
  const { isListed, listing: _listing, refetch: refetchListing } = useMarketplaceListing(
    offer ? Number(offer.tokenId) : null
  )

  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isDelisting, setIsDelisting] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleApprove = async () => {
    try {
      await approveOffersContract()
      // Approval successful - refetch approval status to update UI
      // Wait longer for blockchain confirmation (3 blocks ~36s)
      setTimeout(() => {
        refetchApproval()
      }, 5000) // Wait 5s for blockchain confirmation
    } catch (error) {
      console.error('Failed to approve:', error)
    }
  }

  const handleAccept = async () => {
    if (!offer) return

    try {
      // Step 1: Check if token is listed on marketplace
      if (isListed) {
        console.log('🏪 Token is listed on marketplace - auto-delisting first')
        setIsDelisting(true)

        try {
          // Delist from marketplace first
          await cancelListing(offer.tokenId)
          console.log('✅ Successfully delisted from marketplace')

          // Wait for blockchain confirmation
          await new Promise(resolve => setTimeout(resolve, 3000))

          // Refetch listing status to confirm
          await refetchListing()
        } catch (delistError) {
          console.error('❌ Failed to delist:', delistError)
          throw new Error('Failed to delist from marketplace. Please try manually.')
        } finally {
          setIsDelisting(false)
        }
      }

      // Step 2: Accept the offer
      setIsAccepting(true)
      console.log('✅ Accepting offer...')
      await acceptOffer(offerId)

      if (isMountedRef.current) {
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to accept offer:', error)
    } finally {
      if (isMountedRef.current) {
        setIsAccepting(false)
        setIsDelisting(false)
      }
    }
  }

  const handleReject = async () => {
    try {
      setIsRejecting(true)
      await rejectOffer(offerId)
      if (isMountedRef.current) {
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to reject offer:', error)
    } finally {
      if (isMountedRef.current) {
        setIsRejecting(false)
      }
    }
  }

  // IMPORTANT: Check loading state FIRST before accessing offer properties
  if (isLoading || !offer) {
    return (
      <div className="bg-gradient-to-br from-[#daa520]/10 to-yellow-600/10 rounded-lg border border-[#daa520]/20 p-6">
        <div className="animate-pulse text-center text-gray-400">Loading offer...</div>
      </div>
    )
  }

  // CRITICAL: Validate ALL required offer properties exist before using them
  // The contract might return partial data in edge cases
  if (!offer.offerer || !offer.voucherOwner || offer.tokenId === undefined || offer.amount === undefined || offer.offerPrice === undefined) {
    console.log('🚫 Offer filtered: Missing properties', {
      offerId: offerId.toString(),
      hasOfferer: !!offer.offerer,
      hasVoucherOwner: !!offer.voucherOwner,
      hasTokenId: offer.tokenId !== undefined,
      hasAmount: offer.amount !== undefined,
      hasOfferPrice: offer.offerPrice !== undefined,
    })
    return null
  }

  // DEBUG: Log offer details to diagnose filtering
  console.log('🔍 Checking offer:', {
    offerId: offerId.toString(),
    tokenId: offer.tokenId.toString(),
    offerer: offer.offerer,
    voucherOwner: offer.voucherOwner,
    amount: offer.amount.toString(),
    active: offer.active,
    userAddress: userAddress,
  })

  // SIMPLIFIED filtering: Only filter out obviously wrong offers
  // Ownership validation will happen when user tries to accept
  if (userAddress) {
    // 1. Filter out offers you made yourself
    if (offer.offerer.toLowerCase() === userAddress.toLowerCase()) {
      console.log('🚫 Offer filtered: You made this offer yourself')
      return null
    }

    // 2. Filter out inactive offers
    if (!offer.active) {
      console.log('🚫 Offer filtered: Offer is inactive')
      return null
    }

    // 3. Distinguish GENERAL offers (voucherOwner = 0x0) vs TARGETED offers (voucherOwner = specific address)
    const isGeneralOffer = offer.voucherOwner === '0x0000000000000000000000000000000000000000'
    console.log('📊 Offer type check:', {
      offerId: offerId.toString(),
      tokenId: offer.tokenId.toString(),
      voucherOwner: offer.voucherOwner,
      isGeneralOffer,
      userAddress,
      ownedVouchers: ownedVouchers.map(v => ({ id: v.id, balance: v.balanceNumber })),
    })

    if (!isGeneralOffer) {
      // TARGETED OFFER - only show if it's targeted at YOU
      if (offer.voucherOwner.toLowerCase() !== userAddress.toLowerCase()) {
        console.log('🚫 Offer filtered: Targeted offer not for someone else')
        return null
      }
      // Targeted offer for you - show it (user can accept or reject)
    } else {
      // GENERAL OFFER - only show if you own enough vouchers to accept
      // General offers CANNOT be rejected by users, so don't show if insufficient balance
      const userVoucher = ownedVouchers.find(v => v.id === Number(offer.tokenId))
      const hasEnoughVouchers = userVoucher && userVoucher.balanceNumber >= Number(offer.amount)

      if (!hasEnoughVouchers) {
        console.log('🚫 Offer filtered: General offer but insufficient vouchers', {
          needed: offer.amount.toString(),
          owned: userVoucher?.balanceNumber ?? 0,
        })
        return null // Don't show general offers if user can't accept them
      }
      // General offer and user has enough - show it (user can only accept, not reject)
    }
  }

  console.log('✅ Offer PASSED filters - rendering card!')

  const metadata = metadataMap[Number(offer.tokenId)]
  const mediaUrl = metadata?.animation_url || metadata?.image
  const voucherName = metadata?.name || getVoucherName(offer.tokenId)
  const pricePerItem = calculatePricePerItem(offer.offerPrice, offer.amount)
  const totalPrice = calculateTotalPrice(offer.offerPrice)

  // Determine offer type for UI rendering
  const isGeneralOffer = offer.voucherOwner === '0x0000000000000000000000000000000000000000'

  // Check if user owns enough vouchers (defensive check, should already be filtered)
  const userVoucher = ownedVouchers.find(v => v.id === Number(offer.tokenId))
  const hasEnoughVouchers = userVoucher && userVoucher.balanceNumber >= Number(offer.amount)

  return (
    <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-lg border-2 border-green-500/30 hover:border-green-500/50 transition-all relative shadow-lg">
      {/* "You Can Accept" Badge */}
      <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg z-10">
        ✨ Accept This
      </div>

      <div className="p-6 space-y-4">
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
            <div className="text-6xl mb-2">💰</div>
          </div>
        )}

        {/* Voucher Info */}
        <div className="text-center mb-2">
          <h3 className="text-xl font-bold text-[#daa520] font-fredoka">
            {voucherName}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            #{offer.tokenId.toString()}
          </p>
        </div>

        {/* Offer Details */}
        <div className="space-y-2 text-sm bg-black/20 rounded-lg p-4">
          <div className="flex justify-between text-gray-400">
            <span>Offerer:</span>
            <span className="text-white font-mono text-xs">
              {offer.offerer.slice(0, 6)}...{offer.offerer.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Quantity:</span>
            <span className="text-white font-bold">{offer.amount.toString()}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Price/Each:</span>
            <span className="text-white font-bold">
              {pricePerItem.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BASED
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-800 pt-2 mt-2">
            <span className="font-bold text-gray-300">Total:</span>
            <span className="text-[#daa520] font-bold text-lg">
              {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BASED
            </span>
          </div>
          <div className="text-xs text-gray-500 text-center mt-2">
            💰 BASED escrowed
          </div>
        </div>

        {/* Action Buttons */}
        {!hasEnoughVouchers ? (
          /* User doesn't own enough vouchers (defensive - should be filtered out) */
          <div className="space-y-3">
            <div className="text-center bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="text-red-400 font-bold mb-1">❌ Insufficient Vouchers</div>
              <div className="text-xs text-gray-400">
                You need {offer.amount.toString()} {voucherName} but only have {userVoucher?.balanceNumber ?? 0}
              </div>
            </div>
            {/* Only show reject button for TARGETED offers (general offers can't be rejected) */}
            {!isGeneralOffer && (
              <button
                onClick={handleReject}
                disabled={isPending || isRejecting}
                className="w-full py-3 rounded-lg font-fredoka font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-red-500 to-rose-600 text-white hover:scale-105 shadow-lg shadow-red-500/30"
              >
                {isRejecting ? 'Rejecting...' : '🚫 Reject Offer'}
              </button>
            )}
            {/* General offers: Show explanation instead of reject button */}
            {isGeneralOffer && (
              <div className="text-center text-xs text-gray-500 p-2">
                ℹ️ General offers cannot be rejected. Only the offerer can cancel.
              </div>
            )}
          </div>
        ) : !isApproved && !isCheckingApproval ? (
          /* Show approval button first if not approved */
          <button
            onClick={handleApprove}
            disabled={isApprovePending || isApproveConfirming}
            className="w-full py-3 rounded-lg font-fredoka font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:scale-105 shadow-lg shadow-yellow-500/30"
          >
            {isApprovePending || isApproveConfirming ? '🔄 Approving...' : '🔓 Approve First'}
          </button>
        ) : (
          /* Show accept/reject buttons once approved */
          <div className={isGeneralOffer ? "space-y-3" : "grid grid-cols-2 gap-3"}>
            {/* Accept Button - with auto-delist support */}
            <div className={isGeneralOffer ? 'w-full' : ''}>
              {/* Show marketplace warning if listed */}
              {isListed && !isDelisting && !isAccepting && (
                <div className="mb-2 text-xs text-yellow-400 text-center p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  ⚠️ Listed on marketplace - will auto-delist first
                </div>
              )}
              <button
                onClick={handleAccept}
                disabled={isPending || isAccepting || isDelisting || isRejecting || isCheckingApproval}
                className={`w-full py-3 rounded-lg font-fredoka font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 shadow-lg shadow-green-500/30`}
              >
                {isDelisting ? '🏪 Delisting...' : isAccepting ? '✅ Accepting...' : isListed ? '🔄 Delist & Accept' : '✅ Accept'}
              </button>
            </div>

            {/* Reject Button - ONLY for targeted offers */}
            {!isGeneralOffer && (
              <button
                onClick={handleReject}
                disabled={isPending || isAccepting || isRejecting || isCheckingApproval}
                className="py-3 rounded-lg font-fredoka font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30"
              >
                {isRejecting ? 'Rejecting...' : '🚫 Reject'}
              </button>
            )}

            {/* General offers: Show info message */}
            {isGeneralOffer && (
              <div className="text-center text-xs text-gray-500 p-2">
                ℹ️ General offers cannot be rejected
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Your Offers Section - NFT Card Grid
 */
function YourOffersSection({
  offerIds,
  onRefresh,
  metadataMap,
}: {
  offerIds: bigint[]
  onRefresh: () => void
  metadataMap: ReturnType<typeof useAllVoucherMetadata>['metadataMap']
}) {
  if (offerIds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💼</div>
        <p className="text-lg text-gray-400">You haven&apos;t created any offers yet</p>
        <p className="text-sm text-gray-500 mt-2">Browse All Offers and make an offer to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-5">
      {offerIds.map((offerId) => (
        <YourOfferNFTCard
          key={offerId.toString()}
          offerId={offerId}
          onRefresh={onRefresh}
          metadataMap={metadataMap}
        />
      ))}
    </div>
  )
}

/**
 * Your Offer NFT Card - Full voucher card with image
 */
function YourOfferNFTCard({
  offerId,
  onRefresh,
  metadataMap,
}: {
  offerId: bigint
  onRefresh: () => void
  metadataMap: ReturnType<typeof useAllVoucherMetadata>['metadataMap']
}) {
  const { offer, isLoading } = useOfferDetails(offerId)
  const { cancelOffer, isPending } = useKektvOffers()
  const [isCancelling, setIsCancelling] = useState(false)
  const isMountedRef = useRef(true)

  console.log('💼 YourOfferNFTCard rendering:', {
    offerId: offerId.toString(),
    isLoading,
    hasOffer: !!offer,
  })

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleCancel = async () => {
    try {
      setIsCancelling(true)
      await cancelOffer(offerId)
      if (isMountedRef.current) {
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to cancel offer:', error)
    } finally {
      if (isMountedRef.current) {
        setIsCancelling(false)
      }
    }
  }

  if (isLoading || !offer) {
    console.log('💼 YourOfferNFTCard: Still loading or no offer data')
    return (
      <div className="bg-gradient-to-br from-[#daa520]/10 to-yellow-600/10 rounded-lg border border-[#daa520]/20 p-6">
        <div className="animate-pulse text-center text-gray-400">Loading offer...</div>
      </div>
    )
  }

  // CRITICAL: Validate ALL required offer properties exist
  if (!offer.offerer || !offer.voucherOwner || offer.tokenId === undefined || offer.amount === undefined || offer.offerPrice === undefined) {
    console.log('💼 YourOfferNFTCard: Missing properties - filtering out', {
      hasOfferer: !!offer.offerer,
      hasVoucherOwner: !!offer.voucherOwner,
      hasTokenId: offer.tokenId !== undefined,
      hasAmount: offer.amount !== undefined,
      hasOfferPrice: offer.offerPrice !== undefined,
    })
    return null
  }

  console.log('💼 YourOfferNFTCard: Rendering card for offer', {
    offerId: offerId.toString(),
    tokenId: offer.tokenId.toString(),
    amount: offer.amount.toString(),
    active: offer.active,
  })

  // CRITICAL: Filter out inactive (cancelled/accepted/rejected) offers
  if (!offer.active) {
    console.log('💼 YourOfferNFTCard: Filtering out inactive offer', {
      offerId: offerId.toString(),
      active: offer.active,
    })
    return null
  }

  const metadata = metadataMap[Number(offer.tokenId)]
  const mediaUrl = metadata?.animation_url || metadata?.image
  const voucherName = metadata?.name || getVoucherName(offer.tokenId)
  const pricePerItem = calculatePricePerItem(offer.offerPrice, offer.amount)
  const totalPrice = calculateTotalPrice(offer.offerPrice)

  return (
    <div className="bg-gradient-to-br from-[#daa520]/10 to-yellow-600/10 rounded-lg border border-[#daa520]/20 hover:border-[#daa520]/40 transition-all shadow-md">
      <div className="p-6 space-y-4">
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
            <div className="text-6xl mb-2">💼</div>
          </div>
        )}

        {/* Voucher Info */}
        <div className="text-center mb-2">
          <h3 className="text-xl font-bold text-[#daa520] font-fredoka">
            {voucherName}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            #{offer.tokenId.toString()}
          </p>
        </div>

        {/* Offer Details */}
        <div className="space-y-2 text-sm bg-black/20 rounded-lg p-4">
          <div className="flex justify-between text-gray-400">
            <span>To:</span>
            <span className="text-white font-mono text-xs">
              {offer.voucherOwner === '0x0000000000000000000000000000000000000000'
                ? 'Anyone'
                : `${offer.voucherOwner.slice(0, 6)}...${offer.voucherOwner.slice(-4)}`
              }
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Quantity:</span>
            <span className="text-white font-bold">{offer.amount.toString()}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Price/Each:</span>
            <span className="text-white font-bold">
              {pricePerItem.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BASED
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-800 pt-2 mt-2">
            <span className="font-bold text-gray-300">Total:</span>
            <span className="text-[#daa520] font-bold text-lg">
              {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BASED
            </span>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          disabled={isPending || isCancelling}
          className="w-full py-3 rounded-lg font-fredoka font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30"
        >
          {isPending || isCancelling ? 'Cancelling...' : '❌ Cancel Offer'}
        </button>
      </div>
    </div>
  )
}

/**
 * Your Marketplace Listings Section - NFT Card Grid
 */
function YourMarketplaceListingsSection({
  listings,
  onRefresh,
  metadataMap,
}: {
  listings: ReturnType<typeof useKektvListings>['listings']
  onRefresh: () => void
  metadataMap: ReturnType<typeof useAllVoucherMetadata>['metadataMap']
}) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏪</div>
        <p className="text-lg text-gray-400">You don&apos;t have any active listings</p>
        <p className="text-sm text-gray-500 mt-2">List your vouchers for sale to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-5">
      {listings.map((listing) => (
        <MarketplaceListingNFTCard
          key={`${listing.seller}-${listing.tokenId}`}
          listing={listing}
          onRefresh={onRefresh}
          metadataMap={metadataMap}
        />
      ))}
    </div>
  )
}

/**
 * Marketplace Listing NFT Card - Full voucher card with image
 */
function MarketplaceListingNFTCard({
  listing,
  onRefresh,
  metadataMap,
}: {
  listing: ReturnType<typeof useKektvListings>['listings'][0]
  onRefresh: () => void
  metadataMap: ReturnType<typeof useAllVoucherMetadata>['metadataMap']
}) {
  const { cancelListing, isPending } = useKektvMarketplace()
  const [isCancelling, setIsCancelling] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleCancel = async () => {
    try {
      setIsCancelling(true)
      await cancelListing(BigInt(listing.tokenId))
      if (isMountedRef.current) {
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to cancel listing:', error)
    } finally {
      if (isMountedRef.current) {
        setIsCancelling(false)
      }
    }
  }

  // CRITICAL: Validate ALL required listing properties exist
  if (listing.tokenId === undefined || listing.amount === undefined || listing.pricePerItem === undefined || listing.totalPrice === undefined) {
    return null
  }

  const metadata = metadataMap[Number(listing.tokenId)]
  const mediaUrl = metadata?.animation_url || metadata?.image
  const voucherName = metadata?.name || getVoucherName(listing.tokenId)
  const pricePerItem = Number(listing.pricePerItem) / 1e18
  const totalPrice = Number(listing.totalPrice) / 1e18

  return (
    <div className="bg-gradient-to-br from-[#daa520]/10 to-yellow-600/10 rounded-lg border border-[#daa520]/20 hover:border-[#daa520]/40 transition-all shadow-md">
      <div className="p-6 space-y-4">
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
            <div className="text-6xl mb-2">🏪</div>
          </div>
        )}

        {/* Voucher Info */}
        <div className="text-center mb-2">
          <h3 className="text-xl font-bold text-[#daa520] font-fredoka">
            {voucherName}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            #{listing.tokenId.toString()}
          </p>
        </div>

        {/* Listing Details */}
        <div className="space-y-2 text-sm bg-black/20 rounded-lg p-4">
          <div className="flex justify-between text-gray-400">
            <span>Quantity:</span>
            <span className="text-white font-bold">{listing.amount.toString()} vouchers</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Price/Each:</span>
            <span className="text-white font-bold">
              {pricePerItem.toLocaleString()} BASED
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-800 pt-2 mt-2">
            <span className="font-bold text-gray-300">Total Value:</span>
            <span className="text-[#daa520] font-bold text-lg">
              {totalPrice.toLocaleString()} BASED
            </span>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          disabled={isPending || isCancelling}
          className="w-full py-3 rounded-lg font-fredoka font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30"
        >
          {isPending || isCancelling ? 'Cancelling...' : '❌ Cancel Listing'}
        </button>
      </div>
    </div>
  )
}

/**
 * Activity History Section
 */
function ActivityHistory({
  events,
  userAddress,
}: {
  events: TradingEvent[]
  userAddress: string
}) {
  if (events.length === 0) {
    return (
      <div className="bg-gray-900/60 rounded-lg border border-gray-700/50 p-8 text-center">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-xl font-fredoka text-gray-400 mb-2">No activity yet</p>
        <p className="text-sm text-gray-500">Your trading history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((event, i) => (
        <ActivityCard
          key={`${event.transactionHash}-${i}`}
          event={event}
          userAddress={userAddress}
        />
      ))}
    </div>
  )
}

/**
 * Activity card (historical event)
 */
function ActivityCard({
  event,
  userAddress,
}: {
  event: TradingEvent
  userAddress: string
}) {
  const normalizedAddress = userAddress.toLowerCase()
  const isOfferer = 'offerer' in event && event.offerer.toLowerCase() === normalizedAddress
  const isOwner = 'voucherOwner' in event && event.voucherOwner.toLowerCase() === normalizedAddress
  const isSeller = 'seller' in event && event.seller.toLowerCase() === normalizedAddress
  const isBuyer = 'buyer' in event && event.buyer.toLowerCase() === normalizedAddress

  return (
    <div className="bg-gray-900/60 rounded-lg border border-gray-700/50 p-6 hover:border-gray-600/50 transition">
      {/* Header Row: Icon, Title, Date, TX Link */}
      <div className="flex items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getEventIcon(event.eventType)}</span>
          <div>
            <p className="text-base font-bold text-[#daa520]">
              {getEventLabel(event.eventType, isOfferer, isOwner, isSeller, isBuyer)}
            </p>
            <p className="text-sm text-gray-500">{formatDate(event.timestamp)}</p>
          </div>
        </div>

        {/* Transaction link */}
        <a
          href={`${EXPLORER_BASE_URL}/tx/${event.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 px-4 py-2 bg-[#daa520]/10 border border-[#daa520]/30 rounded-lg text-sm text-[#daa520] hover:bg-[#daa520]/20 hover:border-[#daa520]/50 transition font-fredoka font-bold"
        >
          View TX →
        </a>
      </div>

      {/* Details Grid: Horizontal Layout */}
      <div className="flex items-center gap-6 flex-wrap">
        {'tokenId' in event && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">NFT:</span>
            <span className="text-sm font-bold text-white">𝕂Ǝ𝕂TV #{event.tokenId}</span>
          </div>
        )}

        {'offerPrice' in event && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Price:</span>
            <span className="text-base font-bold text-[#daa520]">
              {formatUnits(event.offerPrice, 18)} BASED
            </span>
          </div>
        )}

        {'totalPrice' in event && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Total:</span>
            <span className="text-base font-bold text-[#daa520]">
              {formatUnits(event.totalPrice, 18)} BASED
            </span>
          </div>
        )}

        {'amount' in event && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Amount:</span>
            <span className="text-sm font-bold text-white">{event.amount} vouchers</span>
          </div>
        )}

        {/* Role badges */}
        {isOfferer && (
          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            You offered
          </span>
        )}
        {isOwner && (
          <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
            Your voucher
          </span>
        )}
        {isSeller && (
          <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            You sold
          </span>
        )}
        {isBuyer && (
          <span className="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
            You bought
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Helper functions
 */
function getEventIcon(eventType: TradingEvent['eventType']): string {
  switch (eventType) {
    case 'OfferMade':
      return '💰'
    case 'OfferAccepted':
      return '✅'
    case 'OfferCancelled':
      return '❌'
    case 'OfferRejected':
      return '🚫'
    case 'VoucherSold':
      return '💸'
    case 'VoucherListed':
      return '🏪'
    case 'ListingCancelled':
      return '🚫'
  }
}

function getEventLabel(
  eventType: TradingEvent['eventType'],
  isOfferer: boolean,
  isOwner: boolean,
  isSeller: boolean,
  isBuyer: boolean
): string {
  switch (eventType) {
    case 'OfferMade':
      if (isOfferer) return 'You made an offer'
      if (isOwner) return 'Received an offer'
      return 'Offer made'

    case 'OfferAccepted':
      if (isOfferer) return 'Your offer was accepted!'
      if (isOwner) return 'You accepted an offer'
      return 'Offer accepted'

    case 'OfferCancelled':
      if (isOfferer) return 'You cancelled your offer'
      if (isOwner) return 'Offer was cancelled'
      return 'Offer cancelled'

    case 'OfferRejected':
      if (isOfferer) return 'Your offer was rejected'
      if (isOwner) return 'You rejected an offer'
      return 'Offer rejected'

    case 'VoucherSold':
      if (isSeller) return 'You sold vouchers'
      if (isBuyer) return 'You bought vouchers'
      return 'Voucher sold'

    case 'VoucherListed':
      if (isSeller) return 'You listed vouchers'
      return 'Voucher listed'

    case 'ListingCancelled':
      if (isSeller) return 'You cancelled your listing'
      return 'Listing cancelled'
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

  return date.toLocaleDateString()
}
