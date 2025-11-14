import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

// Lazy load FeaturedNFTs (Next.js 15 App Router pattern)
// This component makes API calls and renders many images - load it only when needed
const FeaturedNFTs = dynamic(
  () => import('@/components/sections/FeaturedNFTs').then((mod) => ({ default: mod.FeaturedNFTs })),
  {
    loading: () => (
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 sm:py-24 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-kek-green sm:text-4xl mb-4 font-fredoka">
              Featured NFTs
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto font-fredoka">
              Loading featured NFTs...
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 animate-pulse">
                <div className="aspect-square bg-gray-700" />
                <div className="p-3">
                  <div className="h-4 bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
  }
)

/**
 * KEKTECH Homepage
 * Marketing-focused landing page with sections for Hero, Featured Artifacts, Roadmap, and About Us
 */
export default function Homepage() {

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-black to-gray-950">
        {/* Hero Section - With tech.gif */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero GIF - Above fold: priority loading (Context7 optimized) */}
            <div className="mb-8 flex justify-center">
              <Image
                src="/images/tech.gif"
                alt="𝕂Ǝ𝕂丅ᵉ匚🅷 Collection"
                width={700}
                height={450}
                className="max-w-full h-auto rounded-lg"
                unoptimized
                priority
                quality={90}
              />
            </div>

            {/* Hero Text */}
            <p className="font-fredoka text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
              <span className="font-bold text-kek-green">4200 𝕂Ǝ𝕂丅ᵉ匚🅷 Artifacts</span>
              : digital masterpieces blending tech and meme fun, hand-drawn by{' '}
              <span className="font-bold text-[#4ecca7]">𝔹enzo𝔹ert & Princess 𝔹u𝔹𝔹legum</span>
              . An homage to{' '}
              <span className="font-bold text-kek-green">OG Pepecoin 🐸👑</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/marketplace"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-kek-green to-[#4ecca7] p-[2px] shadow-lg shadow-kek-green/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-kek-green/70"
              >
                <div className="relative rounded-[10px] bg-gray-900 px-8 py-4 transition-all group-hover:bg-transparent">
                  <span className="text-lg font-bold text-kek-green group-hover:text-black font-fredoka">
                    Start Minting
                  </span>
                </div>
              </Link>
              <Link
                href="/gallery"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-kek-green to-[#4ecca7] p-[2px] shadow-lg shadow-kek-green/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-kek-green/70"
              >
                <div className="relative rounded-[10px] bg-gray-900 px-8 py-4 transition-all group-hover:bg-transparent">
                  <span className="text-lg font-bold text-kek-green group-hover:text-black font-fredoka">
                    Explore Gallery
                  </span>
                </div>
              </Link>
              <Link
                href="/feels-good-markets/kek-futures"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-kek-green to-[#4ecca7] p-[2px] shadow-lg shadow-kek-green/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-kek-green/70"
              >
                <div className="relative rounded-[10px] bg-gray-900 px-8 py-4 transition-all group-hover:bg-transparent">
                  <span className="text-lg font-bold text-kek-green group-hover:text-black font-fredoka">
                    🎲 Explore Markets
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Artifacts Section - Dynamic with Rotation */}
      <FeaturedNFTs />

      {/* Roadmap Section */}
      <section id="roadmap" className="bg-gradient-to-b from-gray-900 to-gray-950 py-20 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-kek-green text-center mb-12 font-fredoka">
            ROADMAP
          </h2>

          {/* Visual Roadmap Image - Below fold: lazy loading (Context7 optimized) */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="rounded-2xl overflow-hidden border border-kek-green/30 shadow-lg shadow-kek-green/10">
              <Image
                src="/images/kekorama.jpg"
                alt="KEKTECH Roadmap Visual"
                width={1400}
                height={800}
                className="w-full h-auto"
                loading="lazy"
                quality={85}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
            {/* Phase 1 */}
            <div className="relative bg-gradient-to-br from-kek-green/10 to-transparent rounded-2xl border border-kek-green/20 p-8 overflow-hidden">
              {/* Checkered Background Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
              <div className="relative">
              <h3 className="text-2xl font-bold text-kek-green mb-4 font-fredoka">Phase 1: Collection Launch</h3>
              <ul className="space-y-3 text-gray-300">
                <li>→ Release of our founding collection: 4,200 uniquely crafted Pepe NFTs</li>
                <li>→ Pricing set at 18.369 $BASED per NFT</li>
                <li>→ Community building, NFT give-aways</li>
                <li>→ Snapshots for token airdrop</li>
              </ul>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="relative bg-gradient-to-br from-[#4ecca7]/10 to-transparent rounded-2xl border border-[#4ecca7]/20 p-8 overflow-hidden">
              {/* Checkered Background Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
              <div className="relative">
              <h3 className="text-2xl font-bold text-[#4ecca7] mb-4 font-fredoka">Phase 2: Reward System Implementation</h3>
              <ul className="space-y-3 text-gray-300">
                <li>→ Establishment of the token economy that will power future upgrades</li>
                <li>→ Token airdrop with multiplier for early supporters</li>
                <li>→ Rarity and stacking multiplier - hold rare and multiple NFTs to get higher token emissions!</li>
                <li>→ Introduction of daily token rewards for all NFT holders</li>
              </ul>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="relative bg-gradient-to-br from-kek-green/10 to-transparent rounded-2xl border border-kek-green/20 p-8 overflow-hidden">
              {/* Checkered Background Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
              <div className="relative">
              <h3 className="text-2xl font-bold text-kek-green mb-4 font-fredoka">Phase 3: Limited Edition Mint</h3>
              <ul className="space-y-3 text-gray-300">
                <li>→ Limited edition free mint of 420 handpicked NFTs</li>
                <li>→ Main collection NFT holders with Easter Egg traits qualify for the 420 limited edition free mint</li>
              </ul>
              </div>
            </div>

            {/* Phase 4 */}
            <div className="relative bg-gradient-to-br from-[#4ecca7]/10 to-transparent rounded-2xl border border-[#4ecca7]/20 p-8 overflow-hidden">
              {/* Checkered Background Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
              <div className="relative">
              <h3 className="text-2xl font-bold text-[#4ecca7] mb-4 font-fredoka">Phase 4: NFT Upgrading System</h3>
              <ul className="space-y-3 text-gray-300">
                <li>→ Introduction of new handcrafted characters and attributes</li>
                <li>→ Interactive, gamified upgrade experience allowing holders to choose their path</li>
                <li>→ Use earned rewards to make meaningful choices that shape your unique Pepe PFP</li>
                <li>→ Unlock the full potential of all Easter eggs hidden throughout the collection</li>
              </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-kek-green text-center mb-16 font-fredoka">About Us</h2>

          {/* First Row: Text Left, Image Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              <p className="text-gray-300 leading-relaxed">
                𝕂Ǝ𝕂TECH emerges from the intersection of art and blockchain technology, born from our appreciation for the PepeCoin legacy dating back to 2016. Our dedicated team initially envisioned a modest NFT collection but found ourselves captivated by the energy of the PepeCoin 🐸 and $BASED 🧠 communities.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Our creative journey began in early 2024 within the thriving PepeCoin movement. Through Pepepaint, our team discovered a digital canvas where Pepe art could flourish in new ways. This discovery helped us grow as artists and develop a clear vision for our project.
              </p>
              <p className="text-gray-300 leading-relaxed">
                What started as artistic exploration evolved into something meaningful when our early artwork received recognition from Pepelovers 🐸 and other respected figures in the Pepe community. This endorsement fueled our determination to craft more distinctive Pepe art and build something valuable for fellow enthusiasts. With each creation, we deepen our commitment to honoring the culture that brought us together. 🐸🤝
              </p>
            </div>

            <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-kek-green/30">
              <Image
                src="/images/1.png"
                alt="KEKTECH NFT Artwork"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
                quality={85}
              />
            </div>
          </div>

          {/* Second Row: Image Left, Text Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-kek-green/30 lg:order-1">
              <Image
                src="/images/2.png"
                alt="KEKTECH NFT Collection"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
                quality={85}
              />
            </div>

            <div className="space-y-6 lg:order-2">
              <h3 className="text-2xl font-bold text-kek-green font-fredoka">Our Vision</h3>
              <p className="text-gray-300 leading-relaxed">
                At 𝕂Ǝ𝕂TECH, we aim to create more than just another NFT collection. We envision a dynamic ecosystem where art, community, and technology converge to create lasting value. At our core, spreading fresh, dank Pepe art throughout the crypto space drives everything we do. We&apos;re building a platform where holders can customize their digital identities, earn rewards, and participate in the evolution of the collection itself.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Our mission extends beyond digital assets—we&apos;re committed to producing high-quality Pepe art that celebrates the culture and contributes to the broader crypto art space. This is our homage to the communities that inspired us and our contribution to the ever-evolving PEPENING 🐸🚀 movement.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Community Journey Section */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-20 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold text-kek-green mb-6 font-fredoka">
              Community Journey
            </h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              We&apos;re committed to engaging with our community at every step. We value your feedback and will adapt our vision to create the best experience for our holders. Above all, we&apos;re dedicated to our highest utility: spreading dank Pepe art throughout the space, bringing creative joy to the broader crypto community. 🐸🎨🔥 We strongly believe in collaborations and will pursue partnerships with other $Based NFT communities to create opportunities that strengthen the entire ecosystem.
            </p>

            {/* Making Of GIF - Below fold: lazy loading (Context7 optimized) */}
            <div className="rounded-2xl overflow-hidden border border-kek-green/20 mt-8">
              <Image
                src="/images/makingof.gif"
                alt="KEKTECH Creative Process - Behind the Scenes"
                width={1200}
                height={675}
                className="w-full h-auto"
                unoptimized
                loading="lazy"
              />
            </div>
            <p className="text-center text-gray-400 mt-4 text-sm">
              Watch our artistic process: hand-drawing each unique 𝕂Ǝ𝕂TECH artifact
            </p>
          </div>
        </div>
      </section>

      </main>

      <Footer />
    </div>
  )
}
