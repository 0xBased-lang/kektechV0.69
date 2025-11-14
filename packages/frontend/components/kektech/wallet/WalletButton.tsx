/**
 * KEKTECH 3.0 - Wallet Connection Button
 * Uses Wagmi hooks for wallet integration
 */
'use client';

import { useWallet } from '@/lib/hooks/kektech';
import { ButtonLoading } from '../ui/LoadingSpinner';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  className?: string;
  showBalance?: boolean;
  showNetworkWarning?: boolean;
}

/**
 * Wallet connection button with network validation
 */
export function WalletButton({
  onConnect,
  onDisconnect,
  className,
  showBalance = true,
  showNetworkWarning = true,
}: WalletButtonProps) {
  const {
    address,
    isConnected,
    isConnecting,
    isWrongNetwork,
    balance,
    connect,
    disconnect,
    switchToBasedAI,
    error,
  } = useWallet();

  // Handle successful connection
  if (isConnected && address && onConnect) {
    onConnect(address);
  }

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
    if (onDisconnect) {
      onDisconnect();
    }
  };

  // Wrong network warning
  if (isConnected && isWrongNetwork && showNetworkWarning) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-yellow-400">Wrong Network</span>
        </div>
        <button
          onClick={switchToBasedAI}
          className="px-4 py-2 rounded-lg bg-kek-green text-black font-semibold hover:bg-kek-green/90 transition"
        >
          Switch to BasedAI
        </button>
      </div>
    );
  }

  // Connected state
  if (isConnected && address) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Connected</span>
              <span className="text-sm text-kek-green font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
            {showBalance && balance && (
              <span className="text-xs text-gray-400">
                {Number(balance).toFixed(4)} BASED
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm font-medium"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Connecting state
  if (isConnecting) {
    return (
      <button
        disabled
        className={cn(
          'px-6 py-3 rounded-xl bg-gray-800 text-gray-400 cursor-not-allowed',
          className
        )}
      >
        <ButtonLoading text="Connecting..." />
      </button>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <ErrorDisplay
          title="Connection Error"
          message={error.message || 'Failed to connect wallet'}
          type="error"
          onRetry={() => connect()}
        />
      </div>
    );
  }

  // Disconnected state - show connect button
  return (
    <button
      onClick={() => connect()}
      className={cn(
        'px-6 py-3 rounded-xl bg-gradient-to-r from-kek-green to-[#4ecca7] text-black font-bold',
        'hover:scale-105 transition flex items-center gap-2',
        className
      )}
    >
      <Wallet className="w-5 h-5" />
      Connect Wallet
    </button>
  );
}

/**
 * Compact wallet button for navigation bars
 */
export function CompactWalletButton() {
  const { address, isConnected, connect } = useWallet();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-sm text-gray-300 font-mono">
          {address.slice(0, 4)}...{address.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect()}
      className="px-4 py-2 rounded-lg bg-kek-green text-black font-semibold hover:bg-kek-green/90 transition text-sm"
    >
      Connect
    </button>
  );
}
