/**
 * KEKTECH 3.0 - TypeScript Type Definitions
 * Auto-generated from contract ABIs and documentation
 */

// ==================== ENUMS ====================

/**
 * Market lifecycle states (6-state machine)
 * PROPOSED(0) → APPROVED(1) → ACTIVE(2) → RESOLVING(3) → DISPUTED(4) → FINALIZED(5)
 */
export enum MarketState {
  PROPOSED = 0,   // Pending admin approval
  APPROVED = 1,   // Awaiting activation
  ACTIVE = 2,     // Betting open ✅
  RESOLVING = 3,  // 48-hour dispute window
  DISPUTED = 4,   // Under admin review
  FINALIZED = 5,  // Claims enabled ✅
}

/**
 * Market outcome
 */
export enum Outcome {
  INVALID = 0,  // Not yet resolved
  YES = 1,      // Outcome is YES
  NO = 2,       // Outcome is NO
}

/**
 * Access control roles
 */
export enum Role {
  ADMIN = 0,
  OPERATOR = 1,
  RESOLVER = 2,
}

// ==================== STRUCTS ====================

/**
 * Market configuration for creation
 */
export interface MarketConfig {
  question: string;          // Market question (max 500 chars)
  description: string;       // Detailed description
  category: string;          // Category tag
  endTime: bigint;          // Unix timestamp when betting closes
  resolutionTime: bigint;   // Unix timestamp when resolution occurs
  minBond: bigint;          // Minimum bond in wei (e.g., 0.1 BASED)
  curveId: bigint;          // Bonding curve ID from CurveRegistry
  curveParams: bigint[];    // Curve-specific parameters
  metadata: string;          // IPFS hash or additional data
}

/**
 * Market information (read from contract)
 */
export interface MarketInfo {
  id: bigint;                // Unique market ID
  creator: string;           // Creator address
  question: string;          // Market question
  description: string;       // Description
  category: string;          // Category
  endTime: bigint;          // Betting end time
  resolutionTime: bigint;   // Resolution time
  state: MarketState;       // Current state
  outcome: Outcome;         // Resolved outcome
  totalYesShares: bigint;   // Total YES shares
  totalNoShares: bigint;    // Total NO shares
  totalVolume: bigint;      // Total volume in wei
  curveId: bigint;          // Bonding curve ID
  metadata: string;          // Additional metadata
}

/**
 * User position in a market
 */
export interface Position {
  yesShares: bigint;        // YES shares owned
  noShares: bigint;         // NO shares owned
  totalInvested: bigint;    // Total amount invested
  claimed: boolean;          // Whether winnings claimed
}

/**
 * Bet information
 */
export interface BetInfo {
  bettor: string;            // Bettor address
  amount: bigint;           // Bet amount in wei
  outcome: Outcome;         // Predicted outcome (YES/NO)
  sharesReceived: bigint;   // Shares received
  timestamp: bigint;        // Bet timestamp
}

/**
 * Price quote from bonding curve
 */
export interface PriceQuote {
  cost: bigint;             // Total cost in wei
  sharesReceived: bigint;   // Shares that will be received
  pricePerShare: bigint;    // Average price per share
  fee: bigint;              // Platform fee
  slippage: bigint;         // Slippage percentage (basis points)
}

/**
 * Contract version information
 */
export interface VersionInfo {
  contractKey: string;       // Contract identifier
  version: bigint;          // Version number
  implementation: string;   // Implementation address
  deprecated: boolean;       // Whether version is deprecated
}

// ==================== EVENT TYPES ====================

/**
 * Market created event
 */
export interface MarketCreatedEvent {
  marketId: bigint;
  marketAddress: string;
  creator: string;
  question: string;
  endTime: bigint;
}

/**
 * Bet placed event
 */
export interface BetPlacedEvent {
  marketId: bigint;
  bettor: string;
  amount: bigint;
  outcome: Outcome;
  sharesReceived: bigint;
  timestamp: bigint;
}

/**
 * Market resolved event
 */
export interface MarketResolvedEvent {
  marketId: bigint;
  outcome: Outcome;
  resolver: string;
  timestamp: bigint;
}

/**
 * Market disputed event
 */
export interface MarketDisputedEvent {
  marketId: bigint;
  disputer: string;
  reason: string;
  timestamp: bigint;
}

/**
 * Winnings claimed event
 */
export interface WinningsClaimedEvent {
  marketId: bigint;
  claimer: string;
  amount: bigint;
  timestamp: bigint;
}

// ==================== HELPER TYPES ====================

/**
 * Contract call options
 */
export interface CallOptions {
  from?: string;
  value?: bigint;
  gasLimit?: bigint;
  gasPrice?: bigint;
}

/**
 * Transaction response with typed events
 */
export interface TypedTransactionReceipt {
  hash: string;
  blockNumber: number;
  gasUsed: bigint;
  status: number;
  events?: Array<
    | MarketCreatedEvent
    | BetPlacedEvent
    | MarketResolvedEvent
    | MarketDisputedEvent
    | WinningsClaimedEvent
  >;
}

// ==================== UTILITY TYPES ====================

/**
 * Convert MarketState enum to readable string
 */
export function marketStateToString(state: MarketState): string {
  const states: Record<MarketState, string> = {
    [MarketState.PROPOSED]: 'Proposed',
    [MarketState.APPROVED]: 'Approved',
    [MarketState.ACTIVE]: 'Active',
    [MarketState.RESOLVING]: 'Resolving',
    [MarketState.DISPUTED]: 'Disputed',
    [MarketState.FINALIZED]: 'Finalized',
  };
  return states[state] || 'Unknown';
}

/**
 * Convert Outcome enum to readable string
 */
export function outcomeToString(outcome: Outcome): string {
  const outcomes: Record<Outcome, string> = {
    [Outcome.INVALID]: 'Unresolved',
    [Outcome.YES]: 'Yes',
    [Outcome.NO]: 'No',
  };
  return outcomes[outcome] || 'Unknown';
}

/**
 * Check if market is in betting phase
 */
export function isMarketActive(state: MarketState): boolean {
  return state === MarketState.ACTIVE;
}

/**
 * Check if market is finalized and can claim
 */
export function canClaimWinnings(state: MarketState): boolean {
  return state === MarketState.FINALIZED;
}

/**
 * Check if market can be disputed
 */
export function canDispute(state: MarketState): boolean {
  return state === MarketState.RESOLVING;
}
