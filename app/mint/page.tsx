import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { EnhancedMintForm } from '@/components/web3/mint/EnhancedMintForm'

/**
 * Mint Page
 *
 * NFT minting interface with transaction handling
 */
export default function MintPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            {/* Page Header */}
            <div className="mb-8 text-center">
              <h1 className="mb-4 text-4xl font-bold text-white font-fredoka">
                Mint 𝕂Ǝ𝕂丅ᵉ匚🅷 NFTs
              </h1>
              <p className="text-lg text-gray-400">
                Join the 𝕂Ǝ𝕂丅ᵉ匚🅷 community on the $BASED Chain 🐸🚀
              </p>
            </div>

            {/* Enhanced Mint Form with Animations */}
            <EnhancedMintForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
