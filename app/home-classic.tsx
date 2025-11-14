import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TraitDistribution } from '@/components/traits/TraitDistribution'
import { EnhancedHero } from '@/components/homepage/EnhancedHero'
import { FeaturedNFTs } from '@/components/sections/FeaturedNFTs'

/**
 * Homepage
 *
 * Landing page with hero section and wallet connection CTA
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Enhanced Hero Section with 3D Effects and Particles */}
        <EnhancedHero />

        {/* Featured NFTs Section */}
        <FeaturedNFTs />

        {/* Features Section */}
        <section className="bg-white py-16 dark:bg-gray-950 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Why KEKTECH?
              </h2>
              <p className="mb-12 text-lg text-gray-600 dark:text-gray-400">
                Join our growing community and own a piece of digital history
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="group rounded-lg border border-kek-green/30 bg-gray-900 p-6 transition-all hover:border-kek-green hover:shadow-lg hover:shadow-kek-green/20 dark:border-kek-green/30 dark:bg-gray-900">
                <div className="mb-4 text-4xl">⚡</div>
                <h3 className="mb-2 text-xl font-semibold text-white dark:text-white">
                  Fast Minting
                </h3>
                <p className="text-gray-300 dark:text-gray-300">
                  Lightning-fast transactions on the $BASED Chain with low gas fees
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group rounded-lg border border-kek-cyan/30 bg-gray-900 p-6 transition-all hover:border-kek-cyan hover:shadow-lg hover:shadow-kek-cyan/20 dark:border-kek-cyan/30 dark:bg-gray-900">
                <div className="mb-4 text-4xl">🎨</div>
                <h3 className="mb-2 text-xl font-semibold text-white dark:text-white">
                  Unique Art
                </h3>
                <p className="text-gray-300 dark:text-gray-300">
                  Each NFT is unique with provably rare traits and attributes
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group rounded-lg border border-kek-purple/30 bg-gray-900 p-6 transition-all hover:border-kek-purple hover:shadow-lg hover:shadow-kek-purple/20 dark:border-kek-purple/30 dark:bg-gray-900">
                <div className="mb-4 text-4xl">🌐</div>
                <h3 className="mb-2 text-xl font-semibold text-white dark:text-white">
                  Community
                </h3>
                <p className="text-gray-300 dark:text-gray-300">
                  Join a vibrant community of collectors and enthusiasts
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About us Section */}
        <section id="about" className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 dark:from-gray-900 dark:to-gray-950 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="mb-12 text-center font-fredoka text-4xl font-bold text-kek-green sm:text-5xl">
              About us
            </h2>

            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left Column - Text Content */}
              <div className="space-y-6">
                <p className="font-fredoka text-lg leading-relaxed text-gray-300">
                  𝕂Ǝ𝕂TECH emerges from the intersection of art and blockchain technology, born from our appreciation for the PepeCoin legacy dating back to 2016. Our dedicated team initially envisioned a modest NFT collection but found ourselves captivated by the energy of the PepeCoin 🐸 and $BASED 🧠 communities.
                </p>
                <p className="font-fredoka text-lg leading-relaxed text-gray-300">
                  Our creative journey began in early 2024 within the thriving PepeCoin movement. Through Pepepaint, our team discovered a digital canvas where Pepe art could flourish in new ways. This discovery helped us grow as artists and develop a clear vision for our project.
                </p>
                <p className="font-fredoka text-lg leading-relaxed text-gray-300">
                  What started as artistic exploration evolved into something meaningful when our early artwork received recognition from Pepelovers 🐸 and other respected figures in the Pepe community. This endorsement fueled our determination to craft more distinctive Pepe art and build something valuable for fellow enthusiasts. With each creation, we deepen our commitment to honoring the culture that brought us together. 🐸🤝
                </p>
              </div>

              {/* Right Column - Making-of GIF */}
              <div className="group relative overflow-hidden rounded-lg border-2 border-kek-green/30 shadow-lg shadow-kek-green/10 transition-all hover:border-kek-green hover:shadow-2xl hover:shadow-kek-green/30">
                <Image
                  src="/images/makingof.gif"
                  alt="𝕂Ǝ𝕂TECH Art"
                  width={600}
                  height={600}
                  className="h-auto w-full transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-kek-green/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </div>

            {/* Our Vision Section */}
            <div className="mt-16 mx-auto max-w-3xl space-y-6 text-center">
              <h3 className="font-fredoka text-3xl font-bold text-kek-green">
                Our Vision
              </h3>
              <p className="font-fredoka text-lg leading-relaxed text-gray-300">
                At 𝕂Ǝ𝕂TECH, we aim to create more than just another NFT collection. We envision a dynamic ecosystem where art, community, and technology converge to create lasting value. At our core, spreading fresh, dank Pepe art throughout the crypto space drives everything we do. We&apos;re building a platform where holders can customize their digital identities, earn rewards, and participate in the evolution of the collection itself.
              </p>
              <p className="font-fredoka text-lg leading-relaxed text-gray-300">
                Our mission extends beyond digital assets—we&apos;re committed to producing high-quality Pepe art that celebrates the culture and contributes to the broader crypto art space. This is our homage to the communities that inspired us and our contribution to the ever-evolving PEPENING 🐸🚀 movement.
              </p>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section id="roadmap" className="bg-gradient-to-b from-gray-950 to-black py-16 dark:from-gray-950 dark:to-black sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="mb-12 text-center font-fredoka text-4xl font-bold text-kek-green sm:text-5xl">
              ROADMAP
            </h2>

            {/* Roadmap Phases Grid */}
            <div className="mb-16 grid gap-8 md:grid-cols-2">
              {/* Phase 1 */}
              <div className="rounded-xl border border-kek-green/30 bg-gradient-to-br from-gray-900 to-gray-950 p-8 transition-all hover:border-kek-green hover:shadow-lg hover:shadow-kek-green/20">
                <h3 className="mb-6 font-fredoka text-2xl font-bold text-kek-green">
                  Phase 1: Collection Launch
                </h3>
                <ul className="space-y-3 font-fredoka text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Release of our founding collection: 4,200 uniquely crafted Pepe NFTs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Pricing set at 18.369 $BASED per NFT</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Community building, NFT give-aways</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Snapshots for token airdrop</span>
                  </li>
                </ul>
              </div>

              {/* Phase 2 */}
              <div className="rounded-xl border border-kek-green/30 bg-gradient-to-br from-gray-900 to-gray-950 p-8 transition-all hover:border-kek-green hover:shadow-lg hover:shadow-kek-green/20">
                <h3 className="mb-6 font-fredoka text-2xl font-bold text-kek-green">
                  Phase 2: Reward System Implementation
                </h3>
                <ul className="space-y-3 font-fredoka text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Establishment of the token economy that will power future upgrades</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Token airdrop with multiplier for early supporters</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Rarity and stacking multiplier - hold rare and multiple NFTs to get higher token emissions!</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Introduction of daily token rewards for all NFT holders</span>
                  </li>
                </ul>
              </div>

              {/* Phase 3 */}
              <div className="rounded-xl border border-kek-green/30 bg-gradient-to-br from-gray-900 to-gray-950 p-8 transition-all hover:border-kek-green hover:shadow-lg hover:shadow-kek-green/20">
                <h3 className="mb-6 font-fredoka text-2xl font-bold text-kek-green">
                  Phase 3: Limited Edition Mint
                </h3>
                <ul className="space-y-3 font-fredoka text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Limited edition free mint of 420 handpicked NFTs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Main collection NFT holders with Easter Egg traits qualify for the 420 limited edition free mint</span>
                  </li>
                </ul>
              </div>

              {/* Phase 4 */}
              <div className="rounded-xl border border-kek-green/30 bg-gradient-to-br from-gray-900 to-gray-950 p-8 transition-all hover:border-kek-green hover:shadow-lg hover:shadow-kek-green/20">
                <h3 className="mb-6 font-fredoka text-2xl font-bold text-kek-green">
                  Phase 4: NFT Upgrading System
                </h3>
                <ul className="space-y-3 font-fredoka text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Introduction of new handcrafted characters and attributes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Interactive, gamified upgrade experience allowing holders to choose their path</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Use earned rewards to make meaningful choices that shape your unique Pepe PFP</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-kek-green">→</span>
                    <span>Unlock the full potential of all Easter eggs hidden throughout the collection</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Community Journey */}
            <div className="rounded-xl border border-kek-green/30 bg-gradient-to-br from-gray-900 to-gray-950 p-8">
              <h3 className="mb-6 font-fredoka text-2xl font-bold text-kek-green">
                Community Journey
              </h3>
              <p className="mb-6 font-fredoka text-lg leading-relaxed text-gray-300">
                We&apos;re committed to engaging with our community at every step. We value your feedback and will adapt our vision to create the best experience for our holders. Above all, we&apos;re dedicated to our highest utility: spreading dank Pepe art throughout the space, bringing creative joy to the broader crypto community. 🐸🎨🔥 We strongly believe in collaborations and will pursue partnerships with other $Based NFT communities to create opportunities that strengthen the entire ecosystem.
              </p>
              {/* Making-of GIF */}
              <div className="group relative overflow-hidden rounded-lg border-2 border-kek-green/30 shadow-lg shadow-kek-green/10 transition-all hover:border-kek-green hover:shadow-2xl hover:shadow-kek-green/30">
                <Image
                  src="/images/makingof.gif"
                  alt="Making of 𝕂Ǝ𝕂TECH"
                  width={1200}
                  height={600}
                  className="h-auto w-full transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-kek-green/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </div>
          </div>
        </section>

        {/* Trait Distribution Section */}
        <section id="traits" className="bg-gradient-to-b from-black to-gray-950 py-16 dark:from-black dark:to-gray-950 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <TraitDistribution />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
