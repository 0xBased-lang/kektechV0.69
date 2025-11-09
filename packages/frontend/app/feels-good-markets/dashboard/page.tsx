'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { BlurredTitleSection } from '@/components/ui/BlurredTitleSection'
import { OverviewTab } from '@/components/dashboard/OverviewTab'
import { PortfolioTab } from '@/components/dashboard/PortfolioTab'
import { FeelsGoodTab } from '@/components/dashboard/FeelsGoodTab'

/**
 * Feels Good Markets Dashboard
 *
 * Unified dashboard with 3 tabs:
 * - Overview: Summary cards with quick navigation
 * - KEKTECH Portfolio: NFTs, tokens, vouchers
 * - Feels Good: Prediction market positions (KEK Futures + Frog Futures later)
 */

// Force dynamic rendering (required for client-side Web3 hooks)
export const dynamic = 'force-dynamic'

type TabType = 'overview' | 'portfolio' | 'feels-good'

export default function FeelsGoodDashboard() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Page Header */}
          <BlurredTitleSection
            title="Dashboard"
            subtitle="Your complete portfolio overview"
          />

          {/* Wallet Connection Required */}
          {!isConnected || !address ? (
            <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-12 text-center max-w-2xl mx-auto mt-8">
              <div className="text-6xl mb-6">🔗</div>
              <h2 className="font-fredoka text-2xl font-bold text-white mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Connect your wallet to view your complete portfolio including NFTs,
                prediction market positions, and rewards.
              </p>
              <p className="text-sm text-gray-500">
                Click the &quot;Connect Wallet&quot; button in the header to get started
              </p>
            </div>
          ) : (
            <>
              {/* Tab Navigation - Matching marketplace style */}
              <div className="mb-8 space-y-4 mt-8">
                <div className="flex justify-center">
                  <div className="inline-flex gap-2 rounded-xl bg-gray-900/60 p-1 border border-gray-800">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`
                        px-8 py-3 rounded-lg font-fredoka font-bold transition-all duration-200
                        ${activeTab === 'overview'
                          ? 'bg-[#3fb8bd] text-black shadow-lg shadow-[#3fb8bd]/20'
                          : 'text-[#3fb8bd] hover:text-white hover:bg-gray-800/50'
                        }
                      `}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('portfolio')}
                      className={`
                        px-8 py-3 rounded-lg font-fredoka font-bold transition-all duration-200
                        ${activeTab === 'portfolio'
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                          : 'text-purple-400 hover:text-white hover:bg-gray-800/50'
                        }
                      `}
                    >
                      KEKTECH Portfolio
                    </button>
                    <button
                      onClick={() => setActiveTab('feels-good')}
                      className={`
                        px-8 py-3 rounded-lg font-fredoka font-bold transition-all duration-200
                        ${activeTab === 'feels-good'
                          ? 'bg-[#4ecca7] text-black shadow-lg shadow-[#4ecca7]/20'
                          : 'text-[#4ecca7] hover:text-white hover:bg-gray-800/50'
                        }
                      `}
                    >
                      Feels Good
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="mt-8">
                {activeTab === 'overview' && (
                  <OverviewTab address={address} onTabChange={setActiveTab} />
                )}

                {activeTab === 'portfolio' && (
                  <PortfolioTab address={address} />
                )}

                {activeTab === 'feels-good' && (
                  <FeelsGoodTab address={address} />
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
