'use client'

import Link from 'next/link'
import { TECH_TOKEN } from '@/config/contracts'

interface TechTokenCardProps {
  balance: string
  balanceFormatted: string
  balanceCompact: string
  isLoading: boolean
}

/**
 * TechTokenCard Component
 *
 * Prominent display of TECH token balance with quick actions
 */
export function TechTokenCard({
  balance,
  balanceFormatted,
  isLoading,
}: TechTokenCardProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl border border-cyan-500/20 p-8 mb-8 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 w-32 bg-gray-800 rounded mb-2"></div>
            <div className="h-10 w-48 bg-gray-800 rounded"></div>
          </div>
          <div className="h-16 w-16 bg-gray-800 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  const hasBalance = parseFloat(balance) > 0

  return (
    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/30 p-8 mb-8 hover:border-cyan-500/50 transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-cyan-400 font-fredoka">
              {TECH_TOKEN.name} Token
            </h3>
            <span className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
              ERC-20
            </span>
          </div>
          <div className="text-4xl md:text-5xl font-bold text-white font-fredoka">
            {balanceFormatted} <span className="text-2xl text-gray-400">{TECH_TOKEN.symbol}</span>
          </div>
          {hasBalance && (
            <div className="text-sm text-gray-400 mt-1">
              Exact: {balance} {TECH_TOKEN.symbol}
            </div>
          )}
        </div>

        {/* Icon */}
        <div className="hidden md:flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-4xl">
          💎
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800">
          <div className="text-xs text-gray-400 mb-1">Token Symbol</div>
          <div className="text-lg font-bold text-white">{TECH_TOKEN.symbol}</div>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800">
          <div className="text-xs text-gray-400 mb-1">Contract</div>
          <div className="text-xs font-mono text-white truncate">
            {TECH_TOKEN.address.slice(0, 6)}...{TECH_TOKEN.address.slice(-4)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={TECH_TOKEN.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[200px] px-6 py-3 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold hover:bg-cyan-500/30 transition text-center font-fredoka"
        >
          🔍 View on Explorer
        </Link>
      </div>

      {!hasBalance && (
        <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
          <p className="text-sm text-yellow-300">
            ℹ️ You don&apos;t have any TECH tokens yet
          </p>
        </div>
      )}
    </div>
  )
}
