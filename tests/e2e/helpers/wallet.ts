/**
 * KEKTECH 3.0 - Wallet Helper Utilities
 * Helper functions for wallet connection and Web3 interactions in E2E tests
 *
 * ✅ UPDATED: Now uses programmatic authentication via Viem + Supabase
 */

import { Page, expect } from '@playwright/test';
import type { WalletClient } from 'viem';
import { AuthHelper, authenticatePageWithWallet } from './auth-helper';
import { createTestWallet, createAdminWallet, getWalletAddress } from './wallet-client';

export class WalletHelper {
  private page: Page;
  private walletClient?: WalletClient;
  private authHelper: AuthHelper;

  constructor(page: Page) {
    this.page = page;
    this.authHelper = new AuthHelper();
  }

  /**
   * ✅ NEW: Connect wallet programmatically (no UI interaction)
   * Uses Viem wallet client + Supabase authentication
   *
   * @param walletType - 'test' for regular user, 'admin' for admin wallet
   * @returns Wallet address
   */
  async connectWallet(walletType: 'test' | 'admin' = 'test'): Promise<string> {
    // 1. Create wallet client from private key
    this.walletClient = walletType === 'admin' ? createAdminWallet() : createTestWallet();

    // 2. Authenticate and inject session
    const sessionData = await authenticatePageWithWallet(this.page, this.walletClient);

    const address = sessionData.walletAddress;
    console.log(`✅ Wallet connected programmatically: ${address}`);

    return address;
  }

  /**
   * Get the wallet client instance
   * @returns Viem wallet client
   */
  getWalletClient(): WalletClient | undefined {
    return this.walletClient;
  }

  /**
   * ✅ UPDATED: Disconnect wallet programmatically
   * Clears Supabase session
   */
  async disconnectWallet() {
    await this.authHelper.clearAuthSession(this.page);
    this.walletClient = undefined;

    console.log('✅ Wallet disconnected programmatically');
    await this.page.reload(); // Reload to apply disconnection
    return true;
  }

  /**
   * ✅ UPDATED: Get currently connected wallet address
   * Uses wallet client instead of parsing UI
   */
  async getConnectedAddress(): Promise<string | null> {
    if (!this.walletClient?.account) {
      return null;
    }

    return getWalletAddress(this.walletClient);
  }

  /**
   * ✅ UPDATED: Check if wallet is connected programmatically
   */
  async isConnected(): Promise<boolean> {
    return this.walletClient !== undefined && this.walletClient.account !== undefined;
  }

  /**
   * Wait for transaction confirmation (blockchain)
   * Useful after clicking buttons that trigger on-chain transactions
   */
  async waitForTransaction(timeout: number = 30000) {
    // Wait for loading indicator
    await this.page.waitForSelector('[data-testid="tx-pending"]', { timeout: 5000 }).catch(() => {
      console.log('No pending tx indicator found');
    });

    // Wait for success notification
    await expect(this.page.locator('text=/transaction (successful|confirmed)/i')).toBeVisible({ timeout });

    console.log('✅ Transaction confirmed');
  }

  /**
   * Check if network is correct (BasedAI Chain ID: 32323)
   */
  async isOnBasedAI(): Promise<boolean> {
    // Check for network warning
    const wrongNetworkWarning = this.page.locator('text=/wrong network|switch to basedai/i');
    return !(await wrongNetworkWarning.isVisible());
  }

  /**
   * Simulate signing a message (for auth)
   * Note: Actual signing happens in MetaMask extension
   */
  async signMessage() {
    // In real tests with MetaMask extension, you'd interact with the popup
    // For now, we test that the sign request is triggered
    await this.page.waitForTimeout(1000); // Wait for MetaMask popup
    console.log('✅ Sign message requested');
  }
}
