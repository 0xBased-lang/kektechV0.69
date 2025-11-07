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
