/**
 * KEKTECH 3.0 - Prediction Markets Hooks
 * Main export file for all prediction market hooks
 */

// Wallet connection
export { useWallet } from './useWallet';

// Base contract interaction
export { useContractRead, usePredictionMarketRead } from './useContractRead';
export { useContractWrite, usePredictionMarketWrite } from './useContractWrite';

// Market data hooks
export {
  useMarketInfo,
  useUserPosition,
  useMarketList,
  useMarketAddress,
  useBuyPrice,
  useSellPrice,
  useMarketOdds,
} from './useMarketData';

// Market action hooks
export {
  useCreateMarket,
  usePlaceBet,
  useSellShares,
  useClaimWinnings,
  useResolveMarket,
  useDisputeMarket,
  useApproveMarket,
  useAdminApproveMarket, // ✅ FIXED: Export new admin hook
  useActivateMarket,
} from './useMarketActions';

// Event listeners
export {
  useWatchMarketCreated,
  useWatchBetPlaced,
  useWatchMarketResolved,
  useWatchMarketDisputed,
  useWatchWinningsClaimed,
  useWatchMarketStateChanged,
} from './useMarketEvents';

// Admin-only hooks
export {
  useAdminRole,
  useRejectMarket,
  useAdminResolveMarket,
  useUpdateParameter,
  useUpdateBoolParameter,
  useGetParameter,
  useGetBoolParameter,
  useUpdateDisputeWindow,
  useGetDisputeWindow,
  useUpdateMinDisputeBond,
  useGetMinDisputeBond,
  useProposedMarkets,
  useProposalVotes,
  useResolutionVotes,
  useBatchUpdateParameters,
} from './useAdminActions';
