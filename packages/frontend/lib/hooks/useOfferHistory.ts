/**
 * React hooks for fetching and managing offer history
 * Uses the BasedAI Explorer API to get historical event data
 */

import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { explorerAPI, type TradingEvent, type EventType } from '@/lib/services/explorer-api'
import { useMemo } from 'react'

/**
 * Offer timeline entry with complete history
 */
export interface OfferTimeline {
  offerId: string
  tokenId: number
  offerer: string
  voucherOwner: string
  amount: string
  offerPrice: string
  status: 'active' | 'accepted' | 'cancelled' | 'rejected'
  createdAt: number
  resolvedAt?: number
  events: TradingEvent[]
}

/**
 * NFT statistics
 */
export interface NFTStats {
  totalOffers: number
  acceptedOffers: number
  cancelledOffers: number
  rejectedOffers: number
  activeOffers: number
  totalVolume: bigint // Total BASED traded
  averagePrice: bigint // Average offer price
  lastSalePrice?: bigint
  lastSaleDate?: number
}

/**
 * Get complete offer history for a specific NFT
 */
export function useNFTHistory(tokenId: number | null) {
  return useQuery({
    queryKey: ['nft-history', tokenId],
    queryFn: () => explorerAPI.getEventsForToken(tokenId!),
    enabled: tokenId !== null,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  })
}

/**
 * Get offer history for the connected user
 */
