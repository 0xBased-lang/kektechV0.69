'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { BlurredTitleSection } from '@/components/ui/BlurredTitleSection'
import { ComprehensiveDashboard } from '@/components/dashboard/ComprehensiveDashboard'
import { PositionList } from '@/components/kektech/positions/PositionList'

/**
 * Unified Dashboard Page
 *
 * Tabbed dashboard showing:
 * - Overview: Combined portfolio view
 * - NFT Portfolio: TECH tokens, NFTs, and vouchers
 * - KEK Futures: Prediction market positions
 * - Frog Futures: Coming soon placeholder
 */

// Force dynamic rendering (required for client-side Web3 hooks)
export const dynamic = 'force-dynamic'

type TabType = 'overview' | 'nft' | 'kek' | 'frog'

export default function DashboardPage() {
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
                      onClick={() => setActiveTab('nft')}
                      className={`
                        px-8 py-3 rounded-lg font-fredoka font-bold transition-all duration-200
                        ${activeTab === 'nft'
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                          : 'text-purple-400 hover:text-white hover:bg-gray-800/50'
                        }
                      `}
                    >
                      NFT Portfolio
                    </button>
                    <button
                      onClick={() => setActiveTab('kek')}
                      className={`
                        px-8 py-3 rounded-lg font-fredoka font-bold transition-all duration-200
                        ${activeTab === 'kek'
                          ? 'bg-[#4ecca7] text-black shadow-lg shadow-[#4ecca7]/20'
                          : 'text-[#4ecca7] hover:text-white hover:bg-gray-800/50'
                        }
                      `}
                    >
                      KEK Futures
                    </button>
                    <button
                      onClick={() => setActiveTab('frog')}
                      disabled
                      className={`
                        px-8 py-3 rounded-lg font-fredoka font-bold transition-all duration-200 opacity-50 cursor-not-allowed
                        text-green-400
                      `}
                    >
                      Frog Futures
                      <span className="ml-2 text-xs">Soon</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="mt-8">
                {activeTab === 'overview' && (
                  <div>
                    {/* Combined Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <OverviewCard
                        title="NFT Collection"
                        value="View NFTs"
                        icon="🖼️"
                        onClick={() => setActiveTab('nft')}
                      />
                      <OverviewCard
                        title="KEK Futures"
                        value="View Positions"
                        icon="📈"
                        onClick={() => setActiveTab('kek')}
                      />
                      <OverviewCard
                        title="Coming Soon"
                        value="Frog Futures"
                        icon="🐸"
                        disabled
                      />
                    </div>
                    {/* Recent Activity could go here */}
                    <ComprehensiveDashboard address={address} />
                  </div>
                )}

                {activeTab === 'nft' && (
                  <div>
                    <ComprehensiveDashboard address={address} />
                  </div>
                )}

                {activeTab === 'kek' && (
                  <div>
                    <h2 className="text-2xl font-fredoka font-bold text-white mb-6">
                      My Prediction Market Positions
                    </h2>
                    <PositionList />
                  </div>
                )}

                {activeTab === 'frog' && (
                  <div className="text-center py-24 bg-gray-900/60 rounded-xl border border-gray-800">
                    <div className="text-8xl mb-6">🐸</div>
                    <h2 className="text-3xl font-bold text-[#4ecca7] mb-4 font-fredoka">
                      Frog Futures Coming Soon
                    </h2>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Revolutionary meme prediction markets are on the way!
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// Overview Card Component
interface OverviewCardProps {
  title: string
  value: string
  icon: string
  onClick?: () => void
  disabled?: boolean
}

function OverviewCard({ title, value, icon, onClick, disabled }: OverviewCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-gray-900/60 border border-gray-800 rounded-xl p-6 text-left
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-[#3fb8bd] transition cursor-pointer'
        }
      `}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
      <p className="text-xl font-fredoka font-bold text-white">{value}</p>
    </button>
  )
}
