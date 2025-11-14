/**
 * KEKTV Marketplace Configuration (ERC-1155 Voucher Trading)
 *
 * ✅ V6 DEPLOYED: October 19, 2025
 * Contract: 0x2d79106D60f92F3a6b7B17E3cAd3Df0D4bdcE062
 * Network: BasedAI (Chain ID: 32323)
 * Status: PRODUCTION - V6 with reordered operations (CRITICAL FIX)
 *
 * V6 Changes from V2/V4:
 * - ✅ BREAKTHROUGH FIX: Pay seller BEFORE NFT transfer
 * - ✅ Fixes "Insufficient balance" error by avoiding msg.value context loss during ERC1155 callback
 * - ✅ Follows proper Checks-Effects-Interactions pattern
 * - ✅ BasedAI-specific fix for msg.value handling during safeTransferFrom callbacks
 *
 * Features:
 * - ✅ Real-time NFT balance validation before every transaction
 * - ✅ Auto-cancel invalid listings with clear error messages
 * - ✅ Try-catch NFT transfers with automatic rollback
 * - ✅ Comprehensive error handling (SellerInsufficientBalance, MarketplaceNotApproved, etc.)
 * - ✅ Listing validation tracking (createdAt, lastValidated timestamps)
 * - Buy/Sell ERC-1155 vouchers
 * - Listings with quantity support
 * - 2.5% platform fee (deducted from seller)
 * - Correct fee model (buyer pays listing price only)
 * - ERC1155 validation & security hardened
 * - Pausable & secure
 */

export const KEKTV_MARKETPLACE_ADDRESS = '0x2d79106D60f92F3a6b7B17E3cAd3Df0D4bdcE062' as const

// Voucher contract address
export const KEKTV_VOUCHERS_ADDRESS = '0x7FEF981beE047227f848891c6C9F9dad11767a48' as const

// V6 Marketplace ABI (Simplified)
export const KEKTV_MARKETPLACE_ABI = [
  // Constructor
  {
    inputs: [
      { internalType: 'address', name: '_voucherContract', type: 'address' },
      { internalType: 'address', name: '_feeRecipient', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },

  // View Functions
  {
    inputs: [],
    name: 'voucherContract',
    outputs: [{ internalType: 'contract IERC1155', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'FEE_PERCENTAGE',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    name: 'listings',
    outputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'pricePerItem', type: 'uint256' },
      { internalType: 'bool', name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'feeRecipient',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },

  // Write Functions
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'pricePerItem', type: 'uint256' },
    ],
    name: 'listVoucher',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'seller', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'buyVoucher',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'cancelListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_newFeeRecipient', type: 'address' }],
    name: 'updateFeeRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'emergencyWithdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'seller', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'pricePerItem', type: 'uint256' },
    ],
    name: 'VoucherListed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'seller', type: 'address' },
      { indexed: true, internalType: 'address', name: 'buyer', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'totalPrice', type: 'uint256' },
    ],
    name: 'VoucherSold',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'seller', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'ListingCancelled',
    type: 'event',
  },
] as const

export const KEKTV_MARKETPLACE_CONFIG = {
  address: KEKTV_MARKETPLACE_ADDRESS,
  abi: KEKTV_MARKETPLACE_ABI,

  // Contract features
  platformFee: 250n, // 2.5% (250 basis points)
  vouchersAddress: KEKTV_VOUCHERS_ADDRESS,

  // Feature flags (query from contract in production)
  enabled: true,
  listingsEnabled: true,
  offersEnabled: false, // Can be enabled by owner
  paused: false,

  // Network info
  chainId: 32323,
  network: 'BasedAI',
  blockExplorer: 'https://explorer.bf1337.org',

  // Deployment info
  deployedAt: 2439532,
  deployedDate: '2025-10-17',
  txHash: '0xd892c6297e2e6423eb171d63d3133d994bbdae9dfdc14a4a0b50c80006592e69',
} as const

export type KektvMarketplaceConfig = typeof KEKTV_MARKETPLACE_CONFIG

// Voucher types
export const VOUCHER_TYPES = [
  { id: 0, name: 'Genesis', description: 'Genesis tier voucher' },
  { id: 1, name: 'Silver', description: 'Silver tier voucher' },
  { id: 2, name: 'Gold', description: 'Gold tier voucher' },
  { id: 3, name: 'Platinum', description: 'Platinum tier voucher' },
] as const

// Helper function to calculate total price with fee
export function calculateTotalPrice(pricePerItem: bigint, amount: bigint, platformFee: bigint = 250n): bigint {
  const subtotal = pricePerItem * amount
  const fee = (subtotal * platformFee) / 10000n
  return subtotal + fee
}

// Helper function to calculate fee only
export function calculateFee(price: bigint, platformFee: bigint = 250n): bigint {
  return (price * platformFee) / 10000n
}
