'use client'

import Image from 'next/image'
import { LinkButton } from '@/components/ui/Button'

/**
 * Simplified Hero Component
 *
 * Clean, minimal design matching the old website
 * - No particles or glowing effects
 * - Minimal animations
 * - Single Total Supply stat
 */
export function EnhancedHero() {
  return (
    <section className="relative min-h-[600px] overflow-hidden bg-black">
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black" />

      {/* Content Container */}
      <div className="relative z-10 flex min-h-[600px] items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          {/* Hero GIF Image */}
          <div className="mb-6 flex justify-center">
            <Image
              src="/images/tech.gif"
              alt="𝕂Ǝ𝕂丅ᵉ匚🅷 Collection"
              width={700}
              height={450}
              className="max-w-full h-auto rounded-lg"
              unoptimized
              priority
            />
          </div>

          {/* Subtitle */}
          <p className="mx-auto mb-8 max-w-3xl font-fredoka text-lg text-gray-300 sm:text-xl md:text-2xl">
            <span className="font-bold text-[#3fb8bd]">4200 𝕂Ǝ𝕂丅ᵉ匚🅷 Artifacts</span>
            : digital masterpieces blending tech and meme fun, hand-drawn by{' '}
            <span className="font-bold text-[#4ecca7]">𝔹enzo𝔹ert & Princess 𝔹u𝔹𝔹legum</span>
            . An homage to{' '}
            <span className="font-bold text-[#3fb8bd]">
              OG Pepecoin <span className="whitespace-nowrap">🐸👑</span>
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {/* Primary CTA */}
            <LinkButton href="/mint" variant="primary" size="lg">
              Start Minting
            </LinkButton>

            {/* Secondary CTA */}
            <LinkButton href="/gallery" variant="secondary" size="lg">
              Explore Gallery
            </LinkButton>
          </div>

          {/* Single Stat - Total Supply Only */}
          <div className="flex justify-center">
            <div className="rounded-xl border-2 border-[#3fb8bd]/30 bg-black/60 px-8 py-6 backdrop-blur-sm">
              <div className="font-fredoka text-5xl font-bold text-[#3fb8bd]">4,200</div>
              <div className="font-fredoka text-lg text-gray-400">Total Supply</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
