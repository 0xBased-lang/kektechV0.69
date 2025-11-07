'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button, LinkButton } from '@/components/ui/Button'

/**
 * Button Design System Showcase
 *
 * Comprehensive demo of all button variants, sizes, and states
 * for the KEKTECH design system
 */
export default function ButtonsDemoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-16 text-center">
            <h1 className="font-fredoka text-4xl font-bold text-[#3fb8bd] sm:text-5xl mb-4">
              Button Design System
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Clean, exclusive button design for the KEKTECH platform.
              Only 3 variants: Primary, Secondary, and Ghost - professional and refined.
            </p>
          </div>

          {/* Button Variants */}
          <section className="mb-16">
            <h2 className="font-fredoka text-3xl font-bold text-[#4ecca7] mb-8">Button Variants</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Primary */}
              <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-6">
                <h3 className="font-fredoka text-xl font-bold text-[#3fb8bd] mb-4">Primary</h3>
                <p className="text-gray-400 text-sm mb-4">Main CTAs - gradient fill with subtle shadow</p>
                <div className="space-y-4">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="primary" isLoading>Loading...</Button>
                </div>
              </div>

              {/* Secondary */}
              <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-6">
                <h3 className="font-fredoka text-xl font-bold text-[#3fb8bd] mb-4">Secondary</h3>
                <p className="text-gray-400 text-sm mb-4">Alternative actions - outlined with hover effect</p>
                <div className="space-y-4">
                  <Button variant="secondary">Secondary Action</Button>
                  <Button variant="secondary" isLoading>Loading...</Button>
                </div>
              </div>

              {/* Ghost */}
              <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-6">
                <h3 className="font-fredoka text-xl font-bold text-[#3fb8bd] mb-4">Ghost</h3>
                <p className="text-gray-400 text-sm mb-4">Minimal style - subtle interactions</p>
                <div className="space-y-4">
                  <Button variant="ghost">Ghost Action</Button>
                  <Button variant="ghost" isLoading>Loading...</Button>
                </div>
              </div>
            </div>
          </section>

          {/* Button Sizes */}
          <section className="mb-16">
            <h2 className="font-fredoka text-3xl font-bold text-[#4ecca7] mb-8">Button Sizes</h2>

            <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-8">
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium (Default)</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
            </div>
          </section>

          {/* Link Buttons */}
          <section className="mb-16">
            <h2 className="font-fredoka text-3xl font-bold text-[#4ecca7] mb-8">Link Buttons</h2>

            <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-8">
              <div className="flex flex-wrap gap-4">
                <LinkButton href="/gallery" variant="primary">
                  Primary Link
                </LinkButton>
                <LinkButton href="/mint" variant="secondary">
                  Secondary Link
                </LinkButton>
                <LinkButton href="https://twitter.com" variant="ghost" external>
                  External Link
                </LinkButton>
              </div>
            </div>
          </section>

          {/* Full Width Buttons */}
          <section className="mb-16">
            <h2 className="font-fredoka text-3xl font-bold text-[#4ecca7] mb-8">Full Width Buttons</h2>

            <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-8 max-w-2xl mx-auto">
              <div className="space-y-4">
                <Button variant="primary" fullWidth>
                  Full Width Primary
                </Button>
                <Button variant="secondary" fullWidth>
                  Full Width Secondary
                </Button>
              </div>
            </div>
          </section>

          {/* Disabled States */}
          <section className="mb-16">
            <h2 className="font-fredoka text-3xl font-bold text-[#4ecca7] mb-8">Disabled States</h2>

            <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-8">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" disabled>Primary Disabled</Button>
                <Button variant="secondary" disabled>Secondary Disabled</Button>
                <Button variant="ghost" disabled>Ghost Disabled</Button>
              </div>
            </div>
          </section>

          {/* Usage Examples */}
          <section className="mb-16">
            <h2 className="font-fredoka text-3xl font-bold text-[#4ecca7] mb-8">Real-World Examples</h2>

            {/* Hero CTA Example */}
            <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-8 mb-8">
              <h3 className="font-fredoka text-xl font-bold text-[#3fb8bd] mb-4">Hero Section CTAs</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <LinkButton href="/mint" variant="primary" size="lg">
                  Start Minting
                </LinkButton>
                <LinkButton href="/gallery" variant="secondary" size="lg">
                  Explore Gallery
                </LinkButton>
              </div>
            </div>

            {/* Page CTAs Example */}
            <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-8">
              <h3 className="font-fredoka text-xl font-bold text-[#3fb8bd] mb-4">Rewards Page CTAs</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <LinkButton href="/mint" variant="primary" size="lg">
                  Mint 𝕂Ǝ𝕂TECH NFTs
                </LinkButton>
                <LinkButton href="/gallery" variant="secondary" size="lg">
                  Browse Gallery
                </LinkButton>
              </div>
            </div>
          </section>

          {/* Code Examples */}
          <section className="mb-16">
            <h2 className="font-fredoka text-3xl font-bold text-[#4ecca7] mb-8">Usage Guide</h2>

            <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-8">
              <div className="space-y-6">
                <div>
                  <h4 className="font-fredoka text-lg font-bold text-[#3fb8bd] mb-2">Import</h4>
                  <code className="block bg-black/50 p-4 rounded text-[#4ecca7] text-sm">
                    {`import { Button, LinkButton } from '@/components/ui/Button'`}
                  </code>
                </div>

                <div>
                  <h4 className="font-fredoka text-lg font-bold text-[#3fb8bd] mb-2">Basic Button</h4>
                  <code className="block bg-black/50 p-4 rounded text-[#4ecca7] text-sm">
                    {`<Button variant="primary" size="lg">\n  Click Me\n</Button>`}
                  </code>
                </div>

                <div>
                  <h4 className="font-fredoka text-lg font-bold text-[#3fb8bd] mb-2">Link Button</h4>
                  <code className="block bg-black/50 p-4 rounded text-[#4ecca7] text-sm">
                    {`<LinkButton href="/mint" variant="primary" leftIcon="🚀">\n  Start Minting\n</LinkButton>`}
                  </code>
                </div>

                <div>
                  <h4 className="font-fredoka text-lg font-bold text-[#3fb8bd] mb-2">With Loading State</h4>
                  <code className="block bg-black/50 p-4 rounded text-[#4ecca7] text-sm">
                    {`<Button variant="primary" isLoading={loading}>\n  Submit\n</Button>`}
                  </code>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
