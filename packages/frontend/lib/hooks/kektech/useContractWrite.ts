/**
 * KEKTECH 3.0 - Base Contract Write Hook
 * Generic hook for writing to any contract (transactions)
 */

'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, ABIS, type ContractName, type ABIName } from '@/lib/contracts';
import type { Address } from 'viem';
import { useCallback } from 'react';

interface UseContractWriteParams {
  contractName: ContractName;
}

export function useContractWrite({ contractName }: UseContractWriteParams) {
  const address = CONTRACT_ADDRESSES[contractName] as Address;

  // Map contract names to ABI names
  const abiName: ABIName = contractName === 'MarketFactory'
    ? 'MarketFactory'
    : contractName as ABIName;

  const abi = ABIS[abiName];

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    isError: isWriteError,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isConfirmError,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const write = useCallback(
    (functionName: string, args?: readonly unknown[], value?: bigint) => {
      writeContract({
        address,
        abi,
        functionName,
        args,
        value,
      });
    },
    [writeContract, address, abi]
  );

  return {
    write,
    hash,
    isLoading: isWritePending || isConfirming,
    isSuccess: isConfirmed,
    isError: isWriteError || isConfirmError,
    error: writeError || confirmError,
    isPending: isWritePending,
    isConfirming,
    isConfirmed,
  };
}

/**
 * Hook for writing to a specific PredictionMarket clone
 */
export function usePredictionMarketWrite({ marketAddress }: { marketAddress: Address }) {
  const abi = ABIS.PredictionMarket;

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    isError: isWriteError,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isConfirmError,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const write = useCallback(
    (functionName: string, args?: readonly unknown[], value?: bigint) => {
      writeContract({
        address: marketAddress,
        abi,
        functionName,
        args,
        value,
      });
    },
    [writeContract, marketAddress, abi]
  );

  return {
    write,
    hash,
    isLoading: isWritePending || isConfirming,
    isSuccess: isConfirmed,
    isError: isWriteError || isConfirmError,
    error: writeError || confirmError,
    isPending: isWritePending,
    isConfirming,
    isConfirmed,
  };
}
