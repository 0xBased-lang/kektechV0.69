/**
 * KEKTECH 3.0 - E2E Test Suite
 * Test 1: Wallet Connection Flow
 *
 * Tests wallet connection, disconnection, and network switching
 */

import { test, expect } from '@playwright/test';
import { WalletHelper } from './helpers/wallet';

test.describe('Wallet Connection Flow', () => {
  let wallet: WalletHelper;

  test.beforeEach(async ({ page }) => {
    wallet = new WalletHelper(page);
    await page.goto('/');
  });

  test('should display connect wallet button on homepage', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect wallet/i });
    await expect(connectButton).toBeVisible();
  });

  test('should open wallet modal when clicking connect', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect wallet/i });
    await connectButton.click();

    // Wait for wallet selector modal (either RainbowKit or WalletConnect)
    const walletModal = page.locator('[data-testid="wallet-modal"], .wallet-modal, [role="dialog"]');
    await expect(walletModal).toBeVisible({ timeout: 5000 });

    // Should show wallet options
    const hasMetaMask = await page.locator('text=/metamask/i').isVisible();
    const hasWalletConnect = await page.locator('text=/walletconnect/i').isVisible();

    expect(hasMetaMask || hasWalletConnect).toBeTruthy();
  });

  test('should show wallet address after connection', async ({ page }) => {
    // Note: This test assumes MetaMask is pre-configured in persistent context
    // For full automation, use Synpress or similar

    // Check if already connected
    const isConnected = await wallet.isConnected();

    if (!isConnected) {
      console.log('⏭️  Skipping: Requires MetaMask extension to be configured');
      test.skip();
    }

    // Verify address is displayed (format: 0x1234...5678)
    const address = await wallet.getConnectedAddress();
    expect(address).toBeTruthy();
    expect(address).toMatch(/0x[a-fA-F0-9]{4}\.\.\.[ a-fA-F0-9]{4}/);
  });

  test('should disconnect wallet successfully', async ({ page }) => {
    const isConnected = await wallet.isConnected();

    if (!isConnected) {
      console.log('⏭️  Skipping: Wallet not connected');
      test.skip();
    }

    await wallet.disconnectWallet();

    // Verify disconnect
    const connectButton = page.getByRole('button', { name: /connect wallet/i });
    await expect(connectButton).toBeVisible();
  });

  test('should navigate to proposals page with wallet connected', async ({ page }) => {
    const isConnected = await wallet.isConnected();

    if (!isConnected) {
      console.log('⏭️  Skipping: Wallet not connected');
      test.skip();
    }

    // Navigate to proposals
    await page.goto('/proposals');

    // Verify page loaded
    await expect(page.locator('h1, h2')).toContainText(/proposal/i);

    // Verify wallet still connected
    const address = await wallet.getConnectedAddress();
    expect(address).toBeTruthy();
  });
});
