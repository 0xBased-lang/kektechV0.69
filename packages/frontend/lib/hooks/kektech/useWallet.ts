/**
 * KEKTECH 3.0 - Wallet Connection Hook
 * Handles wallet connection, disconnection, and network validation
 */

'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import { CHAIN_ID } from '@/lib/contracts';

export function useWallet() {
  const { address, isConnected, isConnecting, isDisconnected, isReconnecting, connector } = useAccount();
  const { connect, connectors, error: connectError, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending, error: switchError } = useSwitchChain();
  const { data: balanceData } = useBalance({ address });

  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // Check if on correct network
  useEffect(() => {
    setIsCorrectNetwork(chainId === CHAIN_ID);
  }, [chainId]);

  // Switch to BasedAI network
  const switchToBasedAI = useCallback(() => {
    if (switchChain) {
      switchChain({ chainId: CHAIN_ID });
    }
  }, [switchChain]);

  // Connect with specific connector
  const connectWallet = useCallback((connectorId?: string) => {
    const targetConnector = connectorId
      ? connectors.find(c => c.id === connectorId)
      : connectors[0];

    if (targetConnector) {
      connect({ connector: targetConnector });
    }
  }, [connect, connectors]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return {
    // Connection state
    address,
    isConnected,
    isConnecting: isConnecting || isReconnecting || isConnectPending,
    isDisconnected,
    connector,

    // Network state
    chainId,
    isCorrectNetwork,
    isSwitchingNetwork: isSwitchPending,

    // Balance
    balance: balanceData?.value,

    // Actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    switchToBasedAI,

    // Available connectors
    connectors,

    // Errors
    connectError,
    switchError,

    // Convenience
    isReady: isConnected && isCorrectNetwork,
  };
}