export function useUserHistory(userAddress?: `0x${string}`) {
  return useQuery({
    queryKey: ['user-history', userAddress],
    queryFn: () => explorerAPI.getEventsByUser(userAddress!),
    enabled: !!userAddress,
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

/**
 * Get all events of a specific type
 */
export function useEventsByType(eventType: EventType) {
  return useQuery({
    queryKey: ['events-by-type', eventType],
    queryFn: () => explorerAPI.getEventsByType(eventType),
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

/**
 * Get all offer events (complete history)
 */
export function useAllOfferEvents() {
  return useQuery({
    queryKey: ['all-offer-events'],
    queryFn: () => explorerAPI.getAllEventsWithPagination(),
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  })
}

/**
 * Process events into offer timeline (groups events by offer ID)
 */
export function useOfferTimeline(tokenId: number | null) {
  const { data: events, isLoading, error } = useNFTHistory(tokenId)

  const timeline = useMemo((): OfferTimeline[] => {
    if (!events || events.length === 0) return []

    // Group events by offer ID (only process offer events, not marketplace events)
    const offerMap = new Map<string, OfferTimeline>()

    events.forEach((event) => {
      // Skip marketplace events - they don't have offerId
      if (event.eventType === 'VoucherSold' || event.eventType === 'VoucherListed' || event.eventType === 'ListingCancelled') {
        return
      }

      let offerId: string
      let offer: OfferTimeline

      if (event.eventType === 'OfferMade') {
        offerId = event.offerId

        // Create new offer timeline
        offer = {
          offerId: event.offerId,
          tokenId: event.tokenId,
          offerer: event.offerer,
          voucherOwner: event.voucherOwner,
          amount: event.amount,
          offerPrice: event.offerPrice,
          status: 'active',
          createdAt: event.timestamp,
          events: [event],
        }
        offerMap.set(offerId, offer)
      } else {
        // For other offer events (Accepted, Cancelled, Rejected)
        if (!('offerId' in event)) return // Type guard

        offerId = event.offerId
        offer = offerMap.get(offerId)!

        if (offer) {
          // Add event to existing offer
          offer.events.push(event)

          // Update status based on event type
          if (event.eventType === 'OfferAccepted') {
            offer.status = 'accepted'
            offer.resolvedAt = event.timestamp
          } else if (event.eventType === 'OfferCancelled') {
            offer.status = 'cancelled'
            offer.resolvedAt = event.timestamp
          } else if (event.eventType === 'OfferRejected') {
            offer.status = 'rejected'
            offer.resolvedAt = event.timestamp
          }
        }
      }
    })

    // Sort by creation time (newest first)
    return Array.from(offerMap.values()).sort((a, b) => b.createdAt - a.createdAt)
  }, [events])

  return { timeline, isLoading, error }
}

/**
 * Calculate NFT statistics from events
 */
export function useNFTStats(tokenId: number | null) {
  const { data: events, isLoading } = useNFTHistory(tokenId)

  const stats = useMemo((): NFTStats | null => {
    if (!events || events.length === 0) return null

    let totalOffers = 0
    let acceptedOffers = 0
    let cancelledOffers = 0
    let rejectedOffers = 0
    let totalVolume = BigInt(0)
    let lastSalePrice: bigint | undefined
    let lastSaleDate: number | undefined

    // Track offer statuses
    const offerStatuses = new Map<string, 'accepted' | 'cancelled' | 'rejected' | 'active'>()

    events.forEach((event) => {
      if (event.eventType === 'OfferMade') {
        totalOffers++
        offerStatuses.set(event.offerId, 'active')
      } else if (event.eventType === 'OfferAccepted') {
        offerStatuses.set(event.offerId, 'accepted')
        totalVolume += BigInt(event.offerPrice)
        lastSalePrice = BigInt(event.offerPrice)
        lastSaleDate = event.timestamp
      } else if (event.eventType === 'OfferCancelled') {
        offerStatuses.set(event.offerId, 'cancelled')
      } else if (event.eventType === 'OfferRejected') {
        offerStatuses.set(event.offerId, 'rejected')
      }
    })

    // Count final statuses
    offerStatuses.forEach((status) => {
      if (status === 'accepted') acceptedOffers++
      else if (status === 'cancelled') cancelledOffers++
      else if (status === 'rejected') rejectedOffers++
    })

    const activeOffers = totalOffers - acceptedOffers - cancelledOffers - rejectedOffers

    // Calculate average price (only from accepted offers)
    const averagePrice = acceptedOffers > 0 ? totalVolume / BigInt(acceptedOffers) : BigInt(0)

    return {
      totalOffers,
      acceptedOffers,
      cancelledOffers,
      rejectedOffers,
      activeOffers,
      totalVolume,
      averagePrice,
      lastSalePrice,
      lastSaleDate,
    }
  }, [events])

  return { stats, isLoading }
}

/**
 * Get user's offer and marketplace statistics
 */
export function useUserStats(userAddress?: `0x${string}`) {
  const { data: events, isLoading } = useUserHistory(userAddress)

  const stats = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        offersMade: 0,
        offersReceived: 0,
        offersAccepted: 0,
        offersCancelled: 0,
        offersRejected: 0,
        vouchersSold: 0,
        vouchersListed: 0,
        listingsCancelled: 0,
        totalSpent: BigInt(0),
        totalEarned: BigInt(0),
      }
    }

    let offersMade = 0
    let offersReceived = 0
    let offersAccepted = 0
    let offersCancelled = 0
    let offersRejected = 0
    let vouchersSold = 0
    let vouchersListed = 0
    let listingsCancelled = 0
    let totalSpent = BigInt(0)
    let totalEarned = BigInt(0)

    const normalizedAddress = userAddress?.toLowerCase()

    events.forEach((event) => {
      // Offer events
      if (event.eventType === 'OfferMade') {
        if ('offerer' in event && event.offerer.toLowerCase() === normalizedAddress) {
          offersMade++
        }
        if (
          'voucherOwner' in event &&
          event.voucherOwner.toLowerCase() === normalizedAddress &&
          event.voucherOwner !== '0x0000000000000000000000000000000000000000'
        ) {
          offersReceived++
        }
      } else if (event.eventType === 'OfferAccepted') {
        offersAccepted++
        if ('offerer' in event && event.offerer.toLowerCase() === normalizedAddress) {
          totalSpent += BigInt(event.offerPrice)
        }
        if ('voucherOwner' in event && event.voucherOwner.toLowerCase() === normalizedAddress) {
          totalEarned += BigInt(event.offerPrice)
        }
      } else if (event.eventType === 'OfferCancelled') {
        if ('offerer' in event && event.offerer.toLowerCase() === normalizedAddress) {
          offersCancelled++
        }
      } else if (event.eventType === 'OfferRejected') {
        if ('voucherOwner' in event && event.voucherOwner.toLowerCase() === normalizedAddress) {
          offersRejected++
        }
      }
      // Marketplace events
      else if (event.eventType === 'VoucherSold') {
        if ('seller' in event && event.seller.toLowerCase() === normalizedAddress) {
          vouchersSold++
          totalEarned += BigInt(event.totalPrice)
        }
        if ('buyer' in event && event.buyer.toLowerCase() === normalizedAddress) {
          totalSpent += BigInt(event.totalPrice)
        }
      } else if (event.eventType === 'VoucherListed') {
        if ('seller' in event && event.seller.toLowerCase() === normalizedAddress) {
          vouchersListed++
        }
      } else if (event.eventType === 'ListingCancelled') {
        if ('seller' in event && event.seller.toLowerCase() === normalizedAddress) {
          listingsCancelled++
        }
      }
    })

    return {
      offersMade,
      offersReceived,
      offersAccepted,
      offersCancelled,
      offersRejected,
      vouchersSold,
      vouchersListed,
      listingsCancelled,
      totalSpent,
      totalEarned,
    }
  }, [events, userAddress])

  return { stats, isLoading }
}

/**
 * Hook to get connected user's history automatically
 */
export function useMyOfferHistory() {
  const { address } = useAccount()
  return useUserHistory(address)
}

/**
 * Hook to get connected user's stats automatically
 */
export function useMyStats() {
  const { address } = useAccount()
  return useUserStats(address)
}
