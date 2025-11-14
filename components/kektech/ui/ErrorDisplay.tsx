/**
 * KEKTECH 3.0 - Error Display Component
 * Reusable error handling and display
 */
'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, XCircle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  details?: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  className?: string;
}

const typeStyles = {
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: XCircle,
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    icon: AlertCircle,
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: AlertCircle,
  },
};

/**
 * Error display with optional retry button
 */
export function ErrorDisplay({
  title = 'Error',
  message,
  details,
  type = 'error',
  onRetry,
  className
}: ErrorDisplayProps) {
  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        style.bg,
        style.border,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', style.text)} />
        <div className="flex-1 min-w-0">
          <h3 className={cn('font-semibold mb-1', style.text)}>{title}</h3>
          <p className="text-sm text-gray-300">{message}</p>
          {details && (
            <details className="mt-2">
              <summary className={cn('cursor-pointer text-xs', style.text)}>
                Technical details
              </summary>
              <pre className="mt-2 text-xs text-gray-400 overflow-auto p-2 bg-black/20 rounded">
                {details}
              </pre>
            </details>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className={cn(
                'mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition',
                'bg-gray-800 hover:bg-gray-700',
                style.text
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error for forms
 */
export function InlineError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-red-400 mt-1">
      <XCircle className="w-4 h-4" />
      {message}
    </p>
  );
}

/**
 * Transaction error helper
 */
export function TransactionError({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  // Parse common transaction errors
  let message = error.message;
  let title = 'Transaction Failed';

  if (message.includes('user rejected')) {
    title = 'Transaction Cancelled';
    message = 'You cancelled the transaction in your wallet.';
  } else if (message.includes('insufficient funds')) {
    title = 'Insufficient Funds';
    message = 'You don\'t have enough BASED to complete this transaction.';
  } else if (message.includes('gas')) {
    title = 'Gas Estimation Failed';
    message = 'Unable to estimate gas cost. The transaction may fail.';
  } else if (message.includes('reverted')) {
    title = 'Contract Error';
    message = 'The smart contract rejected this transaction.';
  }

  return (
    <ErrorDisplay
      title={title}
      message={message}
      details={error.message}
      onRetry={onRetry}
    />
  );
}
