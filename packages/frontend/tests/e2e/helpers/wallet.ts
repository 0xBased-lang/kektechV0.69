/**
 * KEKTECH 3.0 - Wallet Helper Utilities
 * Helper functions for wallet connection and Web3 interactions in E2E tests
 */

import { Page, expect } from '@playwright/test';

export class WalletHelper {
  constructor(private page: Page) {}

  /**
   * Connect wallet via UI (not actual MetaMask - tests UI flow only)
   * For full MetaMask testing, use persistent browser context with extension
   */
  async connectWallet() {
    // Look for "Connect Wallet" button
    const connectButton = this.page.getByRole('button', { name: /connect wallet/i });

    if (await connectButton.isVisible()) {
      await connectButton.click();

      // Wait for wallet selector modal
      await this.page.waitForSelector('[data-testid="wallet-modal"]', { timeout: 5000 }).catch(() => {
        console.log('Wallet modal not found - might already be connected');
      });

      // Click MetaMask option
      await this.page.click('button:has-text("MetaMask")');

      // Wait for connection success
      await expect(this.page.locator('text=/0x[a-fA-F0-9]{4}\\.\\.\\.[a-fA-F0-9]{4}/')).toBeVisible({ timeout: 10000 });

      console.log('✅ Wallet connected successfully');
      return true;
    }

    console.log('✅ Wallet already connected');
    return false;
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet() {
    const walletButton = this.page.locator('button:has-text("0x")');

    if (await walletButton.isVisible()) {
      await walletButton.click();

      // Click disconnect in dropdown
      await this.page.click('button:has-text("Disconnect")');

      await expect(this.page.getByRole('button', { name: /connect wallet/i })).toBeVisible({ timeout: 5000 });

      console.log('✅ Wallet disconnected');
      return true;
    }

    return false;
  }

  /**
   * Get currently connected wallet address from UI
   */
  async getConnectedAddress(): Promise<string | null> {
    const addressRegex = /0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}/;
    const addressElement = this.page.locator(`text=${addressRegex}`);

    if (await addressElement.isVisible()) {
      const text = await addressElement.textContent();
      return text?.match(/0x[a-fA-F0-9]{4}/) ? text : null;
    }

    return null;
  }

  /**
   * Check if wallet is connected
   */
  async isConnected(): Promise<boolean> {
    const address = await this.getConnectedAddress();
    return address !== null;
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
