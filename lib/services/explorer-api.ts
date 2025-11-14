/**
 * BasedAI Explorer API Service
 *
 * Fetches historical event data from the BasedAI blockchain explorer.
 * Uses the Blockscout API to query contract events without running a backend.
 *
 * Events tracked:
 *
 * OFFER EVENTS (KektvOffers contract):
 * - OfferMade: When someone creates a new offer
 * - OfferAccepted: When a voucher owner accepts an offer
 * - OfferCancelled: When the offerer cancels their offer
 * - OfferRejected: When a voucher owner rejects an offer
 *
 * MARKETPLACE EVENTS (KektvMarketplace contract):
 * - VoucherSold: When someone buys from a listing
 * - VoucherListed: When someone lists a voucher for sale
 * - ListingCancelled: When a seller cancels their listing
 */

import { AbiCoder } from 'ethers'

// BasedAI Explorer API endpoint
const EXPLORER_API = 'https://explorer.bf1337.org/api'

// KEKTV Offers V3 Contract Address (Current - Bug Fix Deployed 2025-10-27)
// V3 Fix: General offers now work correctly (checks msg.sender balance instead of 0x0)
// Previous V2 address (DEPRECATED - had general offers bug): 0x4E8B375C717a136882071923F17Ea08E75DDBcb2
const KEKTV_OFFERS_ADDRESS = '0xee8dc29237d46eff1518bb0503d7f782b651a04e'

// KEKTV Marketplace V6 Contract Address
const KEKTV_MARKETPLACE_ADDRESS = '0x2d79106D60f92F3a6b7B17E3cAd3Df0D4bdcE062'

/**
 * Event signatures (keccak256 hash of event definition)
 * These are used to filter events by type
 * UPDATED: Fixed signatures to match actual contract events from blockchain
 */
export const EVENT_SIGNATURES = {
  // === OFFER EVENTS (from KektvOffers contract) ===
  // OfferMade(uint256 indexed offerId, address indexed offerer, address indexed voucherOwner, uint256 tokenId, uint256 amount, uint256 offerPrice)
  OfferMade: '0x1a8e4806e9c3198b224bf5fd328ba7488ee72334ba823076cf52dbfce562ffae',

  // OfferAccepted(uint256 indexed offerId, address indexed offerer, address indexed voucherOwner, uint256 tokenId, uint256 amount, uint256 offerPrice)
  OfferAccepted: '0x1f514add757f76c3e97bed00e66989c1e7bdf8b4d2d9c0cc2b122fe33f3d1c43',

  // OfferCancelled(uint256 indexed offerId, address indexed offerer)
  OfferCancelled: '0x1f51377b3e685a0e2419f9bb4ba7c07ec54936353ba3d0fb3c6538dab6766222',

  // OfferRejected(uint256 indexed offerId, address indexed voucherOwner)
  OfferRejected: '0x0a2e4bd6e1f84e8c8e24e5097f098f3e7c6a1c8a0e2f9b0e8c7d3a4b5c6e7f8a',

  // === MARKETPLACE EVENTS (from KektvMarketplace contract) ===
  // VoucherSold(address indexed seller, address indexed buyer, uint256 indexed tokenId, uint256 amount, uint256 totalPrice)
  VoucherSold: '0xecce07a667f396cfd44218046bbb9ae45de559f1c2e3eedbc8da5677ce81df04',

  // VoucherListed(address indexed seller, uint256 indexed tokenId, uint256 amount, uint256 pricePerItem)
  VoucherListed: '0x77a394adf8c68c51dcf5377d5007758bd11b472d589f7196bf41a45d53db8d5f',

  // ListingCancelled(address indexed seller, uint256 indexed tokenId)
  ListingCancelled: '0x2e1a7d4d13322e7b96f9a57413e1525c250fb7a9021cf91d1540d5b69f16a49f',
} as const

/**
 * Event types for type safety
 */
export type EventType = keyof typeof EVENT_SIGNATURES

/**
 * Parsed event data structures
 */
export interface BaseEvent {
  blockNumber: number
  timestamp: number
  transactionHash: string
  eventType: EventType
}

export interface OfferMadeEvent extends BaseEvent {
  eventType: 'OfferMade'
  offerId: string
  offerer: string
  voucherOwner: string
  tokenId: number
  amount: string // in wei
  offerPrice: string // in wei (total BASED)
}

export interface OfferAcceptedEvent extends BaseEvent {
  eventType: 'OfferAccepted'
  offerId: string
  offerer: string
  voucherOwner: string
  tokenId: number
  amount: string
  offerPrice: string
}

