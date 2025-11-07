'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import Image from 'next/image'
import { useKektvMarketplace } from '@/lib/hooks/useKektvMarketplace'
import { useMarketplaceListingsAPI as useKektvListings } from '@/lib/hooks/useMarketplaceListingsAPI'
import { useUserVoucherBalances } from '@/lib/hooks/useKektvListings'
import { useKektvApproval } from '@/lib/hooks/useKektvApproval'
import { useAllVoucherMetadata, useVoucherMetadata } from '@/lib/hooks/useVoucherMetadata'
import { OffersView } from './OffersView'
import { UserActivityPage } from './UserActivityPage'

/**
 * KEKTV Marketplace Tab
 *
 * Complete marketplace for KEKTV vouchers (ERC-1155):
 * - Browse and buy listings
 * - List your own vouchers for sale
 * - Make and receive offers on vouchers
 * - Cancel your listings
 */
export function TradeTab() {
  const [view, setView] = useState<'browse' | 'list' | 'offers' | 'activity'>('browse')
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null)
  const { isConnected } = useAccount()

  // Show NFT detail view if NFT selected
  if (selectedNFT !== null) {
    return <NFTDetailView tokenId={selectedNFT} onBack={() => setSelectedNFT(null)} />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-[#daa520] mb-4 font-fredoka">
          𝕂Ǝ𝕂TV Voucher Marketplace
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Trade your 𝕂Ǝ𝕂TECH Vouchers with the community
        </p>
      </div>

      {/* View Switcher */}
      {isConnected && (
        <div className="flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => setView('browse')}
            className={`
              px-6 py-2 rounded-lg font-fredoka font-bold transition-all
              ${view === 'browse'
                ? 'bg-[#daa520] text-black shadow-lg shadow-[#daa520]/20'
                : 'bg-gray-800 text-[#daa520] hover:text-white hover:bg-gray-700'
              }
            `}
          >
            Browse & Buy
          </button>
          <button
            onClick={() => setView('list')}
            className={`
              px-6 py-2 rounded-lg font-fredoka font-bold transition-all
              ${view === 'list'
                ? 'bg-[#daa520] text-black shadow-lg shadow-[#daa520]/20'
                : 'bg-gray-800 text-[#daa520] hover:text-white hover:bg-gray-700'
              }
            `}
          >
            List for Sale
          </button>
          <button
            onClick={() => setView('offers')}
            className={`
              px-6 py-2 rounded-lg font-fredoka font-bold transition-all
              ${view === 'offers'
                ? 'bg-[#daa520] text-black shadow-lg shadow-[#daa520]/20'
                : 'bg-gray-800 text-[#daa520] hover:text-white hover:bg-gray-700'
              }
            `}
          >
            Offers
          </button>
          <button
            onClick={() => setView('activity')}
            className={`
              px-6 py-2 rounded-lg font-fredoka font-bold transition-all
              ${view === 'activity'
                ? 'bg-[#daa520] text-black shadow-lg shadow-[#daa520]/20'
                : 'bg-gray-800 text-[#daa520] hover:text-white hover:bg-gray-700'
              }
            `}
          >
            My Trading Activity
          </button>
        </div>
      )}

      {/* Content */}
      {view === 'browse' ? (
        <BrowseListings onSelectNFT={setSelectedNFT} />
      ) : view === 'offers' ? (
        !isConnected ? (
          <div className="text-center py-24">
            <div className="text-8xl mb-6">🔌</div>
            <h3 className="text-2xl font-bold text-[#daa520] mb-4 font-fredoka">Connect Your Wallet</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Connect your wallet to view and make offers
            </p>
          </div>
        ) : (
          <OffersView />
        )
      ) : view === 'activity' ? (
        <UserActivityPage />
      ) : !isConnected ? (
        <div className="text-center py-24">
          <div className="text-8xl mb-6">🔌</div>
          <h3 className="text-2xl font-bold text-[#daa520] mb-4 font-fredoka">Connect Your Wallet</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Connect your wallet to list your vouchers for sale
          </p>
        </div>
      ) : (
        <ListVouchers />
      )}
    </div>
  )
}

/**
 * Browse and buy voucher listings
 * Shows ALL listings as individual cards + unlisted NFTs
 */
