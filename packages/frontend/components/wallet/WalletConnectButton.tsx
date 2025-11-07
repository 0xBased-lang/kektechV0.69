'use client'

import { useState, useEffect } from 'react'

interface WalletConnectButtonProps {
  onConnect?: (address: string) => void
  onDisconnect?: () => void
  className?: string
}

/**
 * Wallet Connection Button Component
 * Handles MetaMask connection for BASED Chain (32323)
 */
export default function WalletConnectButton({
  onConnect,
  onDisconnect,
  className = ''
}: WalletConnectButtonProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // BASED Chain configuration
  const BASED_CHAIN_CONFIG = {
    chainId: '0x7e43', // 32323 in hex
    chainName: 'BASED',
    nativeCurrency: {
      name: 'BASED',
      symbol: 'BASED',
      decimals: 18
    },
    rpcUrls: ['https://rpc.bf1337.org'],
    blockExplorerUrls: ['https://explorer.bf1337.org']
  }

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        })

        if (accounts.length > 0) {
          setIsConnected(true)
          setAddress(accounts[0])

          // Check if we're on the right chain
          const chainId = await window.ethereum.request({
            method: 'eth_chainId'
          })

          if (chainId !== BASED_CHAIN_CONFIG.chainId) {
            await switchToBased()
          }

          if (onConnect) {
            onConnect(accounts[0])
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error)
      }
    }
  }

  const switchToBased = async () => {
    if (!window.ethereum) return

    try {
      // Try to switch to BASED chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASED_CHAIN_CONFIG.chainId }]
      })
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if ((switchError as { code?: number }).code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BASED_CHAIN_CONFIG]
          })
        } catch (addError) {
          console.error('Error adding BASED chain:', addError)
          setError('Failed to add BASED chain to MetaMask')
        }
      } else {
        console.error('Error switching to BASED chain:', switchError)
        setError('Failed to switch to BASED chain')
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('Please install MetaMask to connect your wallet')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length > 0) {
        // Switch to BASED chain if needed
        await switchToBased()

        setIsConnected(true)
        setAddress(accounts[0])

        if (onConnect) {
          onConnect(accounts[0])
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)

      if ((error as { code?: number }).code === 4001) {
        setError('Connection rejected by user')
      } else {
        setError('Failed to connect wallet')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setAddress('')

    if (onDisconnect) {
      onDisconnect()
    }
  }

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
          if (onConnect) {
            onConnect(accounts[0])
          }
        } else {
          disconnectWallet()
        }
      }

      const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
          window.ethereum.removeListener('chainChanged', handleChainChanged)
        }
      }
    }
  }, [onConnect, onDisconnect]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <span className="text-gray-400">Connected:</span>
          <span className="ml-2 text-[#3fb8bd] font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={disconnectWallet}
          className={`px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition ${className}`}
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={connectWallet}
        disabled={isLoading}
        className={`px-6 py-3 rounded-xl bg-gradient-to-r from-[#3fb8bd] to-[#4ecca7] text-black font-bold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

// Type declaration for ethereum is handled globally already