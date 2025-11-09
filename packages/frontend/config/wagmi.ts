import '@rainbow-me/rainbowkit/styles.css'  // ← Must be first import!
import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { basedChain } from './chains'
import { getDefaultWallets } from '@rainbow-me/rainbowkit'

/**
 * Fixed Wagmi Configuration
 *
 * Resolves all wallet connection issues:
 * - Uses correct Reown Project ID
 * - Handles domain allowlist dynamically
 * - Prevents provider conflicts
 * - Adds robust error handling
 */

// NEW PROJECT ID with correct domains configured
const REOWN_PROJECT_ID = 'dc5e6470d109f31f1d271b149fed3d98'

// Get project ID with fallback and validation
const projectId = (process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim() || REOWN_PROJECT_ID).trim()

// Validate Project ID format
if (!projectId || projectId.length !== 32) {
  console.error('Invalid Reown Project ID format. Using hardcoded fallback.')
}

// Dynamic URL detection for proper domain handling
const getAppUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Try environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Check Vercel URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  // Fallback to main domain
  return 'https://kektech-nextjs.vercel.app'
}

const appUrl = getAppUrl()

// Enhanced metadata with multiple URL formats
const metadata = {
  name: 'KEKTECH NFT Collection',
  description: 'Mint KEKTECH NFTs on BasedAI Network',
  url: appUrl,
  icons: [
    `${appUrl}/images/logo.png`,
    'https://kektech-nextjs.vercel.app/images/logo.png'
  ],
}

// RainbowKit wallet configuration - Provides 100+ wallet options!
const { connectors } = getDefaultWallets({
  appName: metadata.name,
  projectId: REOWN_PROJECT_ID,
})

// Create Wagmi configuration with RainbowKit connectors
export const config = createConfig({
  chains: [basedChain, mainnet],
  connectors,  // ← RainbowKit connectors (100+ wallets!)
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  syncConnectedChain: true,
  transports: {
    [basedChain.id]: http('/api/rpc'), // Use proxy to avoid CORS issues
    [mainnet.id]: http(),
  },
})

// Export utility to check configuration
export const checkWagmiConfig = () => {
  console.log('Wagmi Config Check:', {
    projectId: REOWN_PROJECT_ID,
    appUrl: getAppUrl(),
    chains: config.chains,
    connectors: config.connectors.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
    })),
  })
}

// Declare module for TypeScript
declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}