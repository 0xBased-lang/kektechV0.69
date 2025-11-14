'use client'

import Link from 'next/link'
import { BlurredTitleSection } from '@/components/ui/BlurredTitleSection'

/**
 * Frog Futures Page
 *
 * Placeholder page for upcoming Frog Futures product
 * Revolutionary meme prediction markets
 */
export default function FrogFuturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Page Header */}
          <BlurredTitleSection
            title="🐸 Frog Futures"
            subtitle="Revolutionary meme prediction markets"
          />

          {/* Coming Soon Content */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-12 text-center">
              {/* Large Icon */}
              <div className="text-9xl mb-8">🐸</div>

              {/* Title */}
              <h2 className="text-4xl font-fredoka font-bold text-[#4ecca7] mb-6">
                Coming Soon
              </h2>

              {/* Description */}
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Frog Futures will bring revolutionary meme-based prediction markets
                to the KEKTECH platform. Get ready for the next generation of
                community-driven market making!
              </p>

              {/* Features List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-black/40 rounded-lg p-6 border border-[#4ecca7]/20">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-fredoka font-bold text-white mb-2">Meme Markets</h3>
                  <p className="text-sm text-gray-400">
                    Predict the future of your favorite memes
                  </p>
                </div>
                <div className="bg-black/40 rounded-lg p-6 border border-[#4ecca7]/20">
                  <div className="text-3xl mb-3">💎</div>
                  <h3 className="font-fredoka font-bold text-white mb-2">Community Driven</h3>
                  <p className="text-sm text-gray-400">
                    Powered by the KEKTECH community
                  </p>
                </div>
                <div className="bg-black/40 rounded-lg p-6 border border-[#4ecca7]/20">
                  <div className="text-3xl mb-3">🚀</div>
                  <h3 className="font-fredoka font-bold text-white mb-2">Ultra Low Fees</h3>
                  <p className="text-sm text-gray-400">
                    Built on BasedAI for minimal costs
                  </p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/feels-good-markets"
                  className="px-8 py-3 bg-[#4ecca7] text-black rounded-lg font-fredoka font-bold hover:bg-kek-green transition-all hover:scale-105 shadow-lg shadow-[#4ecca7]/30"
                >
                  Back to Markets
                </Link>
                <Link
                  href="/feels-good-markets/kek-futures"
                  className="px-8 py-3 bg-gray-800 text-white rounded-lg font-fredoka font-bold hover:bg-gray-700 transition-all border border-gray-700"
                >
                  Try KEK Futures
                </Link>
              </div>
            </div>

            {/* Stay Updated Section */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Want to be notified when Frog Futures launches? Follow us on social media for updates!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
