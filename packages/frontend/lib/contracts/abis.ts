/**
 * KEKTECH 3.0 - Contract ABIs
 * Auto-imported from Hardhat artifacts
 */

import VersionedRegistryArtifact from './abis/VersionedRegistry.json';
import ParameterStorageArtifact from './abis/ParameterStorage.json';
import AccessControlManagerArtifact from './abis/AccessControlManager.json';
import ResolutionManagerArtifact from './abis/ResolutionManager.json';
import RewardDistributorArtifact from './abis/RewardDistributor.json';
import FlexibleMarketFactoryUnifiedArtifact from './abis/FlexibleMarketFactoryUnified.json';
import PredictionMarketArtifact from './abis/PredictionMarket.json';
import CurveRegistryArtifact from './abis/CurveRegistry.json';
import MarketTemplateRegistryArtifact from './abis/MarketTemplateRegistry.json';

// Export ABIs for contract interaction
export const ABIS = {
  VersionedRegistry: VersionedRegistryArtifact.abi,
  ParameterStorage: ParameterStorageArtifact.abi,
  AccessControlManager: AccessControlManagerArtifact.abi,
  ResolutionManager: ResolutionManagerArtifact.abi,
  RewardDistributor: RewardDistributorArtifact.abi,
  MarketFactory: FlexibleMarketFactoryUnifiedArtifact.abi,
  PredictionMarketTemplate: PredictionMarketArtifact.abi,
  CurveRegistry: CurveRegistryArtifact.abi,
  MarketTemplateRegistry: MarketTemplateRegistryArtifact.abi,
  // Alias for PredictionMarket (used for market clones)
  PredictionMarket: PredictionMarketArtifact.abi,
} as const;

// Type-safe ABI names
export type ABIName = keyof typeof ABIS;

// Helper to get ABI by name
export const getABI = (name: ABIName) => {
  return ABIS[name];
};

// Export full artifacts (includes bytecode, etc.)
export const ARTIFACTS = {
  VersionedRegistry: VersionedRegistryArtifact,
  ParameterStorage: ParameterStorageArtifact,
  AccessControlManager: AccessControlManagerArtifact,
  ResolutionManager: ResolutionManagerArtifact,
  RewardDistributor: RewardDistributorArtifact,
  MarketFactory: FlexibleMarketFactoryUnifiedArtifact,
  PredictionMarketTemplate: PredictionMarketArtifact,
  CurveRegistry: CurveRegistryArtifact,
  MarketTemplateRegistry: MarketTemplateRegistryArtifact,
} as const;
