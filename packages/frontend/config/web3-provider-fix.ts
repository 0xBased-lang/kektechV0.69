/**
 * Web3 Provider Fix
 *
 * Resolves conflicts between multiple wallet extensions trying to inject
 * the ethereum provider into window.ethereum
 */

declare global {
  interface Window {
    ethereum?: any
    web3?: any
    __SAFE_ETHEREUM_PROVIDER?: any
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
    const providerProxy = new Proxy({}, {
      get(_target, prop) {
        // Try the safe provider first
        if (window.__SAFE_ETHEREUM_PROVIDER && prop in window.__SAFE_ETHEREUM_PROVIDER) {
          return window.__SAFE_ETHEREUM_PROVIDER[prop]
        }

        // Fallback to any injected provider
        const providers = [
          window.ethereum,
          window.web3?.currentProvider,
        ].filter(Boolean)

        for (const provider of providers) {
          if (provider && prop in provider) {
            return provider[prop]
          }
        }

        return undefined
      },
      set(_target, prop, value) {
        if (window.__SAFE_ETHEREUM_PROVIDER) {
          window.__SAFE_ETHEREUM_PROVIDER[prop] = value
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