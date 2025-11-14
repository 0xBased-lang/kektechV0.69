/**
 * KEKTECH 3.0 - Connect Wallet Button
 *
 * Combines RainbowKit wallet connection with Supabase authentication
 *
 * Two-Step Flow:
 * 1. Connect Wallet → Beautiful RainbowKit modal with 100+ wallets
 * 2. Sign In → Authenticate with Supabase using wallet signature
 *
 * This provides better security than one-click solutions because
 * users explicitly authenticate after connecting their wallet.
 */

'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useWalletAuth } from '@/lib/hooks/useWalletAuth'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function ConnectWalletButton() {
  const { authenticate, isAuthenticated, signOut, isAuthenticating } = useWalletAuth()

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        // Don't render on server
        const ready = mounted
        const connected = ready && account && chain

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              // Step 1: Not connected - show RainbowKit connect button
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    type="button"
                    className="bg-kek-green hover:bg-[#2fa8ad] text-white font-medium"
                  >
                    Connect Wallet
                  </Button>
                )
              }

              // Wrong network - prompt to switch
              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    type="button"
                    variant="destructive"
                  >
                    Wrong Network
                  </Button>
                )
              }

              // Step 2: Connected but not authenticated - show Sign In button
              if (!isAuthenticated) {
                return (
                  <Button
                    onClick={authenticate}
                    disabled={isAuthenticating}
                    type="button"
                    className="bg-kek-green hover:bg-[#2fa8ad] text-white font-medium"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                )
              }

              // Step 3: Authenticated - show account with sign out option
              return (
                <div className="flex gap-2">
                  {/* Chain Switcher */}
                  <Button
                    onClick={openChainModal}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 8,
                        }}
                      >
                        {chain.iconUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 16, height: 16 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </Button>

                  {/* Account Button */}
                  <Button
                    onClick={openAccountModal}
                    type="button"
                    className="bg-kek-green hover:bg-[#2fa8ad] text-white font-medium"
                  >
                    {account.displayName}
                    {account.displayBalance && (
                      <span className="hidden sm:inline ml-2 opacity-80">
                        ({account.displayBalance})
                      </span>
                    )}
                  </Button>

                  {/* Sign Out Button */}
                  <Button
                    onClick={signOut}
                    variant="outline"
                    size="sm"
                    type="button"
                    className="hidden lg:flex"
                  >
                    Sign Out
                  </Button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