function BrowseListings({ onSelectNFT }: { onSelectNFT: (tokenId: number) => void }) {
  const { address, isConnected } = useAccount()
  const { listings, isLoading } = useKektvListings()
  const marketplace = useKektvMarketplace()
  const { metadataMap, loading: metadataLoading } = useAllVoucherMetadata()

  // All voucher IDs to display (excluding 0 - test NFT)
  const allVoucherIds = [1, 2, 3]

  // Sort listings by token ID first, then by price
  const sortedListings = [...listings].sort((a, b) => {
    // First sort by tokenId
    if (a.tokenId !== b.tokenId) {
      return a.tokenId - b.tokenId
    }
    // Then sort by price (cheapest first)
    const priceA = BigInt(a.pricePerItem)
    const priceB = BigInt(b.pricePerItem)
    return priceA < priceB ? -1 : priceA > priceB ? 1 : 0
  })

  // Track which token IDs have listings
  const listedTokenIds = new Set(listings.map(l => l.tokenId))

  // Create array of unlisted NFTs
  const unlistedNFTs = allVoucherIds.filter(id => !listedTokenIds.has(id))

  const handleBuy = async (listing: typeof listings[number]) => {
    if (!address) return

    try {
      // Convert string values from API to BigInt
      await marketplace.buyVoucher(
        listing.seller,
        BigInt(listing.tokenId),
        BigInt(listing.amount), // Convert string to BigInt
        BigInt(listing.totalPrice) // Convert string to BigInt (CRITICAL!)
      )
      alert('Purchase successful! Vouchers transferred to your wallet.')
    } catch (error) {
      alert(`Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (isLoading || metadataLoading) {
    return (
      <div className="text-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#daa520] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading marketplace...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Grid showing ALL individual listings + unlisted NFTs */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

        {/* First: Show all active listings as individual cards */}
        {sortedListings.map((listing, index) => {
          const metadata = metadataMap[listing.tokenId]
          const mediaUrl = metadata?.animation_url || metadata?.image

          // Find if this is the cheapest listing for this token ID
          const sameTokenListings = sortedListings.filter(l => l.tokenId === listing.tokenId)
          const isCheapest = sameTokenListings[0].seller === listing.seller &&
                            sameTokenListings[0].pricePerItem === listing.pricePerItem

          return (
            <div
              key={`listing-${listing.seller}-${listing.tokenId}-${index}`}
              className="bg-gradient-to-br from-[#daa520]/10 to-yellow-600/10 rounded-lg border border-[#daa520]/20 hover:border-[#daa520]/40 overflow-hidden transition-all"
            >
              <div className="p-6">
                {/* Clickable NFT Card Upper Section */}
                <div
                  onClick={() => onSelectNFT(listing.tokenId)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {/* Voucher Media */}
                  {mediaUrl ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-black/20 mb-4">
                      <Image
                        src={mediaUrl}
                        alt={metadata?.name || `Voucher #${listing.tokenId}`}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-2">
                        {listing.tokenId === 0 ? '🎫' : listing.tokenId === 1 ? '🎟️' : listing.tokenId === 2 ? '🏆' : '💎'}
                      </div>
                    </div>
                  )}

                  {/* Voucher Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-[#daa520] font-fredoka">
                      {metadata?.name || `Voucher #${listing.tokenId}`}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Click to view details</p>
                  </div>
                </div>

                {/* Seller Badge */}
                <div className="mb-3 p-2 bg-black/20 rounded-lg">
                  <p className="text-xs text-gray-400 text-center">
                    Seller: <span className="text-white font-mono">
                      {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                    </span>
                    {listing.seller === address && (
                      <span className="ml-2 text-[#daa520] font-bold">(You)</span>
                    )}
                  </p>
                </div>

                {/* Best Price Indicator */}
                {isCheapest && sameTokenListings.length > 1 && (
                  <div className="mb-3 p-2 bg-green-900/30 border border-green-600/30 rounded-lg">
                    <p className="text-xs text-green-400 text-center font-bold">
                      ✅ Best Price for this NFT!
                    </p>
                  </div>
                )}

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
                    <span className="font-bold">You Pay:</span>
                    <span className="text-[#daa520] font-bold text-lg">
                      {(Number(listing.totalPrice) / 1e18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BASED
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-1">
                    2.5% platform fee deducted from seller
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => handleBuy(listing)}
                  disabled={!isConnected || marketplace.isPending || listing.seller === address}
                  className={`
                    w-full mt-4 py-3 rounded-lg font-fredoka font-bold transition-all
                    ${!isConnected || listing.seller === address
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : isCheapest
                        ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:scale-105 shadow-lg shadow-green-600/20'
                        : 'bg-gradient-to-r from-[#daa520] to-yellow-600 text-black hover:scale-105 shadow-lg shadow-[#daa520]/20'
                    }
                  `}
                >
                  {!isConnected ? '🔗 Connect Wallet to Buy' :
                    listing.seller === address ? 'Your Listing' :
                    marketplace.isPending ? 'Buying...' :
                    '💰 Buy Now'}
                </button>
              </div>
            </div>
          )
        })}

        {/* Second: Show unlisted NFTs */}
        {unlistedNFTs.map((tokenId) => {
          const metadata = metadataMap[tokenId]
          const mediaUrl = metadata?.animation_url || metadata?.image

          return (
            <div
              key={`unlisted-${tokenId}`}
              className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-lg border border-gray-700/50 hover:border-gray-600/50 overflow-hidden transition-all"
            >
              <div className="p-6">
                {/* Clickable NFT Card Upper Section */}
                <div
                  onClick={() => onSelectNFT(tokenId)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {/* Voucher Media */}
                  {mediaUrl ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-black/20 mb-4">
                      <Image
                        src={mediaUrl}
                        alt={metadata?.name || `Voucher #${tokenId}`}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-2">
                        {tokenId === 0 ? '🎫' : tokenId === 1 ? '🎟️' : tokenId === 2 ? '🏆' : '💎'}
                      </div>
                    </div>
                  )}

                  {/* Voucher Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-[#daa520] font-fredoka">
                      {metadata?.name || `Voucher #${tokenId}`}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Click to view details</p>
                  </div>
                </div>

                {/* Not Listed Status */}
                <div className="mt-4">
                  <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-gray-400 font-fredoka font-bold mb-1">Not Listed</p>
                    <p className="text-xs text-gray-500">
                      No active listings for this voucher
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * List your vouchers for sale
 */
function ListVouchers() {
  const { vouchers, isLoading } = useUserVoucherBalances()
  const approval = useKektvApproval()
  const marketplace = useKektvMarketplace()
  const { metadataMap, loading: metadataLoading } = useAllVoucherMetadata()
  const [selectedVoucher, setSelectedVoucher] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [pricePerItem, setPricePerItem] = useState('')

  // Watch for successful approval and refetch approval status
  useEffect(() => {
    if (approval.isSuccess) {
      // Wait a bit for blockchain to update, then refetch
      const timer = setTimeout(async () => {
        await approval.refetch()
        alert('Marketplace approved! You can now list vouchers.')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [approval.isSuccess, approval.refetch])

  const handleApprove = async () => {
    try {
      await approval.approveMarketplace()
      // Success message now shown by useEffect after refetch
    } catch (error) {
      alert(`Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleList = async () => {
    if (selectedVoucher === null || !amount || !pricePerItem) {
      alert('Please fill in all fields')
      return
    }

    try {
      await marketplace.listVoucher(
        BigInt(selectedVoucher),
        BigInt(amount),
        pricePerItem
      )
      alert('Voucher listed successfully!')
      setSelectedVoucher(null)
      setAmount('')
      setPricePerItem('')
    } catch (error) {
      alert(`Listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (isLoading || metadataLoading) {
    return (
      <div className="text-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#daa520] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading your vouchers...</p>
      </div>
    )
  }

  const ownedVouchers = vouchers.filter(v => v.balance > 0n)

  if (ownedVouchers.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-8xl mb-6">🎫</div>
        <h3 className="text-2xl font-bold text-[#daa520] mb-4 font-fredoka">No Vouchers to List</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          You don&apos;t own any KEKTV vouchers yet. Mint or buy some to start trading!
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Approval Step */}
      {approval.isLoading ? (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-blue-400">Checking marketplace approval status...</p>
          </div>
        </div>
      ) : !approval.isApproved && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-2 font-fredoka">
            🔐 Marketplace Approval Required
          </h3>
          <p className="text-gray-400 mb-4">
            You need to approve the marketplace to transfer your vouchers. This is a one-time approval.
          </p>
          <button
            onClick={handleApprove}
            disabled={approval.isPending}
            className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-fredoka font-bold hover:bg-yellow-400 transition disabled:opacity-50"
          >
            {approval.isPending ? 'Approving...' : 'Approve Marketplace'}
          </button>
        </div>
      )}

      {/* Listing Form */}
      <div className="bg-gray-900/60 rounded-lg border border-[#daa520]/20 p-6">
        <h3 className="text-2xl font-bold text-[#daa520] mb-6 font-fredoka">
          List Vouchers for Sale
        </h3>

        <div className="space-y-4">
          {/* Select Voucher */}
          <div>
            <div className="grid grid-cols-1 gap-4">
              {ownedVouchers.map((voucher) => {
                const metadata = metadataMap[voucher.id]
                const mediaUrl = metadata?.animation_url || metadata?.image
                const isSelected = selectedVoucher === voucher.id

                return (
                  <button
                    key={voucher.id}
                    onClick={() => setSelectedVoucher(voucher.id)}
                    className={`
                      rounded-xl border p-4 transition-all text-left
                      ${isSelected
                        ? 'bg-gradient-to-br from-[#daa520]/20 to-yellow-600/20 border-[#daa520] ring-2 ring-[#daa520]/50'
                        : 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30 hover:border-[#daa520]/50'
                      }
                    `}
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Voucher Image */}
                      {mediaUrl ? (
                        <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-black/20 flex-shrink-0">
                          <Image
                            src={mediaUrl}
                            alt={metadata?.name || voucher.name}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-full sm:w-32 h-32 flex items-center justify-center bg-black/20 rounded-lg flex-shrink-0">
                          <div className="text-6xl">{voucher.icon}</div>
                        </div>
                      )}

                      {/* Voucher Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-white text-lg font-fredoka">
                              {metadata?.name || voucher.name}
                            </h4>
                            <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#daa520] to-yellow-600 text-black text-sm font-bold flex-shrink-0">
                              ×{voucher.balance.toString()}
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            {metadata?.description || `Token ID #${voucher.id}`}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="text-xs text-[#daa520] font-bold mt-2">
                            ✓ Selected for listing
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-gray-400 mb-2">Quantity to List</label>
            <input
              type="number"
              min="1"
              max={selectedVoucher !== null ? Number(ownedVouchers.find(v => v.id === selectedVoucher)?.balance) : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter quantity"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#daa520] focus:outline-none"
            />
          </div>

          {/* Price Per Item */}
          <div>
            <label className="block text-gray-400 mb-2">Price Per Voucher (BASED)</label>
            <input
              type="number"
              min="1"
              value={pricePerItem}
              onChange={(e) => setPricePerItem(e.target.value)}
              placeholder="Enter price (e.g., 1000)"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#daa520] focus:outline-none"
            />
          </div>

          {/* Total Price Preview */}
          {amount && pricePerItem && (
            <div className="bg-[#daa520]/10 border border-[#daa520]/30 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Sale Price:</span>
                <span className="text-2xl font-bold text-[#daa520]">
                  {(Number(amount) * Number(pricePerItem)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BASED
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                You&apos;ll receive 97.5% after 2.5% platform fee
              </div>
            </div>
          )}

          {/* List Button */}
          <button
            onClick={handleList}
            disabled={!approval.isApproved || marketplace.isPending || !selectedVoucher || !amount || !pricePerItem}
            className={`
              w-full py-4 rounded-lg font-fredoka font-bold text-lg transition-all
              ${!approval.isApproved || marketplace.isPending || !selectedVoucher || !amount || !pricePerItem
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#daa520] to-yellow-600 text-black hover:scale-105 shadow-lg shadow-[#daa520]/20'
              }
            `}
          >
            {!approval.isApproved ? '🔐 Approve Marketplace First' :
              marketplace.isPending ? '⏳ Listing...' :
              '💰 List for Sale'}
          </button>
        </div>
      </div>

      {/* Your Active Listings */}
      <YourListings />
    </div>
  )
}

/**
 * Display user's active listings with cancel button
 */
function YourListings() {
  const { address } = useAccount()
  const { listings, isLoading } = useKektvListings(address)
  const marketplace = useKektvMarketplace()
  const { metadataMap, loading: metadataLoading } = useAllVoucherMetadata()

  const handleCancel = async (tokenId: number) => {
    try {
      await marketplace.cancelListing(BigInt(tokenId))
      alert('Listing cancelled successfully!')
    } catch (error) {
      alert(`Cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (isLoading || metadataLoading || listings.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-900/60 rounded-lg border border-[#daa520]/20 p-6">
      <h3 className="text-xl font-bold text-[#daa520] mb-4 font-fredoka">
        Your Active Listings
      </h3>
      <div className="space-y-3">
        {listings.map((listing) => {
          const metadata = metadataMap[listing.tokenId]
          const mediaUrl = metadata?.animation_url || metadata?.image

          return (
            <div
              key={listing.tokenId}
              className="rounded-lg border border-[#daa520]/30 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-4 hover:border-[#daa520]/50 transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Voucher Image */}
                {mediaUrl ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-black/20 flex-shrink-0">
                    <Image
                      src={mediaUrl}
                      alt={metadata?.name || listing.voucherName}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center bg-black/20 rounded-lg flex-shrink-0">
                    <div className="text-4xl">{listing.voucherIcon}</div>
                  </div>
                )}

                {/* Listing Details */}
                <div className="flex-1">
                  <div className="font-bold text-white text-lg font-fredoka mb-1">
                    {metadata?.name || listing.voucherName}
                  </div>
                  <div className="text-sm text-gray-400">
                    <span className="text-white font-bold">{listing.amount.toString()}</span> × {(Number(listing.pricePerItem) / 1e18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BASED each
                  </div>
                  <div className="text-xs text-[#daa520] mt-1">
                    Total: {(Number(listing.totalPrice) / 1e18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BASED
                  </div>
                </div>

                {/* Cancel Button */}
                <button
                  onClick={() => handleCancel(listing.tokenId)}
                  disabled={marketplace.isPending}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition disabled:opacity-50 font-fredoka font-bold whitespace-nowrap"
                >
                  {marketplace.isPending ? 'Cancelling...' : 'Cancel Listing'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * NFT Detail View - Shows individual NFT with metadata and trading history
 */
function NFTDetailView({ tokenId, onBack }: { tokenId: number; onBack: () => void }) {
  const { metadata, loading, error } = useVoucherMetadata(tokenId)
  const { listings: allListings, isLoading: listingsLoading } = useKektvListings()
  const { address, isConnected } = useAccount()
  const marketplace = useKektvMarketplace()

  // Filter listings for this specific tokenId and sort by price
  const tokenListings = allListings
    .filter(l => l.tokenId === tokenId)
    .sort((a, b) => {
      const priceA = BigInt(a.pricePerItem)
      const priceB = BigInt(b.pricePerItem)
      return priceA < priceB ? -1 : priceA > priceB ? 1 : 0
    })

  const handleBuy = async (listing: typeof allListings[number]) => {
    if (!address) return

    try {
      await marketplace.buyVoucher(
        listing.seller,
        BigInt(listing.tokenId),
        BigInt(listing.amount),
        BigInt(listing.totalPrice)
      )
      alert('Purchase successful! Vouchers transferred to your wallet.')
    } catch (error) {
      alert(`Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#daa520] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading NFT details...</p>
      </div>
    )
  }

  if (error || !metadata) {
    return (
      <div className="text-center py-24">
        <div className="text-8xl mb-6">❌</div>
        <h3 className="text-2xl font-bold text-[#daa520] mb-4 font-fredoka">
          Error Loading NFT
        </h3>
        <p className="text-gray-400 mb-6">{error || 'Failed to load NFT metadata'}</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-[#daa520] text-black rounded-lg font-fredoka font-bold hover:bg-yellow-600 transition"
        >
          ← Back to Marketplace
        </button>
      </div>
    )
  }

  const mediaUrl = metadata.animation_url || metadata.image

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="px-4 py-2 bg-gray-800 text-[#daa520] rounded-lg font-fredoka font-bold hover:bg-gray-700 transition"
      >
        ← Back to Marketplace
      </button>

      {/* NFT Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#daa520] mb-2 font-fredoka">
          {metadata.name}
        </h1>
        <p className="text-gray-400">Complete details and metadata for this NFT</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: NFT Image */}
        <div className="bg-gradient-to-br from-[#daa520]/10 to-yellow-600/10 rounded-lg border border-[#daa520]/20 p-6">
          {mediaUrl ? (
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black/20">
              <Image
                src={mediaUrl}
                alt={metadata.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-full aspect-square flex items-center justify-center bg-black/20 rounded-lg">
              <div className="text-9xl">🎟️</div>
            </div>
          )}
        </div>

        {/* Right: Metadata */}
        <div className="bg-gradient-to-br from-[#daa520]/10 to-yellow-600/10 rounded-lg border border-[#daa520]/20 p-6 space-y-4">
          {/* Description */}
          {metadata.description && (
            <div>
              <h3 className="text-lg font-bold text-[#daa520] mb-2 font-fredoka">Description</h3>
              <p className="text-gray-300">{metadata.description}</p>
            </div>
          )}

          {/* Token ID */}
          <div>
            <h3 className="text-lg font-bold text-[#daa520] mb-2 font-fredoka">Token ID</h3>
            <p className="text-gray-300">#{tokenId}</p>
          </div>

          {/* Attributes */}
          {metadata.attributes && metadata.attributes.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-[#daa520] mb-2 font-fredoka">Attributes</h3>
              <div className="space-y-2">
                {metadata.attributes.map((attr, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-black/20 rounded-lg p-3"
                  >
                    <span className="text-gray-400">{attr.trait_type}</span>
                    <span className="text-white font-bold">{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Available Listings Section */}
      <div className="bg-gradient-to-br from-[#daa520]/10 to-yellow-600/10 rounded-lg border border-[#daa520]/20 p-6">
        <h3 className="text-2xl font-bold text-[#daa520] mb-4 font-fredoka">
          💰 Available Listings {tokenListings.length > 0 && `(${tokenListings.length})`}
        </h3>

        {listingsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#daa520] mx-auto mb-2"></div>
            <p className="text-gray-400">Loading listings...</p>
          </div>
        ) : tokenListings.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No active listings for this NFT. Check back later!
          </p>
        ) : (
          <div className="space-y-3">
            {tokenListings.map((listing, index) => (
              <div
                key={`${listing.seller}-${listing.tokenId}-${index}`}
                className="bg-black/20 rounded-lg p-4 border border-gray-700 hover:border-[#daa520]/40 transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Seller Info */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Seller</p>
                    <p className="text-sm text-white font-mono">
                      {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                      {listing.seller === address && (
                        <span className="ml-2 text-xs text-[#daa520] font-bold">(You)</span>
                      )}
                    </p>
                  </div>

                  {/* Price Info */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Price per NFT</p>
                    <p className="text-sm text-white font-bold">
                      {(Number(listing.pricePerItem) / 1e18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BASED
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {listing.amount.toString()} | Total: {(Number(listing.totalPrice) / 1e18).toFixed(2)} BASED
                    </p>
                  </div>

                  {/* Buy Button */}
                  <div className="flex items-center">
                    <button
                      onClick={() => handleBuy(listing)}
                      disabled={!isConnected || marketplace.isPending || listing.seller === address}
                      className={`
                        w-full py-2 px-4 rounded-lg font-fredoka font-bold text-sm transition-all
                        ${!isConnected || listing.seller === address
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : index === 0
                            ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:scale-105 shadow-lg shadow-green-600/20'
                            : 'bg-gradient-to-r from-[#daa520] to-yellow-600 text-black hover:scale-105 shadow-lg shadow-[#daa520]/20'
                        }
                      `}
                    >
                      {!isConnected ? '🔗 Connect' :
                        listing.seller === address ? 'Your Listing' :
                        marketplace.isPending ? 'Buying...' :
                        index === 0 ? '✅ Best Price' : '💰 Buy Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Cheapest Price Indicator */}
            {tokenListings.length > 1 && (
              <div className="mt-3 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                <p className="text-sm text-green-400 text-center">
                  💡 Tip: Listings are sorted by price. The top listing offers the best deal!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trading History Section (Placeholder) */}
      <div className="bg-gradient-to-br from-[#daa520]/10 to-yellow-600/10 rounded-lg border border-[#daa520]/20 p-6">
        <h3 className="text-2xl font-bold text-[#daa520] mb-4 font-fredoka">
          📊 Trading History
        </h3>
        <p className="text-gray-400 text-center py-8">
          Trading history feature coming soon! This will show all transactions, offers, and sales for this specific NFT.
        </p>
      </div>
    </div>
  )
}
