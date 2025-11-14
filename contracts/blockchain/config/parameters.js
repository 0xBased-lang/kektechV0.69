const { ethers } = require("ethers");

/**
 * KEKTECH 3.0 - MASTER PARAMETER CONFIGURATION
 *
 * Last Updated: 2025-11-09
 * Status: Initial configuration for mainnet deployment
 *
 * IMPORTANT: This is THE source of truth for all system parameters
 * - Update here, then run deployment script to sync contracts
 * - Always use config values in tests and scripts
 * - Document all changes with reasons
 *
 * Total Parameters: 29
 * - Market Creation: 3 params
 * - Fee Distribution: 7 params
 * - Resolution (Testing): 4 params
 * - Resolution (Production): 4 params
 * - Approval: 2 params
 * - LMSR Curve: 3 params
 * - Boolean Flags: 3 params
 * - Roles: 6 constants (defined in AccessControlManager)
 */

module.exports = {
  // ===== MARKET CREATION (3 parameters) =====
  market: {
    /**
     * Minimum creator bond (refundable)
     * - Paid when creating market
     * - Refunded if market approved
     * - Forfeited if market rejected
     */
    minCreatorBond: ethers.parseEther("0.1"),       // 0.1 BASED

    /**
     * Minimum bet amount
     * - Prevents dust bets
     * - Reduces spam
     */
    minimumBet: ethers.parseEther("0.01"),          // 0.01 BASED

    /**
     * Maximum bet amount
     * - Prevents market manipulation
     * - Can be adjusted based on liquidity
     */
    maximumBet: ethers.parseEther("100"),           // 100 BASED
  },

  // ===== FEE DISTRIBUTION (7 parameters - ALL in Basis Points: 10000 = 100%) =====
  fees: {
    /**
     * Platform protocol fee
     * Goes to: Platform treasury
     * Used for: Development, operations, infrastructure
     */
    protocolFeeBps: 250,                            // 2.5%

    /**
     * Market creator fee
     * Goes to: Market creator
     * Used for: Incentivize quality market creation
     */
    creatorFeeBps: 150,                             // 1.5%

    /**
     * Staker incentive fee
     * Goes to: Staking rewards pool
     * Used for: Reward TECH token stakers
     */
    stakerIncentiveBps: 50,                         // 0.5%

    /**
     * Treasury fee
     * Goes to: Platform treasury
     * Used for: Long-term sustainability
     */
    treasuryFeeBps: 50,                             // 0.5%

    /**
     * Total platform fees (sum of above)
     * Winners receive: 100% - totalFeeBps = 95%
     */
    totalFeeBps: 500,                               // 5.0% total

    /**
     * Platform fee percentage (for PredictionMarket contract)
     * Must match totalFeeBps
     */
    platformFeePercent: 500,                        // 5.0%

    /**
     * Winners' share
     * Calculated: 10000 - totalFeeBps
     */
    winnersShareBps: 9500,                          // 95%
  },

  // ===== RESOLUTION - TESTING MODE (4 parameters) =====
  // Use during development and initial testing
  resolution: {
    /**
     * Dispute window duration (TESTING)
     * - Time for community to vote on outcome
     * - Short for rapid iteration
     */
    disputeWindow: 15 * 60,                         // 15 MINUTES

    /**
     * Minimum dispute bond
     * - Required to challenge proposed outcome
     * - Refunded if dispute upheld
     * - Forfeited if dispute rejected
     */
    minDisputeBond: ethers.parseEther("0.01"),      // 0.01 BASED

    /**
     * Agreement threshold for auto-finalization
     * - If ≥75% agree → auto-finalize
     * - No admin intervention needed
     */
    agreementThreshold: 75,                         // 75%

    /**
     * Disagreement threshold for flagging dispute
     * - If >40% disagree → flag for admin review
     * - Prevents rushed resolutions
     */
    disagreementThreshold: 40,                      // 40%
  },

  // ===== RESOLUTION - PRODUCTION MODE (4 parameters) =====
  // Switch to these after testing phase
  resolutionProduction: {
    /**
     * Dispute window duration (PRODUCTION)
     * - Normal duration for live markets
     * - Gives community time to review
     */
    disputeWindow: 48 * 60 * 60,                    // 48 HOURS

    /**
     * Minimum dispute bond (production)
     * - Higher bond for production
     * - Deters frivolous disputes
     */
    minDisputeBond: ethers.parseEther("0.1"),       // 0.1 BASED

    /**
     * Same thresholds as testing
     */
    agreementThreshold: 75,                         // 75%
    disagreementThreshold: 40,                      // 40%
  },

  // ===== APPROVAL SYSTEM (2 parameters) =====
  approval: {
    /**
     * Likes required for approval
     * - Markets need this many 👍 votes
     * - Prevents low-quality markets
     */
    likesRequired: 10,                              // 10 likes

    /**
     * Approval window duration
     * - Time to gather likes
     * - Market expires if threshold not reached
     */
    approvalWindow: 24 * 60 * 60,                   // 24 HOURS
  },

  // ===== LMSR BONDING CURVE (3 parameters) =====
  lmsr: {
    /**
     * Minimum liquidity parameter (b)
     * - Controls price sensitivity
     * - Lower = more volatile prices
     */
    minB: ethers.parseEther("1"),                   // 1 BASED

    /**
     * Maximum liquidity parameter (b)
     * - Upper limit for liquidity
     * - Higher = more stable prices
     */
    maxB: ethers.parseEther("1000"),                // 1000 BASED

    /**
     * Default liquidity parameter (b)
     * - Used for most markets
     * - Balanced price sensitivity
     */
    defaultB: ethers.parseEther("100"),             // 100 BASED
  },

  // ===== BOOLEAN FLAGS (3 parameters) =====
  flags: {
    /**
     * Enable/disable market creation
     * - Set to false to pause new markets
     * - Useful for maintenance or emergencies
     */
    marketCreationActive: true,

    /**
     * Enable/disable experimental markets
     * - For testing new features
     * - Disabled by default
     */
    experimentalMarketsActive: false,

    /**
     * Emergency pause
     * - Stops all contract operations
     * - Only for critical issues
     */
    emergencyPause: false,
  },

  // ===== PARAMETER KEYS (for ParameterStorage) =====
  // These are the keccak256 hashes used to store/retrieve parameters
  keys: {
    protocolFeeBps: ethers.id("protocolFeeBps"),
    creatorFeeBps: ethers.id("creatorFeeBps"),
    stakerIncentiveBps: ethers.id("stakerIncentiveBps"),
    treasuryFeeBps: ethers.id("treasuryFeeBps"),
    platformFeePercent: ethers.id("platformFeePercent"),
    minimumBet: ethers.id("minimumBet"),
    maximumBet: ethers.id("maximumBet"),
    marketCreationActive: ethers.id("marketCreationActive"),
    experimentalMarketsActive: ethers.id("experimentalMarketsActive"),
    emergencyPause: ethers.id("emergencyPause"),
  },

  // ===== ROLE CONSTANTS (6 roles - defined in AccessControlManager) =====
  roles: {
    ADMIN_ROLE: ethers.id("ADMIN_ROLE"),
    OPERATOR_ROLE: ethers.id("OPERATOR_ROLE"),
    RESOLVER_ROLE: ethers.id("RESOLVER_ROLE"),
    PAUSER_ROLE: ethers.id("PAUSER_ROLE"),
    TREASURY_ROLE: ethers.id("TREASURY_ROLE"),
    BACKEND_ROLE: ethers.id("BACKEND_ROLE"),
  },

  // ===== TESTING SCENARIOS =====
  testing: {
    /**
     * Rapid testing configuration
     * - Very short durations
     * - For development/testing only
     */
    rapidTesting: {
      marketDuration: 1 * 60 * 60,                  // 1 hour
      disputeWindow: 15 * 60,                       // 15 minutes
      approvalWindow: 1 * 60 * 60,                  // 1 hour
    },
  },
};
