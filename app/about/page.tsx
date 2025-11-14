'use client'

import Link from 'next/link'
import { BlurredTitleSection } from '@/components/ui/BlurredTitleSection'

/**
 * About Us Page
 *
 * Information about KEKTECH platform, mission, and features
 */
export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Page Header */}
          <BlurredTitleSection
            title="About KEKTECH"
            subtitle="Building the future of decentralized markets on BasedAI"
          />

          {/* Main Content */}
          <div className="mt-12 max-w-5xl mx-auto space-y-12">

            {/* Mission Section */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl">🎯</div>
                <h2 className="text-3xl font-fredoka font-bold text-white">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-300 leading-relaxed">
                KEKTECH is revolutionizing decentralized markets on the BasedAI blockchain.
                We&apos;re building a platform where prediction markets, NFTs, and DeFi come together
                to create unprecedented opportunities for our community.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-8">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-2xl font-fredoka font-bold text-kek-green mb-4">
                  KEK Futures
                </h3>
                <p className="text-gray-300 mb-4">
                  Trade on real-world events with ultra-low fees. Our prediction markets
                  are 1000x cheaper than competitors thanks to BasedAI&apos;s efficiency.
                </p>
                <Link
                  href="/feels-good-markets/kek-futures"
                  className="text-kek-green hover:text-[#4ecca7] font-semibold"
                >
                  Explore Markets →
                </Link>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-8">
                <div className="text-4xl mb-4">🖼️</div>
                <h3 className="text-2xl font-fredoka font-bold text-purple-400 mb-4">
                  NFT Marketplace
                </h3>
                <p className="text-gray-300 mb-4">
                  Collect exclusive KEKTECH NFTs with unique utilities.
                  Mint, trade, and earn rewards in our vibrant marketplace.
                </p>
                <Link
                  href="/feels-good-markets/nft-marketplace"
                  className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                  Browse NFTs →
                </Link>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-8">
                <div className="text-4xl mb-4">🐸</div>
                <h3 className="text-2xl font-fredoka font-bold text-[#4ecca7] mb-4">
                  Frog Futures
                </h3>
                <p className="text-gray-300 mb-4">
                  Revolutionary meme-based prediction markets coming soon.
                  The future of community-driven market making.
                </p>
                <span className="text-gray-500 font-semibold">
                  Coming Soon
                </span>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-8">
                <div className="text-4xl mb-4">💎</div>
                <h3 className="text-2xl font-fredoka font-bold text-kek-green mb-4">
                  Staking
                </h3>
                <p className="text-gray-300 mb-4">
                  Stake your KEK tokens to earn passive rewards and participate
                  in platform governance.
                </p>
                <span className="text-gray-500 font-semibold">
                  Coming Soon
                </span>
              </div>
            </div>

            {/* Why BasedAI Section */}
            <div className="bg-gradient-to-br from-kek-green/10 to-[#4ecca7]/10 border border-kek-green/30 rounded-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl">⚡</div>
                <h2 className="text-3xl font-fredoka font-bold text-white">Why BasedAI?</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-kek-green mb-2">$0.0001</div>
                  <p className="text-gray-300">Per transaction</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-[#4ecca7] mb-2">&lt;2s</div>
                  <p className="text-gray-300">Block finality</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-400 mb-2">1000x</div>
                  <p className="text-gray-300">Cheaper than competitors</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center py-8">
              <h2 className="text-3xl font-fredoka font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/feels-good-markets"
                  className="px-10 py-4 bg-kek-green text-black rounded-lg text-lg font-fredoka font-bold hover:bg-[#4ecca7] transition-all hover:scale-105 shadow-lg shadow-kek-green/30"
                >
                  Explore Markets
                </Link>
                <Link
                  href="/dashboard"
                  className="px-10 py-4 bg-gray-800 text-white rounded-lg text-lg font-fredoka font-bold hover:bg-gray-700 transition-all border border-gray-700"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