export interface OfferCancelledEvent extends BaseEvent {
  eventType: 'OfferCancelled'
  offerId: string
  offerer: string
}

export interface OfferRejectedEvent extends BaseEvent {
  eventType: 'OfferRejected'
  offerId: string
  voucherOwner: string
}

export interface VoucherSoldEvent extends BaseEvent {
  eventType: 'VoucherSold'
  seller: string
  buyer: string
  tokenId: number
  amount: string // in units (not wei)
  totalPrice: string // in wei (BASED paid)
}

export interface VoucherListedEvent extends BaseEvent {
  eventType: 'VoucherListed'
  seller: string
  tokenId: number
  amount: string
  pricePerItem: string
}

export interface ListingCancelledEvent extends BaseEvent {
  eventType: 'ListingCancelled'
  seller: string
  tokenId: number
}

export type OfferEvent = OfferMadeEvent | OfferAcceptedEvent | OfferCancelledEvent | OfferRejectedEvent
export type MarketplaceEvent = VoucherSoldEvent | VoucherListedEvent | ListingCancelledEvent
export type TradingEvent = OfferEvent | MarketplaceEvent

/**
 * Raw log data from explorer API
 */
interface RawLog {
  address: string
  topics: string[]
  data: string
  blockNumber: string
  timeStamp: string
  transactionHash: string
}

/**
 * Explorer API Service Class
 */
export class ExplorerAPIService {
  private abiCoder = AbiCoder.defaultAbiCoder()

  /**
   * Get all trading events (both offers and marketplace)
   * @param fromBlock - Starting block number (default: 0)
   * @param toBlock - Ending block (default: 'latest')
   */
  async getAllEvents(fromBlock: number | string = 0, toBlock: string = 'latest'): Promise<TradingEvent[]> {
    // Fetch from both contracts in parallel
    const [offerEvents, marketplaceEvents] = await Promise.all([
      this.getOfferEvents(fromBlock, toBlock),
      this.getMarketplaceEvents(fromBlock, toBlock),
    ])

    // Combine and sort by timestamp (newest first)
    const allEvents = [...offerEvents, ...marketplaceEvents]
    return allEvents.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get events from KEKTV Offers contract only
   */
  private async getOfferEvents(fromBlock: number | string = 0, toBlock: string = 'latest'): Promise<OfferEvent[]> {
    const url = new URL(EXPLORER_API)
    url.searchParams.set('module', 'logs')
    url.searchParams.set('action', 'getLogs')
    url.searchParams.set('fromBlock', fromBlock.toString())
    url.searchParams.set('toBlock', toBlock)
    url.searchParams.set('address', KEKTV_OFFERS_ADDRESS)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result.map((log: RawLog) => this.parseLog(log)).filter((e: TradingEvent | null): e is OfferEvent => e !== null && 'offerId' in e)
    }

    return []
  }

  /**
   * Get events from KEKTV Marketplace contract only
   */
  private async getMarketplaceEvents(fromBlock: number | string = 0, toBlock: string = 'latest'): Promise<MarketplaceEvent[]> {
    const url = new URL(EXPLORER_API)
    url.searchParams.set('module', 'logs')
    url.searchParams.set('action', 'getLogs')
    url.searchParams.set('fromBlock', fromBlock.toString())
    url.searchParams.set('toBlock', toBlock)
    url.searchParams.set('address', KEKTV_MARKETPLACE_ADDRESS)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result.map((log: RawLog) => this.parseLog(log)).filter((e: TradingEvent | null): e is MarketplaceEvent => e !== null && ('seller' in e || 'buyer' in e))
    }

