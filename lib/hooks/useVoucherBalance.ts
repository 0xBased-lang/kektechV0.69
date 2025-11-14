'use client'

import { useReadContract, useAccount } from 'wagmi'
import { KEKTECH_VOUCHERS, VOUCHER_TYPES } from '@/config/contracts'

/**
 * Voucher Balance Item
 */
export interface VoucherBalance {
  id: number
  name: string
  description: string
  icon: string
  imageUrl?: string
  rarity: string
  balance: bigint
  balanceNumber: number
}

/**
 * useVoucherBalance Hook
 *
 * Fetches all voucher balances (ERC-1155) for connected wallet
 * Queries all known token IDs in a single batch call
 *
 * @returns Object containing voucher balances, loading state, and error state
 */
export function useVoucherBalance() {
  const { address, isConnected } = useAccount()

  // Prepare batch query args
  const accounts = address
    ? KEKTECH_VOUCHERS.knownTokenIds.map(() => address)
    : undefined
  const ids = KEKTECH_VOUCHERS.knownTokenIds.map((id) => BigInt(id))

  // Read all voucher balances in one call
  const {
    data: rawBalances,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContract({
    address: KEKTECH_VOUCHERS.address,
    abi: KEKTECH_VOUCHERS.abi,
    functionName: 'balanceOfBatch',
    args: accounts && ids.length > 0 ? [accounts, ids] : undefined,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 15000, // Refresh every 15 seconds
    },
  })

  // Process balances into structured format
  const vouchers: VoucherBalance[] = VOUCHER_TYPES.map((voucherType, index) => {
    const balance = rawBalances?.[index] ?? BigInt(0)
    return {
      id: voucherType.id,
      name: voucherType.name,
      description: voucherType.description,
      icon: voucherType.icon,
      imageUrl: voucherType.imageUrl,
      rarity: voucherType.rarity,
      balance,
      balanceNumber: Number(balance),
    }
  })

  // Filter to only vouchers with non-zero balance
  const ownedVouchers = vouchers.filter((v) => v.balanceNumber > 0)

  // Total voucher count across all types
  const totalVouchers = vouchers.reduce((sum, v) => sum + v.balanceNumber, 0)

  // Count of unique voucher types owned
  const uniqueVoucherTypes = ownedVouchers.length

  return {
    // Voucher data
    vouchers, // All voucher types (including zero balance)
    ownedVouchers, // Only vouchers with balance > 0
    totalVouchers, // Total count across all types
    uniqueVoucherTypes, // Count of different voucher types owned

    // Contract info
    address: KEKTECH_VOUCHERS.address,
    explorerUrl: KEKTECH_VOUCHERS.explorerUrl,

    // State
    isLoading,
    isError,
    error: error?.message || null,
    isConnected,

    // Actions
    refetch,
  }
}
