/**
 * Web3 Provider Fix
 *
 * Resolves conflicts between multiple wallet extensions trying to inject
 * the ethereum provider into window.ethereum
 */

import type { EIP1193Provider } from 'viem'

type SafeProvider = EIP1193Provider & Record<string, unknown>

interface LegacyWeb3 {
  currentProvider?: EIP1193Provider
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any
    web3?: LegacyWeb3
    __SAFE_ETHEREUM_PROVIDER?: SafeProvider
  }
}

/**
 * Safely initialize ethereum provider without conflicts
 */
export function initializeEthereumProvider() {
  if (typeof window === 'undefined') return

  try {
    // Store the original ethereum provider if it exists
    if (window.ethereum && !window.__SAFE_ETHEREUM_PROVIDER) {
      window.__SAFE_ETHEREUM_PROVIDER = window.ethereum
    }

    // Prevent redefining the ethereum property
    const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum')
    if (descriptor && !descriptor.configurable) {
      console.warn('Window.ethereum is not configurable, skipping provider initialization')
      return
    }

    // Create a proxy to handle multiple providers safely
    const providerProxy = new Proxy<Record<string, unknown>>({}, {
      get(_target, prop: string | symbol) {
        // Try the safe provider first
        if (window.__SAFE_ETHEREUM_PROVIDER && prop in window.__SAFE_ETHEREUM_PROVIDER) {
          return window.__SAFE_ETHEREUM_PROVIDER[prop as keyof SafeProvider]
        }

        // Fallback to any injected provider
        const providers: SafeProvider[] = [
          window.ethereum as SafeProvider | undefined,
          window.web3?.currentProvider as SafeProvider | undefined,
        ].filter(Boolean) as SafeProvider[]

        for (const provider of providers) {
          if (provider && prop in provider) {
              return provider[prop as keyof SafeProvider]
          }
        }

        return undefined
      },
      set(_target, prop: string | symbol, value) {
        if (window.__SAFE_ETHEREUM_PROVIDER) {
          window.__SAFE_ETHEREUM_PROVIDER[prop as keyof SafeProvider] = value
          return true
        }
        return false
      }
    })

    // Safely define ethereum property
    try {
      Object.defineProperty(window, 'ethereum', {
        get() { return providerProxy },
        configurable: true,
        enumerable: true
      })
    } catch (error) {
      console.warn('Could not define window.ethereum:', error)
    }
  } catch (error) {
    console.error('Error initializing Ethereum provider:', error)
  }
}

/**
 * Wait for provider to be available
 */
export async function waitForProvider(timeout = 3000): Promise<boolean> {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    if (window.ethereum || window.__SAFE_ETHEREUM_PROVIDER) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return false
}
