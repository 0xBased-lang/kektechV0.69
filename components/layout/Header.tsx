'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Shield, LogOut, CheckCircle, XCircle } from 'lucide-react'
import { ConnectButton } from '@/components/web3/ConnectButton'
import { NetworkSwitcher } from '@/components/web3/NetworkSwitcher'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { Button } from '@/components/ui/button'

// Admin wallet address
const ADMIN_WALLET = '0x25fD72154857Bd204345808a690d51a61A81EB0b'

/**
 * Header Component
 *
 * Navigation bar with KEKTECH logo, navigation links, and wallet connection
 * Includes mobile hamburger menu for responsive design
 */
export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check if connected wallet is admin
  const { address, isConnected } = useAccount()
  const isAdmin = address?.toLowerCase() === ADMIN_WALLET.toLowerCase()

  // Get authentication state and methods
  const { isAuthenticated, signOut } = useWalletAuth()

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
    <header className="sticky top-0 z-50 w-full border-b border-terminal bg-terminal backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
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
            className={`font-fredoka text-sm font-medium transition-colors hover:text-kek-green ${
              pathname?.startsWith('/feels-good-markets') ? 'text-kek-green font-bold' : 'text-terminal-secondary'
            }`}
          >
            Feels Good Markets
          </Link>
          <Link
            href="/proposals"
            className={`font-fredoka text-sm font-medium transition-colors hover:text-kek-green ${
              pathname === '/proposals' ? 'text-kek-green font-bold' : 'text-terminal-secondary'
            }`}
          >
            💡 Proposals
          </Link>
          <Link
            href="/markets"
            className={`font-fredoka text-sm font-medium transition-colors hover:text-kek-green ${
              pathname?.startsWith('/market') ? 'text-kek-green font-bold' : 'text-terminal-secondary'
            }`}
          >
            Markets
          </Link>
          <Link
            href="/feed"
            className={`font-fredoka text-sm font-medium transition-colors hover:text-kek-green ${
              pathname === '/feed' ? 'text-kek-green font-bold' : 'text-terminal-secondary'
            }`}
          >
            Feed
          </Link>
          <Link
            href="/dashboard"
            className={`font-fredoka text-sm font-medium transition-colors hover:text-kek-green ${
              pathname === '/dashboard' ? 'text-kek-green font-bold' : 'text-terminal-secondary'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/gallery"
            className={`font-fredoka text-sm font-medium transition-colors hover:text-kek-green ${
              pathname === '/gallery' ? 'text-kek-green font-bold' : 'text-terminal-secondary'
            }`}
          >
            Gallery
          </Link>
          <Link
            href="/staking"
            className={`font-fredoka text-sm font-medium transition-colors hover:text-kek-green ${
              pathname === '/staking' ? 'text-kek-green font-bold' : 'text-terminal-secondary'
            }`}
          >
            Staking
          </Link>
          <Link
            href="/about"
            className={`font-fredoka text-sm font-medium transition-colors hover:text-kek-green ${
              pathname === '/about' ? 'text-kek-green font-bold' : 'text-terminal-secondary'
            }`}
          >
            About Us
          </Link>

          {/* Admin Control Panel Link - Only visible to admin wallet */}
          {isAdmin && (
            <Link
              href="/admin"
              className={`font-fredoka text-sm font-medium transition-colors hover:text-blue-500 flex items-center gap-1.5 ${
                pathname === '/admin' ? 'text-blue-600 font-bold' : 'text-blue-600'
              }`}
            >
              <Shield className="h-4 w-4" />
              Control Panel
            </Link>
          )}
        </nav>

        {/* Right Side: Wallet Connect & Mobile Menu Button */}
        <div className="flex items-center gap-3">
          {/* Desktop: Network Switcher + Connect Button + Auth Status */}
          <div className="hidden md:flex items-center gap-3">
            <NetworkSwitcher inline />
            <ConnectButton />

            {/* Authentication Status & Sign Out */}
            {isConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900/60 border border-gray-800">
                {isAuthenticated ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">Signed In</span>
                    <Button
                      onClick={signOut}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs hover:bg-gray-800"
                      title="Sign out and clear Supabase session"
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-yellow-500 font-medium">Not Signed In</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile: Hamburger Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg bg-gray-900/60 border border-gray-800 hover:border-kek-green transition-colors"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <span
              className={`block w-6 h-0.5 bg-kek-green transition-all duration-300 ${
                mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-kek-green my-1 transition-all duration-300 ${
                mobileMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-kek-green transition-all duration-300 ${
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
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] border-l border-kek-green/20 z-[110] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.98)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        {/* Mobile Menu Header - Fixed at top */}
        <div className="flex-shrink-0 p-4 border-b border-gray-800" style={{ backgroundColor: 'rgba(0, 0, 0, 0.98)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 mr-3">
              <ConnectButton />
            </div>
            <button
              onClick={closeMobileMenu}
              type="button"
              className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-900 border-2 border-gray-800 hover:border-kek-green hover:bg-gray-800 active:scale-95 transition-all relative z-[120] touch-manipulation flex-shrink-0"
              aria-label="Close menu"
              style={{ pointerEvents: 'auto' }}
            >
              <span className="text-kek-green text-3xl font-bold leading-none select-none">×</span>
            </button>
          </div>

          {/* Mobile Authentication Status */}
          {isConnected && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-800">
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500 font-medium">Signed In</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-500 font-medium">Not Signed In</span>
                  </>
                )}
              </div>
              {isAuthenticated && (
                <Button
                  onClick={signOut}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs hover:bg-gray-800"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Sign Out
                </Button>
              )}
            </div>
          )}
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
                ? 'bg-kek-green/20 text-kek-green font-bold'
                : 'text-terminal-secondary hover:bg-terminal-elevated hover:text-kek-green'
            }`}
          >
            Feels Good Markets
          </Link>
          <Link
            href="/proposals"
            onClick={closeMobileMenu}
            className={`font-fredoka text-lg font-medium py-4 px-5 rounded-lg transition-colors touch-manipulation ${
              pathname === '/proposals'
                ? 'bg-kek-green/20 text-kek-green font-bold'
                : 'text-terminal-secondary hover:bg-terminal-elevated hover:text-kek-green'
            }`}
          >
            💡 Proposals
          </Link>
          <Link
            href="/markets"
            onClick={closeMobileMenu}
            className={`font-fredoka text-lg font-medium py-4 px-5 rounded-lg transition-colors touch-manipulation ${
              pathname?.startsWith('/market')
                ? 'bg-kek-green/20 text-kek-green font-bold'
                : 'text-terminal-secondary hover:bg-terminal-elevated hover:text-kek-green'
            }`}
          >
            Markets
          </Link>
          <Link
            href="/feed"
            onClick={closeMobileMenu}
            className={`font-fredoka text-lg font-medium py-4 px-5 rounded-lg transition-colors touch-manipulation ${
              pathname === '/feed'
                ? 'bg-kek-green/20 text-kek-green font-bold'
                : 'text-terminal-secondary hover:bg-terminal-elevated hover:text-kek-green'
            }`}
          >
            Feed
          </Link>
          <Link
            href="/dashboard"
            onClick={closeMobileMenu}
            className={`font-fredoka text-lg font-medium py-4 px-5 rounded-lg transition-colors touch-manipulation ${
              pathname === '/dashboard'
                ? 'bg-kek-green/20 text-kek-green font-bold'
                : 'text-terminal-secondary hover:bg-terminal-elevated hover:text-kek-green'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/gallery"
            onClick={closeMobileMenu}
            className={`font-fredoka text-lg font-medium py-4 px-5 rounded-lg transition-colors touch-manipulation ${
              pathname === '/gallery'
                ? 'bg-kek-green/20 text-kek-green font-bold'
                : 'text-terminal-secondary hover:bg-terminal-elevated hover:text-kek-green'
            }`}
          >
            Gallery
          </Link>
          <Link
            href="/staking"
            onClick={closeMobileMenu}
            className={`font-fredoka text-lg font-medium py-4 px-5 rounded-lg transition-colors touch-manipulation ${
              pathname === '/staking'
                ? 'bg-kek-green/20 text-kek-green font-bold'
                : 'text-terminal-secondary hover:bg-terminal-elevated hover:text-kek-green'
            }`}
          >
            Staking
          </Link>
          <Link
            href="/about"
            onClick={closeMobileMenu}
            className={`font-fredoka text-lg font-medium py-4 px-5 rounded-lg transition-colors touch-manipulation ${
              pathname === '/about'
                ? 'bg-kek-green/20 text-kek-green font-bold'
                : 'text-terminal-secondary hover:bg-terminal-elevated hover:text-kek-green'
            }`}
          >
            About Us
          </Link>

          {/* Admin Control Panel Link - Only visible to admin wallet */}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={closeMobileMenu}
              className={`font-fredoka text-lg font-medium py-4 px-5 rounded-lg transition-colors touch-manipulation flex items-center gap-2 ${
                pathname === '/admin'
                  ? 'bg-blue-600/20 text-blue-500 font-bold'
                  : 'text-blue-500 hover:bg-blue-600/10 hover:text-blue-400'
              }`}
            >
              <Shield className="h-5 w-5" />
              Control Panel
            </Link>
          )}

        </nav>

        {/* Mobile Menu Footer: Network Switcher - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-800" style={{ backgroundColor: 'rgba(0, 0, 0, 0.98)' }}>
          <NetworkSwitcher inline />
        </div>
      </div>
    </header>
  )
}
