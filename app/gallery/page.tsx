import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { NFTGallery } from '@/components/nft/NFTGallery'
import { BlurredTitleSection } from '@/components/ui/BlurredTitleSection'

/**
 * Gallery Page
 *
 * NFT gallery displaying all minted KEKTECH NFTs with collection statistics
 */
export default function GalleryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Page Header with Blurred Background */}
          <BlurredTitleSection
            title="𝕂Ǝ𝕂丅ᵉ匚🅷 Gallery"
            subtitle="Explore all minted 𝕂Ǝ𝕂TECH NFTs on the $BASED Chain"
          />

          {/* NFT Gallery with Tabs (Stats widget inside Ranking tab only) */}
          <NFTGallery />
        </div>
      </main>

      <Footer />
    </div>
  )
}
