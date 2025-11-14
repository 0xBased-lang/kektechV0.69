'use client'

import { MarketCard } from '@/components/feels-good-markets/MarketCard'
import { BlurredTitleSection } from '@/components/ui/BlurredTitleSection'

/**
 * Feels Good Markets Landing Page
 *
 * Professional grid-based landing page showing 3 market options:
 * 1. KEK Futures (Primary - Live Now)
 * 2. NFT Marketplace (Secondary - Active)
 * 3. Frog Futures (Coming Soon)
 *
 * Redesigned to match KEKTECH design system with clear visual hierarchy
 */
export default function FeelsGoodMarketsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-950">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header with Blurred Background */}
        <BlurredTitleSection
          title="Feels Good Markets"
          subtitle="Three ways to earn on BasedAI"
        />

        {/* Hero CTA Section - Compact */}
        <section className="mb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-fredoka font-bold text-white mb-4">
              Trade, Predict, Collect
            </h2>
            <p className="text-lg text-gray-400 mb-6">
              Experience the future of decentralized markets on BasedAI
            </p>

            {/* Feature Badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="px-6 py-3 bg-gray-900/60 backdrop-blur-sm rounded-lg border border-kek-green/30">
                <span className="text-kek-green font-semibold">⚡ Ultra-Low Fees</span>
              </div>
              <div className="px-6 py-3 bg-gray-900/60 backdrop-blur-sm rounded-lg border border-[#4ecca7]/30">
                <span className="text-[#4ecca7] font-semibold">🚀 Instant Settlement</span>
              </div>
              <div className="px-6 py-3 bg-gray-900/60 backdrop-blur-sm rounded-lg border border-purple-500/30">
                <span className="text-purple-400 font-semibold">🛡️ Secure & Verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* Market Grid - 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* KEK Futures - Primary/Featured */}
          <MarketCard
            title="KEK Futures"
            description="Bet on real-world events with ultra-low fees. 1000x cheaper than competitors."
            features={[
              "$0.0001 per trade",
              "Live prediction markets",
              "LMSR bonding curve",
              "Instant settlement",
              "100% uptime"
            ]}
            icon="📈"
            gradient="from-kek-green to-[#2a8388]"
            badge="Live Now"
            badgeVariant="success"
            ctaText="Enter Markets"
            ctaLink="/feels-good-markets/kek-futures"
            isPrimary={true}
            size="large"
          />

          {/* NFT Marketplace - Secondary */}
          <MarketCard
            title="NFT Marketplace"
            description="Mint, trade, and collect exclusive KEKTECH NFTs and KEKTV vouchers."
            features={[
              "Mint unique NFTs",
              "Trade on marketplace",
              "Earn KEKTV vouchers",
              "Exclusive rewards"
            ]}
            icon="🖼️"
            gradient="from-purple-600 to-purple-800"
            ctaText="View Marketplace"
            ctaLink="/feels-good-markets/nft-marketplace"
          />

          {/* Frog Futures - Coming Soon */}
          <MarketCard
            title="Frog Futures"
            description="Revolutionary meme prediction markets. Community-driven, pepe-powered."
            features={[
              "Meme market predictions",
              "Community governance",
              "Rare frog NFTs",
              "Social rewards"
            ]}
            icon="🐸"
            gradient="from-[#4ecca7] to-[#37a580]"
            badge="Coming Soon"
            badgeVariant="warning"
            ctaText="Notify Me"
            isDisabled={true}
          />
        </div>

        {/* Stats/Social Proof Section */}
        <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-8 mb-12">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-fredoka font-bold text-white mb-2">
              Why Choose KEKTECH?
            </h3>
            <p className="text-gray-400">Built on BasedAI for maximum efficiency</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-fredoka font-bold text-kek-green mb-2">
                1000x
              </div>
              <p className="text-sm text-gray-400">Cheaper than competitors</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-fredoka font-bold text-[#4ecca7] mb-2">
                100%
              </div>
              <p className="text-sm text-gray-400">Uptime since launch</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-fredoka font-bold text-purple-400 mb-2">
                320
              </div>
              <p className="text-sm text-gray-400">Tests passing</p>
            </div>
          </div>
        </section>

        {/* Secondary CTA */}
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            Ready to start trading?
          </p>
          <a
            href="/feels-good-markets/kek-futures"
            className="inline-block px-10 py-4 bg-gradient-to-r from-kek-green to-[#4ecca7] text-black font-fredoka font-bold rounded-lg shadow-lg hover:shadow-xl hover:shadow-kek-green/30 transition-all hover:scale-105 active:scale-95"
          >
            Explore KEK Futures →
          </a>
        </div>
      </div>
    </main>
  )
}
