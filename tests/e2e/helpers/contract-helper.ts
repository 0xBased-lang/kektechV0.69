/**
 * KEKTECH 3.0 - Contract Interaction Helper
 * Viem-based contract interactions for E2E testing
 *
 * Provides methods to interact with KEKTECH contracts programmatically
 */

import {  type WalletClient,
  type PublicClient,
  type Address,
  type Hash,
  parseEther,
  formatEther,
} from 'viem';
import { createPublicClientForBasedAI, basedAI } from './wallet-client';

// Import contract addresses and ABIs from main codebase
import { CONTRACT_ADDRESSES } from '../../../lib/contracts/addresses';
import { ABIS } from '../../../lib/contracts/abis';

// ==================== CONTRACT HELPER CLASS ====================

export class ContractHelper {
  private walletClient: WalletClient;
  private publicClient: PublicClient;

  constructor(walletClient: WalletClient, publicClient?: PublicClient) {
    this.walletClient = walletClient;
    this.publicClient = publicClient || createPublicClientForBasedAI();
  }

  // ==================== MARKET FACTORY (Admin Functions) ====================

  /**
   * Approve a market (Admin only)
   * @param marketAddress - Address of the market to approve
   * @returns Transaction hash
   */
  async approveMarket(marketAddress: Address): Promise<Hash> {
    const hash = await this.walletClient.writeContract({
      account: this.walletClient.account!,
      chain: basedAI,
      address: CONTRACT_ADDRESSES.MarketFactory as Address,
      abi: ABIS.MarketFactory,
      functionName: 'approveMarket',
      args: [marketAddress],
    });

    return hash;
  }

  /**
   * Reject a market (Admin only)
   * @param marketAddress - Address of the market to reject
   * @param reason - Reason for rejection
   * @returns Transaction hash
   */
  async rejectMarket(marketAddress: Address, reason: string): Promise<Hash> {
    const hash = await this.walletClient.writeContract({
      account: this.walletClient.account!,
      chain: basedAI,
      address: CONTRACT_ADDRESSES.MarketFactory as Address,
      abi: ABIS.MarketFactory,
      functionName: 'rejectMarket',
      args: [marketAddress, reason],
    });

    return hash;
  }

  // ==================== PREDICTION MARKET (User Functions) ====================

  /**
   * Place a bet on a market
   * @param marketAddress - Market contract address
   * @param outcome - 0 for NO, 1 for YES
   * @param amount - Amount in BASED (e.g., "1.5")
   * @param minExpectedOdds - Minimum acceptable odds (default: 0 = no slippage protection)
   * @returns Transaction hash
   */
  async placeBet(
    marketAddress: Address,
    outcome: number,
    amount: string,
    minExpectedOdds: bigint = 0n  // 🎯 FIX: Added missing parameter with default value
  ): Promise<Hash> {
    const amountWei = parseEther(amount);

    const hash = await this.walletClient.writeContract({
      account: this.walletClient.account!,
      chain: basedAI,
      address: marketAddress,
      abi: ABIS.PredictionMarket,
      functionName: 'placeBet',
      args: [outcome, minExpectedOdds],  // 🎯 FIX: Contract expects 2 parameters
      value: amountWei,
    });

    return hash;
  }

  /**
   * Sell shares from a market position
   * @param marketAddress - Market contract address
   * @param outcome - 0 for NO, 1 for YES
   * @param shareAmount - Number of shares to sell
   * @returns Transaction hash
   */
  async sellShares(
    marketAddress: Address,
    outcome: number,
    shareAmount: bigint
  ): Promise<Hash> {
    const hash = await this.walletClient.writeContract({
      account: this.walletClient.account!,
      chain: basedAI,
      address: marketAddress,
      abi: ABIS.PredictionMarket,
      functionName: 'sellShares',
      args: [outcome, shareAmount],
    });

    return hash;
  }

  /**
   * Claim winnings from a resolved market
   * @param marketAddress - Market contract address
   * @returns Transaction hash
   */
  async claimWinnings(marketAddress: Address): Promise<Hash> {
    const hash = await this.walletClient.writeContract({
      account: this.walletClient.account!,
      chain: basedAI,
      address: marketAddress,
      abi: ABIS.PredictionMarket,
      functionName: 'claimWinnings',
    });

    return hash;
  }

  /**
   * Activate a market (transitions from APPROVED to ACTIVE)
   * @param marketAddress - Market contract address
   * @returns Transaction hash
   */
  async activateMarket(marketAddress: Address): Promise<Hash> {
    const hash = await this.walletClient.writeContract({
      account: this.walletClient.account!,
      chain: basedAI,
      address: marketAddress,
      abi: ABIS.PredictionMarket,
      functionName: 'activate',
    });

    return hash;
  }

