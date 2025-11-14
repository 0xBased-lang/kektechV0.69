'use client'

import Link from 'next/link'
import { BlurredTitleSection } from '@/components/ui/BlurredTitleSection'

/**
 * Staking Page
 *
 * Placeholder page for upcoming staking features
 * Earn rewards by staking KEK tokens
 */
export default function StakingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Page Header */}
          <BlurredTitleSection
            title="Staking"
            subtitle="Earn rewards by staking your KEK tokens"
          />

          {/* Coming Soon Content */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-12 text-center">
              {/* Large Icon */}
              <div className="text-9xl mb-8">💎</div>

              {/* Title */}
              <h2 className="text-4xl font-fredoka font-bold text-kek-green mb-6">
                Coming Soon
              </h2>

              {/* Description */}
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Stake your KEK tokens to earn passive rewards and participate
                in platform governance. The future of decentralized finance awaits!
              </p>

              {/* Features List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-black/40 rounded-lg p-6 border border-kek-green/20">
                  <div className="text-3xl mb-3">💰</div>
                  <h3 className="font-fredoka font-bold text-white mb-2">Passive Rewards</h3>
                  <p className="text-sm text-gray-400">
                    Earn rewards while you stake
                  </p>
                </div>
                <div className="bg-black/40 rounded-lg p-6 border border-kek-green/20">
                  <div className="text-3xl mb-3">🗳️</div>
                  <h3 className="font-fredoka font-bold text-white mb-2">Governance</h3>
                  <p className="text-sm text-gray-400">
                    Vote on platform decisions
                  </p>
                </div>
                <div className="bg-black/40 rounded-lg p-6 border border-kek-green/20">
                  <div className="text-3xl mb-3">🔒</div>
                  <h3 className="font-fredoka font-bold text-white mb-2">Secure</h3>
                  <p className="text-sm text-gray-400">
                    Built on BasedAI technology
                  </p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/feels-good-markets"
                  className="px-8 py-3 bg-kek-green text-black rounded-lg font-fredoka font-bold hover:bg-[#4ecca7] transition-all hover:scale-105 shadow-lg shadow-kek-green/30"
                >
                  Explore Markets
                </Link>
                <Link
                  href="/gallery"
                  className="px-8 py-3 bg-gray-800 text-white rounded-lg font-fredoka font-bold hover:bg-gray-700 transition-all border border-gray-700"
                >
                  Visit Gallery
                </Link>
              </div>
            </div>

            {/* Stay Updated Section */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Want to be first to know when staking goes live? Join our community!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
