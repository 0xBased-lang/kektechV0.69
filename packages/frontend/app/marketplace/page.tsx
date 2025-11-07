'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MintTab } from '@/components/marketplace/MintTab'
import { TradeTab } from '@/components/marketplace/TradeTab'
import { BlurredTitleSection } from '@/components/ui/BlurredTitleSection'

/**
 * Marketplace Page
 *
 * Unified marketplace with four tabs:
 * - Mint: NFT minting interface
 * - Surprise: Surprise mechanics (coming soon)
 * - KEKTV: KEKTV voucher trading marketplace
 * - Limited Edition: Special limited edition items
 */
export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'mint' | 'surprise' | 'kektv' | 'limited'>('mint')

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Page Header with Blurred Background */}
          <BlurredTitleSection
            title="𝕂Ǝ𝕂丅ᵉ匚🅷 Marketplace"
            subtitle="Mint new NFTs or trade KEKTV vouchers"
          />

          {/* Tab Navigation - Dashboard Style */}
          <div className="mb-8 space-y-4">
            <div className="flex justify-center">
              <div className="inline-flex gap-2 rounded-xl bg-gray-900/60 p-1 border border-gray-800">
                <button
                  onClick={() => setActiveTab('mint')}
                  className={`
                    px-8 py-3 rounded-lg font-fredoka font-bold transition-all duration-200
                    ${activeTab === 'mint'
                      ? 'bg-[#3fb8bd] text-black shadow-lg shadow-[#3fb8bd]/20'
                      : 'text-[#3fb8bd] hover:text-white hover:bg-gray-800/50'
                    }
                  `}
                >
                  Mint
                </button>
                <button
                  onClick={() => setActiveTab('surprise')}
                  className={`
                    px-8 py-3 rounded-lg font-fredoka font-bold transition-all duration-200 text-2xl
                    ${activeTab === 'surprise'
                      ? 'bg-[#4ecca7] shadow-lg shadow-[#4ecca7]/20'
                      : 'hover:bg-gray-800/50'
                    }
                  `}
                >
                  👀
                </button>
                <button
                  onClick={() => setActiveTab('kektv')}
                  className={`
                    px-8 py-3 rounded-lg font-fredoka font-bold transition-all duration-200
                    ${activeTab === 'kektv'
                      ? 'bg-[#daa520] text-black shadow-lg shadow-[#daa520]/20'
                      : 'text-[#daa520] hover:text-white hover:bg-gray-800/50'
                    }
                  `}
                >
                  𝕂Ǝ𝕂TV
                </button>
                <button
                  onClick={() => setActiveTab('limited')}
                  className={`
                    px-8 py-3 rounded-lg font-fredoka font-bold transition-all duration-200
                    ${activeTab === 'limited'
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                      : 'text-purple-400 hover:text-white hover:bg-gray-800/50'
                    }
                  `}
                >
                  Limited Edition
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === 'mint' && <MintTab />}
            {activeTab === 'surprise' && (
              <div className="text-center py-24">
                <div className="text-8xl mb-6">👀</div>
                <h2 className="text-3xl font-bold text-[#4ecca7] mb-4 font-fredoka">Surprise Mechanics</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Exciting surprise features coming soon! Stay tuned
                </p>
              </div>
            )}
            {activeTab === 'kektv' && <TradeTab />}
            {activeTab === 'limited' && (
              <div className="text-center py-24">
                <div className="text-8xl mb-6">⭐</div>
                <h2 className="text-3xl font-bold text-purple-400 mb-4 font-fredoka">Limited Edition</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Exclusive limited edition NFTs. Check back soon for rare drops!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
