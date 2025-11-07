/**
 * KEKTECH Vouchers Configuration (ERC-1155)
 *
 * Multi-token voucher system for KEKTECH ecosystem
 */

export const KEKTECH_VOUCHERS_ADDRESS = '0x7FEF981beE047227f848891c6C9F9dad11767a48' as const

// Minimal ERC-1155 ABI for reading balances and metadata
export const KEKTECH_VOUCHERS_ABI = [
  // READ FUNCTIONS
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOfBatch',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'accounts', type: 'address[]' },
      { name: 'ids', type: 'uint256[]' },
    ],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'uri',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'isApprovedForAll',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  // WRITE FUNCTIONS (for future use)
  {
    name: 'setApprovalForAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'safeTransferFrom',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'id', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [],
  },
] as const

// Known Voucher Types (from explorer: IDs 0, 1, 2, 3)
export const VOUCHER_TYPES = [
  {
    id: 0,
    name: 'Genesis Voucher',
    description: 'Original KEKTECH voucher for early supporters',
    icon: '🎫',
    imageUrl: '', // TODO: Add actual GIF URL from IPFS/metadata
    rarity: 'legendary',
  },
  {
    id: 1,
    name: 'Silver Voucher',
    description: 'Standard KEKTECH voucher with base benefits',
    icon: '🎟️',
    imageUrl: '', // TODO: Add actual GIF URL from IPFS/metadata
    rarity: 'common',
  },
  {
    id: 2,
    name: 'Gold Voucher',
    description: 'Premium KEKTECH voucher with enhanced rewards',
    icon: '🏆',
    imageUrl: '', // TODO: Add actual GIF URL from IPFS/metadata
    rarity: 'rare',
  },
  {
    id: 3,
    name: 'Platinum Voucher',
    description: 'Elite KEKTECH voucher with maximum benefits',
    icon: '💎',
    imageUrl: '', // TODO: Add actual GIF URL from IPFS/metadata
    rarity: 'epic',
  },
] as const

// Collection Configuration
export const KEKTECH_VOUCHERS = {
  // Identifiers
  id: 'kektech-vouchers' as const,
  name: 'KEKTECH Vouchers' as const,
  symbol: 'KEKTV' as const,
  description: 'Multi-token voucher system for exclusive KEKTECH benefits' as const,

  // Contract Details
  address: KEKTECH_VOUCHERS_ADDRESS,
  abi: KEKTECH_VOUCHERS_ABI,

  // Voucher Types
  voucherTypes: VOUCHER_TYPES,
  knownTokenIds: [0, 1, 2, 3] as const,

  // Explorer Links
  explorerUrl: `https://explorer.bf1337.org/token/${KEKTECH_VOUCHERS_ADDRESS}`,

  // UI Configuration
  theme: {
    primary: '#9333ea', // Purple
    gradient: 'from-purple-500 to-pink-500',
  },

  // Rarity Colors
  rarityColors: {
    legendary: 'from-yellow-400 to-orange-500',
    epic: 'from-purple-500 to-pink-500',
    rare: 'from-blue-500 to-cyan-500',
    common: 'from-gray-500 to-gray-600',
  },

  // Feature Flags
  features: {
    viewing: true,
    transfer: true,
    redeem: false, // Future: voucher redemption
    marketplace: false, // Future: trading
  },
} as const

// Export type for use in components
export type VouchersConfig = typeof KEKTECH_VOUCHERS
export type VoucherType = (typeof VOUCHER_TYPES)[number]
