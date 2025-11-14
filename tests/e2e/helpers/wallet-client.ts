/**
 * KEKTECH 3.0 - Wallet Client Helper
 * Viem-based wallet initialization from private keys for E2E testing
 *
 * Security: Uses .env.test private keys (NEVER commit this file's values!)
 */

import { createWalletClient, createPublicClient, http, defineChain, type Address, type WalletClient, type PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// ==================== BASEDAI CUSTOM CHAIN ====================
// Chain ID: 32323, Native Currency: BASED

export const basedAI = defineChain({
  id: 32323,
  name: 'BasedAI',
  nativeCurrency: {
    name: 'BASED',
    symbol: 'BASED',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.BASEDAI_RPC || 'https://mainnet.basedaibridge.com/rpc/'],
    },
    public: {
      http: [process.env.BASEDAI_RPC || 'https://mainnet.basedaibridge.com/rpc/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BasedAI Explorer',
      url: 'https://explorer.bf1337.org',
    },
  },
  testnet: false,
});

// ==================== WALLET CLIENT FACTORY ====================

/**
 * Create a wallet client from a private key
 * @param privateKey - Private key with 0x prefix
 * @returns Viem WalletClient
 */
export function createWalletFromPrivateKey(privateKey: `0x${string}`): WalletClient {
  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    account,
    chain: basedAI,
    transport: http(basedAI.rpcUrls.default.http[0], {
      timeout: 60_000, // 60s timeout for blockchain operations
      retryCount: 3,
      retryDelay: 1000,
    }),
  });

  return walletClient;
}

/**
 * Create a public client for reading blockchain data
 * @returns Viem PublicClient
 */
export function createPublicClientForBasedAI(): PublicClient {
  return createPublicClient({
    chain: basedAI,
    transport: http(basedAI.rpcUrls.default.http[0], {
      timeout: 60_000,
      retryCount: 3,
      retryDelay: 1000,
    }),
  });
}

// ==================== TEST WALLET FACTORIES ====================

/**
 * Create test wallet client from ENV
 * Uses TEST_WALLET_PRIVATE_KEY from .env.test
 * @returns Wallet client for regular user tests
 */
export function createTestWallet(): WalletClient {
  const privateKey = process.env.TEST_WALLET_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('TEST_WALLET_PRIVATE_KEY not found in .env.test');
  }

  // Add 0x prefix if missing
  const formattedKey = privateKey.startsWith('0x')
    ? (privateKey as `0x${string}`)
    : (`0x${privateKey}` as `0x${string}`);

  return createWalletFromPrivateKey(formattedKey);
}

/**
 * Create admin wallet client from ENV
 * Uses ADMIN_WALLET_PRIVATE_KEY from .env.test
 * @returns Wallet client for admin tests
 */
export function createAdminWallet(): WalletClient {
  const privateKey = process.env.ADMIN_WALLET_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('ADMIN_WALLET_PRIVATE_KEY not found in .env.test');
  }

  // Add 0x prefix if missing
  const formattedKey = privateKey.startsWith('0x')
    ? (privateKey as `0x${string}`)
    : (`0x${privateKey}` as `0x${string}`);

  return createWalletFromPrivateKey(formattedKey);
}

// ==================== WALLET UTILITIES ====================

/**
 * Get wallet address from client
 * @param walletClient - Viem wallet client
 * @returns Wallet address
 */
export function getWalletAddress(walletClient: WalletClient): Address {
  if (!walletClient.account) {
    throw new Error('Wallet client has no account');
  }
  return walletClient.account.address;
}

/**
 * Get wallet balance in BASED
 * @param address - Wallet address
 * @param publicClient - Public client
 * @returns Balance in BASED (as string)
 */
export async function getWalletBalance(
  address: Address,
  publicClient: PublicClient
): Promise<string> {
  const balance = await publicClient.getBalance({ address });
  // Convert from wei to BASED (18 decimals)
  return (Number(balance) / 1e18).toFixed(4);
}

/**
 * Check if wallet has sufficient balance
 * @param address - Wallet address
 * @param requiredAmount - Required amount in BASED
 * @param publicClient - Public client
 * @returns True if balance >= required
 */
export async function hassufficientBalance(
  address: Address,
  requiredAmount: number,
  publicClient: PublicClient
): Promise<boolean> {
  const balanceStr = await getWalletBalance(address, publicClient);
  const balance = parseFloat(balanceStr);
  return balance >= requiredAmount;
}

// ==================== EXPORTS ====================

export type { WalletClient, PublicClient, Address };