    return []
  }

  /**
   * Get events by specific type
   * @param eventType - Type of event to fetch
   * @param fromBlock - Starting block
   */
  async getEventsByType(eventType: EventType, fromBlock: number | string = 0): Promise<TradingEvent[]> {
    // Determine which contract address to use based on event type
    const isMarketplaceEvent = ['VoucherSold', 'VoucherListed', 'ListingCancelled'].includes(eventType)
    const contractAddress = isMarketplaceEvent ? KEKTV_MARKETPLACE_ADDRESS : KEKTV_OFFERS_ADDRESS

    const url = new URL(EXPLORER_API)
    url.searchParams.set('module', 'logs')
    url.searchParams.set('action', 'getLogs')
    url.searchParams.set('fromBlock', fromBlock.toString())
    url.searchParams.set('toBlock', 'latest')
    url.searchParams.set('address', contractAddress)
    url.searchParams.set('topic0', EVENT_SIGNATURES[eventType])

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result.map((log: RawLog) => this.parseLog(log)).filter((e: TradingEvent | null): e is TradingEvent => e !== null)
    }

    return []
  }

  /**
   * Get events for a specific NFT (by tokenId)
   * Includes both offer events and marketplace events
   * @param tokenId - NFT token ID
   */
  async getEventsForToken(tokenId: number): Promise<TradingEvent[]> {
    const allEvents = await this.getAllEvents()

    return allEvents.filter((event) => {
      if ('tokenId' in event) {
        return event.tokenId === tokenId
      }
      return false
    })
  }

  /**
   * Get events by user address (offerer, voucherOwner, seller, or buyer)
   * Includes both offer events and marketplace events
   * @param userAddress - User's wallet address
   */
  async getEventsByUser(userAddress: string): Promise<TradingEvent[]> {
    const allEvents = await this.getAllEvents()
    const normalizedAddress = userAddress.toLowerCase()

    return allEvents.filter((event) => {
      // Offer events
      if ('offerer' in event && event.offerer.toLowerCase() === normalizedAddress) {
        return true
      }
      if ('voucherOwner' in event && event.voucherOwner.toLowerCase() === normalizedAddress) {
        return true
      }
      // Marketplace events
      if ('seller' in event && event.seller.toLowerCase() === normalizedAddress) {
        return true
      }
      if ('buyer' in event && event.buyer.toLowerCase() === normalizedAddress) {
        return true
      }
      return false
    })
  }

  /**
   * Parse raw log into typed event
   */
  private parseLog(log: RawLog): TradingEvent | null {
    const signature = log.topics[0]
    const blockNumber = parseInt(log.blockNumber, 16)
    const timestamp = parseInt(log.timeStamp, 16)
    const transactionHash = log.transactionHash

    const baseEvent = {
      blockNumber,
      timestamp,
      transactionHash,
    }

    try {
      switch (signature) {
        // Offer events
        case EVENT_SIGNATURES.OfferMade:
          return this.parseOfferMade(log, baseEvent)

        case EVENT_SIGNATURES.OfferAccepted:
          return this.parseOfferAccepted(log, baseEvent)

        case EVENT_SIGNATURES.OfferCancelled:
          return this.parseOfferCancelled(log, baseEvent)

        case EVENT_SIGNATURES.OfferRejected:
          return this.parseOfferRejected(log, baseEvent)

        // Marketplace events
        case EVENT_SIGNATURES.VoucherSold:
          return this.parseVoucherSold(log, baseEvent)

        case EVENT_SIGNATURES.VoucherListed:
          return this.parseVoucherListed(log, baseEvent)

        case EVENT_SIGNATURES.ListingCancelled:
          return this.parseListingCancelled(log, baseEvent)

        default:
          console.warn('Unknown event signature:', signature)
          return null
      }
    } catch (error) {
      console.error('Error parsing log:', error, log)
      return null
    }
  }

  /**
   * Parse OfferMade event
   * event OfferMade(uint256 indexed offerId, address indexed offerer, address indexed voucherOwner, uint256 tokenId, uint256 amount, uint256 offerPrice)
   */
  private parseOfferMade(log: RawLog, baseEvent: Omit<BaseEvent, 'eventType'>): OfferMadeEvent {
    const offerId = BigInt(log.topics[1]).toString()
    const offerer = '0x' + log.topics[2].slice(26) // Remove padding
    const voucherOwner = '0x' + log.topics[3].slice(26)

    // Decode non-indexed parameters from data
    const decoded = this.abiCoder.decode(['uint256', 'uint256', 'uint256'], log.data)

    return {
      ...baseEvent,
      eventType: 'OfferMade',
      offerId,
      offerer,
      voucherOwner,
      tokenId: Number(decoded[0]),
      amount: decoded[1].toString(),
      offerPrice: decoded[2].toString(),
    }
  }

  /**
   * Parse OfferAccepted event
   * event OfferAccepted(uint256 indexed offerId, address indexed offerer, address indexed voucherOwner, uint256 tokenId, uint256 amount, uint256 offerPrice)
   */
  private parseOfferAccepted(log: RawLog, baseEvent: Omit<BaseEvent, 'eventType'>): OfferAcceptedEvent {
    const offerId = BigInt(log.topics[1]).toString()
    const offerer = '0x' + log.topics[2].slice(26)
    const voucherOwner = '0x' + log.topics[3].slice(26)

    const decoded = this.abiCoder.decode(['uint256', 'uint256', 'uint256'], log.data)

    return {
      ...baseEvent,
      eventType: 'OfferAccepted',
      offerId,
      offerer,
      voucherOwner,
      tokenId: Number(decoded[0]),
      amount: decoded[1].toString(),
      offerPrice: decoded[2].toString(),
    }
  }

  /**
   * Parse OfferCancelled event
   * event OfferCancelled(uint256 indexed offerId, address indexed offerer)
   */
  private parseOfferCancelled(log: RawLog, baseEvent: Omit<BaseEvent, 'eventType'>): OfferCancelledEvent {
    const offerId = BigInt(log.topics[1]).toString()
    const offerer = '0x' + log.topics[2].slice(26)

    return {
      ...baseEvent,
      eventType: 'OfferCancelled',
      offerId,
      offerer,
    }
  }

  /**
   * Parse OfferRejected event
   * event OfferRejected(uint256 indexed offerId, address indexed voucherOwner)
   */
  private parseOfferRejected(log: RawLog, baseEvent: Omit<BaseEvent, 'eventType'>): OfferRejectedEvent {
    const offerId = BigInt(log.topics[1]).toString()
    const voucherOwner = '0x' + log.topics[2].slice(26)

    return {
      ...baseEvent,
      eventType: 'OfferRejected',
      offerId,
      voucherOwner,
    }
  }

  /**
   * Parse VoucherSold event
   * event VoucherSold(address indexed seller, address indexed buyer, uint256 indexed tokenId, uint256 amount, uint256 totalPrice)
   */
  private parseVoucherSold(log: RawLog, baseEvent: Omit<BaseEvent, 'eventType'>): VoucherSoldEvent {
    const seller = '0x' + log.topics[1].slice(26)
    const buyer = '0x' + log.topics[2].slice(26)
    const tokenId = Number(BigInt(log.topics[3]))

    // Decode non-indexed parameters from data
    const decoded = this.abiCoder.decode(['uint256', 'uint256'], log.data)

    return {
      ...baseEvent,
      eventType: 'VoucherSold',
      seller,
      buyer,
      tokenId,
      amount: decoded[0].toString(),
      totalPrice: decoded[1].toString(),
    }
  }

  /**
   * Parse VoucherListed event
   * event VoucherListed(address indexed seller, uint256 indexed tokenId, uint256 amount, uint256 pricePerItem)
   */
  private parseVoucherListed(log: RawLog, baseEvent: Omit<BaseEvent, 'eventType'>): VoucherListedEvent {
    const seller = '0x' + log.topics[1].slice(26)
    const tokenId = Number(BigInt(log.topics[2]))

    const decoded = this.abiCoder.decode(['uint256', 'uint256'], log.data)

    return {
      ...baseEvent,
      eventType: 'VoucherListed',
      seller,
      tokenId,
      amount: decoded[0].toString(),
      pricePerItem: decoded[1].toString(),
    }
  }

  /**
   * Parse ListingCancelled event
   * event ListingCancelled(address indexed seller, uint256 indexed tokenId)
   */
  private parseListingCancelled(log: RawLog, baseEvent: Omit<BaseEvent, 'eventType'>): ListingCancelledEvent {
    const seller = '0x' + log.topics[1].slice(26)
    const tokenId = Number(BigInt(log.topics[2]))

    return {
      ...baseEvent,
      eventType: 'ListingCancelled',
      seller,
      tokenId,
    }
  }

  /**
   * Get paginated results (handles >1000 logs limit)
   */
  async getAllEventsWithPagination(): Promise<TradingEvent[]> {
    let allEvents: TradingEvent[] = []
    let fromBlock: number | string = 0
    let hasMore = true
    let iterations = 0
    const MAX_ITERATIONS = 100 // Safety limit

    while (hasMore && iterations < MAX_ITERATIONS) {
      const events = await this.getAllEvents(fromBlock)
      allEvents = [...allEvents, ...events]

      if (events.length < 1000) {
        hasMore = false
      } else {
        // Get next page starting from last block + 1
        const maxBlock = Math.max(...events.map((e) => e.blockNumber))
        fromBlock = maxBlock + 1
      }

      iterations++
    }

    // Remove duplicates (same transaction hash + event type)
    const uniqueEvents = allEvents.filter(
      (event, index, self) =>
        index ===
        self.findIndex(
          (e) => e.transactionHash === event.transactionHash && e.eventType === event.eventType
        )
    )

    return uniqueEvents
  }
}

/**
 * Singleton instance
 */
export const explorerAPI = new ExplorerAPIService()
