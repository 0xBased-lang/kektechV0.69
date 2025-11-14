'use client'

import { useAccount } from 'wagmi'
import { useTechBalance } from './useTechBalance'
import { useVoucherBalance } from './useVoucherBalance'
import { useWalletNFTs } from './useWalletNFTs'
import { KEKTECH_CONTRACT_ADDRESS } from '@/config/constants'
import { useMemo } from 'react'

/**
 * usePortfolioData Hook
 *
 * Aggregates all portfolio data from multiple sources:
 * - TECH token balance
 * - KEKTECH NFTs
 * - KEKTECH Vouchers
 * - Other NFTs
 *
 * @returns Comprehensive portfolio data with loading and error states
 */
export function usePortfolioData() {
  const { address, isConnected } = useAccount()

  // Fetch all data sources
  const techBalance = useTechBalance()
  const voucherBalance = useVoucherBalance()
  const nftData = useWalletNFTs(address)

  // Separate KEKTECH NFTs from other NFTs
  const { kektechNFTs, otherNFTs } = useMemo(() => {
    // Ensure nftData.nfts is an array and filter safely
    const nfts = nftData.nfts || []

    const kektech = nfts.filter((nft) => {
      // Safe property access with null checks
      const nftAddress = nft?.token?.address  // ← FIXED: Use "address" not "address_hash"
      if (!nftAddress || !KEKTECH_CONTRACT_ADDRESS) return false
      return nftAddress.toLowerCase() === KEKTECH_CONTRACT_ADDRESS.toLowerCase()
    })

    const others = nfts.filter((nft) => {
      // Safe property access with null checks
      const nftAddress = nft?.token?.address  // ← FIXED: Use "address" not "address_hash"
      if (!nftAddress || !KEKTECH_CONTRACT_ADDRESS) return !nftAddress // Include NFTs without address in 'others'
      return nftAddress.toLowerCase() !== KEKTECH_CONTRACT_ADDRESS.toLowerCase()
    })

    return { kektechNFTs: kektech, otherNFTs: others }
  }, [nftData.nfts])

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    // Safe access for NFT array
    const nftsArray = nftData.nfts || []

    return {
      // Token metrics
      techBalance: techBalance.balanceNumber,
      techBalanceFormatted: techBalance.balanceFormatted,
      techBalanceCompact: techBalance.balanceCompact,

      // NFT metrics
      totalNFTs: nftsArray.length,
      kektechNFTCount: kektechNFTs.length,
      otherNFTCount: otherNFTs.length,

      // Voucher metrics
      totalVouchers: voucherBalance.totalVouchers,
      uniqueVoucherTypes: voucherBalance.uniqueVoucherTypes,

      // Total assets
      totalAssetTypes: [
        techBalance.balanceNumber > 0 ? 1 : 0,
        kektechNFTs.length > 0 ? 1 : 0,
        voucherBalance.totalVouchers > 0 ? 1 : 0,
        otherNFTs.length > 0 ? 1 : 0,
      ].reduce((a, b) => a + b, 0),
    }
  }, [
    techBalance,
    nftData.nfts,
    kektechNFTs.length,
    otherNFTs.length,
    voucherBalance.totalVouchers,
    voucherBalance.uniqueVoucherTypes,
  ])

  // Aggregate loading state
  const isLoading =
    techBalance.isLoading || voucherBalance.isLoading || nftData.loading

  // Aggregate error state
  const hasError =
    techBalance.isError || voucherBalance.isError || !!nftData.error

  const errors = [
    techBalance.error,
    voucherBalance.error,
    nftData.error,
  ].filter(Boolean)

  // Refetch all data
  const refetchAll = () => {
    techBalance.refetch()
    voucherBalance.refetch()
    nftData.retry()
  }

  return {
    // Connection state
    address,
    isConnected,

    // Individual data sources
    techBalance,
    voucherBalance,
    nfts: {
      all: nftData.nfts || [],
      kektech: kektechNFTs,
      others: otherNFTs,
    },

    // Portfolio metrics
    metrics: portfolioMetrics,

    // Aggregate states
    isLoading,
    hasError,
    errors,

    // Actions
    refetchAll,
  }
}
