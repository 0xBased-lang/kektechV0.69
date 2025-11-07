'use client'

import Link from 'next/link'
import Image from 'next/image'

/**
 * Footer Component
 *
 * Site footer with links, chain information, and social media
 */
export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="flex flex-wrap items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-[#06b6d4]">𝕂Ǝ𝕂TECH</h3>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/" className="hover:text-[#06b6d4] transition-colors">
              Home
            </Link>
            <Link href="/mint" className="hover:text-[#06b6d4] transition-colors">
              Mint
            </Link>
            <Link href="/gallery" className="hover:text-[#06b6d4] transition-colors">
              Gallery
            </Link>
            <Link href="/marketplace" className="hover:text-[#06b6d4] transition-colors">
              Marketplace
            </Link>
          </div>

          {/* External Links with Icons */}
          <div className="flex items-center gap-2">
            {/* Explorer */}
            <a
              href="https://explorer.bf1337.org"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
              aria-label="BF Explorer"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-900 border border-gray-800 group-hover:border-[#3fb8bd] transition-all duration-300 group-hover:scale-110">
                <Image
                  src="/images/bf.png"
                  alt="Explorer"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            </a>

            {/* Aftermint Marketplace */}
            <a
              href="https://aftermint.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
              aria-label="Aftermint Marketplace"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-900 border border-gray-800 group-hover:border-[#4ecca7] transition-all duration-300 group-hover:scale-110">
                <Image
                  src="/aftermint-logo.avif"
                  alt="Aftermint"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            </a>

            {/* RPC */}
            <a
              href="https://mainnet.basedaibridge.com/rpc/"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
              aria-label="RPC Endpoint"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-900 border border-gray-800 group-hover:border-[#06b6d4] transition-all duration-300 group-hover:scale-110 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-400 group-hover:text-[#06b6d4] transition-colors">RPC</span>
              </div>
            </a>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-2">
            <a
              href="https://x.com/KektechNFT"
              target="_blank"
              rel="noopener noreferrer"
              className="group w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 border-2 border-gray-800 hover:border-[#3fb8bd] transition-all duration-300 hover:scale-110"
              aria-label="X (Twitter)"
            >
              <Image
                src="/images/x.webp"
                alt="X"
                width={24}
                height={24}
                className="opacity-70 group-hover:opacity-100 transition-opacity"
              />
            </a>

            <a
              href="https://t.me/KEKTECH"
              target="_blank"
              rel="noopener noreferrer"
              className="group w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 border-2 border-gray-800 hover:border-[#4ecca7] transition-all duration-300 hover:scale-110"
              aria-label="Telegram"
            >
              <Image
                src="/images/telegram.webp"
                alt="Telegram"
                width={24}
                height={24}
                className="opacity-70 group-hover:opacity-100 transition-opacity"
              />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-center text-xs text-gray-500 dark:text-gray-500">
            © {currentYear} 𝕂Ǝ𝕂TECH. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
