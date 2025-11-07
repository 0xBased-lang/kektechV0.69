/**
 * KEKTV Offers Contract Configuration V3
 * Deployed on BasedAI Mainnet
 *
 * Contract: KektvVouchersOffersV3
 * Address: 0xee8dc29237d46eff1518bb0503d7f782b651a04e
 * Network: BasedAI (32323)
 * Deployed: 2025-10-27
 *
 * V3 Changes (CRITICAL BUG FIX):
 * - 🔥 CRITICAL FIX: General offers now work correctly!
 * - ✅ Fixed balance checking for general offers (voucherOwner = 0x0)
 * - ✅ V3 checks msg.sender's balance for general offers
 * - ✅ V2 incorrectly checked balanceOf(0x0) which always failed
 * - ✅ Backward compatible with targeted offers
 * - ✅ All security features preserved
 * - ✅ Contract tested: 11/11 tests passed
 *
 * V2 Changes (Still included in V3):
 * - ✅ Uses BASED (native token) instead of TECH (ERC-20)
 * - ✅ No token approval needed
 * - ✅ Simpler UX for users
 * - ✅ Lower gas costs
 */

import { Address } from 'viem'
import kektvOffersV2Abi from './kektv-offers-v2-abi.json'

// ============ Contract Addresses ============

/**
 * V3 Offers Contract (CURRENT - Use this!)
 * Deployment: 2025-10-27
 * Bug Fix: General offers now work correctly
 */
export const KEKTV_OFFERS_V3_ADDRESS = '0xee8dc29237d46eff1518bb0503d7f782b651a04e' as Address

/**
 * V2 Offers Contract (DEPRECATED - Do not use for new offers)
 * Bug: General offers always fail
 * Keep for reference only
 */
export const KEKTV_OFFERS_V2_ADDRESS = '0x4E8B375C717a136882071923F17Ea08E75DDBcb2' as Address

/**
 * Current active contract (points to V3)
 */
export const KEKTV_OFFERS_ADDRESS = KEKTV_OFFERS_V3_ADDRESS

export const KEKTV_VOUCHERS_ADDRESS = '0x7FEF981beE047227f848891c6C9F9dad11767a48' as Address

// ============ Contract ABI ============

export const KEKTV_OFFERS_ABI = kektvOffersV2Abi

// ============ Network Configuration ============

export const BASEDAI_NETWORK = {
  id: 32323,
  name: 'BasedAI',
  nativeCurrency: {
    name: 'BASED',
    symbol: 'BASED',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.basedaibridge.com/rpc'],
    },
    public: {
      http: ['https://mainnet.basedaibridge.com/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BasedAI Explorer',
      url: 'https://explorer.bf1337.org',
    },
  },
} as const

// ============ Constants ============

/**
 * Minimum offer value in BASED (wei)
 * 0.001 BASED = 1000000000000000 wei
 */
export const MIN_OFFER_VALUE = '1000000000000000' as const // 0.001 BASED

/**
 * KEKTV Voucher Token IDs
 */
export const VOUCHER_IDS = {
  GENESIS: 0,
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
} as const

/**
 * Voucher names for display
 * NOTE: Removed placeholder names (Silver, Gold, Platinum)
 * Use actual metadata names from NFT contract instead
 */
export const VOUCHER_NAMES = {
  // No placeholder names - use metadata only
} as const

// ============ TypeScript Types ============

/**
 * Offer struct as returned by contract
 */
export interface Offer {
  offerId: bigint
  offerer: Address
  voucherOwner: Address
  tokenId: bigint
  amount: bigint
  offerPrice: bigint
  createdAt: bigint
  active: boolean
}

/**
 * Offer creation parameters
 */
export interface MakeOfferParams {
  tokenId: number
  amount: bigint
  offerPrice: bigint
}

/**
 * Complete contract configuration
 */
export const KEKTV_OFFERS_CONFIG = {
  address: KEKTV_OFFERS_ADDRESS,
  abi: KEKTV_OFFERS_ABI,
  network: BASEDAI_NETWORK,
  constants: {
    minOfferValue: MIN_OFFER_VALUE,
    voucherIds: VOUCHER_IDS,
    voucherNames: VOUCHER_NAMES,
  },
  relatedContracts: {
    vouchers: KEKTV_VOUCHERS_ADDRESS,
    // No TECH token needed in V2! Uses native BASED ✅
  },
} as const

export type KektvOffersConfig = typeof KEKTV_OFFERS_CONFIG

// ============ Helper Functions ============

/**
 * Get voucher name by ID
 * Returns empty string to avoid showing placeholder names
 * Actual names should come from NFT metadata
 */
export function getVoucherName(_tokenId: number): string {
  return '' // No placeholders - use metadata instead
}

/**
 * Check if offer value meets minimum
 */
export function meetsMinimumOffer(amount: bigint, pricePerToken: bigint): boolean {
  const totalPrice = amount * pricePerToken
  return totalPrice >= BigInt(MIN_OFFER_VALUE)
}

/**
 * Format offer price for display
 */
export function formatOfferPrice(price: bigint): string {
  return (Number(price) / 1e18).toFixed(4) + ' BASED'
}

/**
 * Calculate total offer price
 */
export function calculateTotalPrice(amount: bigint, pricePerToken: bigint): bigint {
  return amount * pricePerToken
}
