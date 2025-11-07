'use client'

import { useAccount } from 'wagmi'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ComprehensiveDashboard } from '@/components/dashboard/ComprehensiveDashboard'
import { BlurredTitleSection } from '@/components/ui/BlurredTitleSection'

/**
 * Dashboard Page
 *
 * Comprehensive portfolio dashboard showing:
 * - TECH token balance (ERC-20)
 * - KEKTECH NFT collection (ERC-721)
 * - KEKTECH Vouchers (ERC-1155)
 * - Portfolio overview and statistics
 *
 * Force dynamic rendering to prevent static generation issues with Web3 hooks
 */

// Force dynamic rendering (required for client-side Web3 hooks)
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { address, isConnected } = useAccount()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Page Header with Blurred Background */}
          <BlurredTitleSection
            title="Your Dashboard"
            subtitle="Comprehensive view of your TECH tokens, NFTs, and vouchers"
          />

          {/* Dashboard Content */}
          {isConnected && address ? (
            <ComprehensiveDashboard address={address} />
          ) : (
            <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-12 text-center max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🔗</div>
              <h2 className="font-fredoka text-2xl font-bold text-white mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Connect your wallet to view your complete portfolio including TECH tokens,
                KEKTECH NFTs, vouchers, and rewards.
              </p>
              <p className="text-sm text-gray-500">
                Click the &quot;Connect Wallet&quot; button in the header to get started
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
