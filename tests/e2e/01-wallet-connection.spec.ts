/**
 * KEKTECH 3.0 - E2E Test Suite
 * Test 1: Wallet Connection Flow
 *
 * ✅ UPDATED: Now uses programmatic wallet authentication
 * Tests both programmatic auth AND UI wallet connection flow
 */

import { test, expect } from '@playwright/test';
import { WalletHelper } from './helpers/wallet';
import { createTestWallet, createPublicClientForBasedAI, getWalletBalance } from './helpers/wallet-client';

test.describe('Wallet Connection Flow', () => {
  test('should display connect wallet button on homepage', async ({ page }) => {
    await page.goto('/');
    const connectButton = page.getByRole('button', { name: /connect wallet/i });
    await expect(connectButton).toBeVisible();
  });

  test('should connect wallet programmatically', async ({ page }) => {
    const wallet = new WalletHelper(page);

    // Connect wallet programmatically (no UI interaction!)
    const address = await wallet.connectWallet('test');

    // Verify wallet connected
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(await wallet.isConnected()).toBe(true);

    console.log(`✅ Wallet connected: ${address}`);
  });

  test('should authenticate with Supabase session', async ({ page }) => {
    const wallet = new WalletHelper(page);

    // Connect wallet (creates Supabase session)
    await wallet.connectWallet('test');

    // Navigate to protected page that requires auth
    await page.goto('/proposals');

    // Should NOT see "sign in" prompt if authenticated
    const signInButton = page.getByRole('button', { name: /sign in/i });
    const isSignInVisible = await signInButton.isVisible().catch(() => false);

    expect(isSignInVisible).toBe(false);
    console.log('✅ Supabase authentication successful');
  });

  test('should show wallet balance', async ({ page }) => {
    const wallet = new WalletHelper(page);
    const address = await wallet.connectWallet('test');

    // Get balance from blockchain
    const walletClient = createTestWallet();
    const publicClient = createPublicClientForBasedAI();
    const balance = await getWalletBalance(address as `0x${string}`, publicClient);

    // Balance should be a valid number
    expect(parseFloat(balance)).toBeGreaterThanOrEqual(0);
    console.log(`✅ Wallet balance: ${balance} BASED`);
  });

  test('should disconnect wallet successfully', async ({ page }) => {
    const wallet = new WalletHelper(page);

    // Connect first
    await wallet.connectWallet('test');
    expect(await wallet.isConnected()).toBe(true);

    // Disconnect
    await wallet.disconnectWallet();

    // Verify disconnected
    expect(await wallet.isConnected()).toBe(false);
    console.log('✅ Wallet disconnected');
  });

  test('should persist authentication across page navigation', async ({ page }) => {
    const wallet = new WalletHelper(page);
    const address = await wallet.connectWallet('test');

    // Navigate to different pages
    await page.goto('/');
    expect(await wallet.isConnected()).toBe(true);

    await page.goto('/proposals');
    expect(await wallet.isConnected()).toBe(true);

    await page.goto('/markets');
    expect(await wallet.isConnected()).toBe(true);

    // Verify same address throughout
    const finalAddress = await wallet.getConnectedAddress();
    expect(finalAddress).toBe(address);

    console.log('✅ Authentication persisted across navigation');
  });

  test('should handle BasedAI network (Chain ID: 32323)', async ({ page }) => {
    const wallet = new WalletHelper(page);
    await wallet.connectWallet('test');

    // Check if on correct network
    const isOnBasedAI = await wallet.isOnBasedAI();
    expect(isOnBasedAI).toBe(true);

    console.log('✅ Connected to BasedAI network (Chain ID: 32323)');
  });
});
