'use client'

import { useReadContract, useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { TECH_TOKEN } from '@/config/contracts'

/**
 * useTechBalance Hook
 *
 * Fetches TECH token balance for connected wallet
 * Handles 18 decimal places and formatting
 *
 * @returns Object containing balance data, loading state, and error state
 */
export function useTechBalance() {
  const { address, isConnected } = useAccount()

  // Read token balance
  const {
    data: rawBalance,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContract({
    address: TECH_TOKEN.address,
    abi: TECH_TOKEN.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 10000, // Refresh every 10 seconds
    },
  })

  // Format balance with proper decimals (18)
  const balance = rawBalance ? formatUnits(rawBalance, TECH_TOKEN.decimals) : '0'

  // Parse to number for calculations
  const balanceNumber = parseFloat(balance)

  // Format for display (with commas)
  const balanceFormatted = balanceNumber.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })

  // Compact format (K, M, B notation)
  const balanceCompact =
    balanceNumber >= 1_000_000
      ? `${(balanceNumber / 1_000_000).toFixed(2)}M`
      : balanceNumber >= 1_000
        ? `${(balanceNumber / 1_000).toFixed(2)}K`
        : balanceFormatted

  return {
    // Raw data
    rawBalance,
    balance, // String with full precision
    balanceNumber, // Parsed number

    // Formatted versions
    balanceFormatted, // With commas and decimals
    balanceCompact, // Compact notation

    // Token info
    symbol: TECH_TOKEN.symbol,
    decimals: TECH_TOKEN.decimals,
    address: TECH_TOKEN.address,

    // State
    isLoading,
    isError,
    error: error?.message || null,
    isConnected,

    // Actions
    refetch,
  }
}
