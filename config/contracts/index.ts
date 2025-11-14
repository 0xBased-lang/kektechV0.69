/**
 * Contract Configurations Export
 *
 * Single entry point for all contract configurations
 */

// NFT Collections
export { KEKTECH_MAIN, KEKTECH_MAIN_ABI, type CollectionConfig } from './kektech-main'

// ERC-20 Token
export { TECH_TOKEN, TECH_TOKEN_ABI, TECH_TOKEN_ADDRESS, type TechTokenConfig } from './tech-token'

// ERC-1155 Vouchers
export {
  KEKTECH_VOUCHERS,
  KEKTECH_VOUCHERS_ABI,
  KEKTECH_VOUCHERS_ADDRESS,
  VOUCHER_TYPES,
  type VouchersConfig,
  type VoucherType,
} from './kektech-vouchers'
