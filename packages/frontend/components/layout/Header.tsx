'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@/components/web3/ConnectButton'
import { NetworkSwitcher } from '@/components/web3/NetworkSwitcher'

/**
 * Header Component
 *
 * Navigation bar with KEKTECH logo, navigation links, and wallet connection
 * Includes mobile hamburger menu for responsive design
 */
export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#3fb8bd]/20 bg-[#000000] backdrop-blur-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - Left Side */}
        <Link href="/" className="flex items-center hover:opacity-80 transition py-1">
          <Image
            src="/images/kektech-cropped.gif?v=2"
            alt="𝕂Ǝ𝕂丅ᵉ匚🅷 Home"
            width={400}
            height={100}
            className="h-auto w-44 sm:w-52 md:w-60 lg:w-64 -mt-1"
            style={{ objectFit: 'contain' }}
            unoptimized
            priority
          />
        </Link>

        {/* Desktop Navigation Links - Center/Right - Only 5 Links */}
        <nav className="hidden items-center space-x-4 md:flex lg:space-x-6">
          <Link
            href="/feels-good-markets"
            className={`font-fredoka text-sm font-medium transition-colors hover:text-[#3fb8bd] ${
              pathname?.startsWith('/feels-good-markets') ? 'text-[#3fb8bd] font-bold' : 'text-gray-300'
            }`}
          >
            Feels Good Markets
          </Link>
          <Link
            href="/dashboard"
            className={`font-fredoka text-sm font-medium transition-colors hover:text-[#3fb8bd] ${
              pathname === '/dashboard' ? 'text-[#3fb8bd] font-bold' : 'text-gray-300'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/gallery"
            className={`font-fredoka text-sm font-medium transition-colors hover:text-[#3fb8bd] ${
              pathname === '/gallery' ? 'text-[#3fb8bd] font-bold' : 'text-gray-300'
            }`}
          >
            Gallery
          </Link>
          <Link
            href="/staking"
            className={`font-fredoka text-sm font-medium transition-colors hover:text-[#3fb8bd] ${
              pathname === '/staking' ? 'text-[#3fb8bd] font-bold' : 'text-gray-300'
            }`}
          >
            Staking
          </Link>
          <Link
            href="/about"
            className={`font-fredoka text-sm font-medium transition-colors hover:text-[#3fb8bd] ${
              pathname === '/about' ? 'text-[#3fb8bd] font-bold' : 'text-gray-300'
            }`}
          >
            About Us
          </Link>
        </nav>

        {/* Right Side: Wallet Connect & Mobile Menu Button */}
        <div className="flex items-center gap-3">
          {/* Desktop: Network Switcher + Connect Button */}
          <div className="hidden md:flex items-center gap-3">
            <NetworkSwitcher inline />
            <ConnectButton />
          </div>

          {/* Mobile: Hamburger Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg bg-gray-900/60 border border-gray-800 hover:border-[#3fb8bd] transition-colors"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <span
              className={`block w-6 h-0.5 bg-[#3fb8bd] transition-all duration-300 ${
                mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-[#3fb8bd] my-1 transition-all duration-300 ${
                mobileMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-[#3fb8bd] transition-all duration-300 ${
                mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay - Ultra-high z-index to guarantee top layer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Out Menu - Highest z-index to appear above everything */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] border-l border-[#3fb8bd]/20 z-[110] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.98)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        {/* Mobile Menu Header - Fixed at top */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-800" style={{ backgroundColor: 'rgba(0, 0, 0, 0.98)' }}>
          <div className="flex-1 mr-3">
            <ConnectButton />
          </div>
          <button
            onClick={closeMobileMenu}
            type="button"
            className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-900 border-2 border-gray-800 hover:border-[#3fb8bd] hover:bg-gray-800 active:scale-95 transition-all relative z-[120] touch-manipulation flex-shrink-0"
            aria-label="Close menu"
            style={{ pointerEvents: 'auto' }}
          >
            <span className="text-[#3fb8bd] text-3xl font-bold leading-none select-none">×</span>
          </button>
        </div>

        {/* Mobile Navigation Links - Scrollable content - Only 5 Links */}
        <nav
          className="flex-1 flex flex-col px-5 py-5 space-y-4 overflow-y-auto overscroll-contain"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.98)',
            WebkitOverflowScrolling: 'touch',
            minHeight: '400px'
          }}
        >
          <Link
            href="/feels-good-markets"
            onClick={closeMobileMenu}
            className={`font-fredoka text-lg font-medium py-4 px-5 rounded-lg transition-colors touch-manipulation ${
              pathname?.startsWith('/feels-good-markets')
                ? 'bg-[#3fb8bd]/20 text-[#3fb8bd] font-bold'
                : 'text-gray-300 hover:bg-gray-900/60 hover:text-[#3fb8bd]'
            }`}
          >
            Feels Good Markets
          </Link>
          <Link
            href="/dashboard"
            onClick={closeMobileMenu}
            className={`font-fredoka text-lg font-medium py-4 px-5 rounded-lg transition-colors touch-manipulation ${
              pathname === '/dashboard'
                ? 'bg-[#3fb8bd]/20 text-[#3fb8bd] font-bold'
                : 'text-gray-300 hover:bg-gray-900/60 hover:text-[#3fb8bd]'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/gallery"
            onClick={closeMobileMenu}
            className={`font-fredoka text-lg font-medium py-4 px-5 rounded-lg transition-colors touch-manipulation ${
              pathname === '/gallery'
                ? 'bg-[#3fb8bd]/20 text-[#3fb8bd] font-bold'
                : 'text-gray-300 hover:bg-gray-900/60 hover:text-[#3fb8bd]'
            }`}
          >
            Gallery
          </Link>
          <Link
            href="/staking"
            onClick={closeMobileMenu}
            className={`font-fredoka text-lg font-medium py-4 px-5 rounded-lg transition-colors touch-manipulation ${
              pathname === '/staking'
                ? 'bg-[#3fb8bd]/20 text-[#3fb8bd] font-bold'
                : 'text-gray-300 hover:bg-gray-900/60 hover:text-[#3fb8bd]'
            }`}
          >
            Staking
          </Link>
          <Link
            href="/about"
            onClick={closeMobileMenu}
            className={`font-fredoka text-lg font-medium py-4 px-5 rounded-lg transition-colors touch-manipulation ${
              pathname === '/about'
                ? 'bg-[#3fb8bd]/20 text-[#3fb8bd] font-bold'
                : 'text-gray-300 hover:bg-gray-900/60 hover:text-[#3fb8bd]'
            }`}
          >
            About Us
          </Link>

        </nav>

        {/* Mobile Menu Footer: Network Switcher - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-800" style={{ backgroundColor: 'rgba(0, 0, 0, 0.98)' }}>
          <NetworkSwitcher inline />
        </div>
      </div>
    </header>
  )
}