  // ==================== RESOLUTION MANAGER ====================

  /**
   * Resolve a market (Admin/Resolver only)
   * @param marketAddress - Market contract address
   * @param outcome - Winning outcome (0 for NO, 1 for YES, 2 for INVALID)
   * @param reason - Resolution reason/evidence
   * @returns Transaction hash
   */
  async resolveMarket(
    marketAddress: Address,
    outcome: number,
    reason: string
  ): Promise<Hash> {
    const hash = await this.walletClient.writeContract({
      account: this.walletClient.account!,
      chain: basedAI,
      address: CONTRACT_ADDRESSES.ResolutionManager as Address,
      abi: ABIS.ResolutionManager,
      functionName: 'resolveMarket',
      args: [marketAddress, outcome, reason],
    });

    return hash;
  }

  /**
   * Dispute a market resolution
   * @param marketAddress - Market contract address
   * @param reason - Dispute reason
   * @returns Transaction hash
   */
  async disputeMarket(marketAddress: Address, reason: string): Promise<Hash> {
    const hash = await this.walletClient.writeContract({
      account: this.walletClient.account!,
      chain: basedAI,
      address: marketAddress,
      abi: ABIS.PredictionMarket,
      functionName: 'dispute',
      args: [reason],
    });

    return hash;
  }

  // ==================== TRANSACTION UTILITIES ====================

  /**
   * Wait for transaction confirmation
   * @param hash - Transaction hash
   * @param confirmations - Number of confirmations to wait for (default: 1)
   * @returns Transaction receipt
   */
  async waitForTransaction(hash: Hash, confirmations: number = 1) {
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash,
      confirmations,
      timeout: 60_000, // 60 seconds
    });

    return receipt;
  }

  /**
   * Get transaction status
   * @param hash - Transaction hash
   * @returns Transaction receipt or null if not found
   */
  async getTransactionStatus(hash: Hash) {
    try {
      const receipt = await this.publicClient.getTransactionReceipt({ hash });
      return receipt;
    } catch (error) {
      return null;
    }
  }

  // ==================== CONTRACT READ METHODS ====================

  /**
   * Get market state
   * @param marketAddress - Market contract address
   * @returns Market state (0-5)
   */
  async getMarketState(marketAddress: Address): Promise<number> {
    const state = await this.publicClient.readContract({
      address: marketAddress,
      abi: ABIS.PredictionMarket,
      functionName: 'state',
    });

    return Number(state);
  }

  /**
   * Get user's share balance
   * @param marketAddress - Market contract address
   * @param userAddress - User wallet address
   * @param outcome - 0 for NO, 1 for YES
   * @returns Share balance
   */
  async getUserShares(
    marketAddress: Address,
    userAddress: Address,
    outcome: number
  ): Promise<bigint> {
    const shares = await this.publicClient.readContract({
      address: marketAddress,
      abi: ABIS.PredictionMarket,
      functionName: 'getShares',
      args: [userAddress, outcome],
    });

    return shares as bigint;
  }

  /**
   * Check if user has claimed winnings
   * @param marketAddress - Market contract address
   * @param userAddress - User wallet address
   * @returns True if claimed
   */
  async hasClaimed(marketAddress: Address, userAddress: Address): Promise<boolean> {
    const claimed = await this.publicClient.readContract({
      address: marketAddress,
      abi: ABIS.PredictionMarket,
      functionName: 'hasClaimed',
      args: [userAddress],
    });

    return claimed as boolean;
  }

  /**
   * Get market info
   * @param marketAddress - Market contract address
   * @returns Market details
   */
  async getMarketInfo(marketAddress: Address) {
    const [state, totalVolume, yesShares, noShares] = await Promise.all([
      this.getMarketState(marketAddress),
      this.publicClient.readContract({
        address: marketAddress,
        abi: ABIS.PredictionMarket,
        functionName: 'totalVolume',
      }),
      this.publicClient.readContract({
        address: marketAddress,
        abi: ABIS.PredictionMarket,
        functionName: 'totalYesShares',
      }),
      this.publicClient.readContract({
        address: marketAddress,
        abi: ABIS.PredictionMarket,
        functionName: 'totalNoShares',
      }),
    ]);

    return {
      state,
      totalVolume: formatEther(totalVolume as bigint),
      yesShares: Number(yesShares),
      noShares: Number(noShares),
    };
  }
}

// ==================== EXPORTS ====================

export type { Hash, Address };
