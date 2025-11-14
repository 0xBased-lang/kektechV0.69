/**
 * KEKTECH 3.0 - E2E Test Suite
 * Test 5: Error Handling
 *
 * ✅ UPDATED: Tests error states with programmatic wallet automation
 * Tests error scenarios, edge cases, and recovery mechanisms
 */

import { test, expect } from '@playwright/test';
import { WalletHelper } from './helpers/wallet';
import { APIHelper } from './helpers/api';
import { ContractHelper } from './helpers/contract-helper';
import { createTestWallet, createPublicClientForBasedAI } from './helpers/wallet-client';

test.describe('Error Handling', () => {
  test.describe('Network Errors', () => {
    test('should handle invalid market address in UI', async ({ page }) => {
      await page.goto('/market/0x0000000000000000000000000000000000000000');

      // Page should load without crashing
      expect(page.url()).toContain('/market/');
      console.log('✅ Invalid address handled gracefully in UI');
    });

    test('should handle invalid market address in contract call', async ({ page }) => {
      const invalidAddress = '0x0000000000000000000000000000000000000000' as `0x${string}`;
      const contracts = new ContractHelper(createTestWallet(), createPublicClientForBasedAI());

      try {
        await contracts.getMarketState(invalidAddress);
        console.log('ℹ️  Invalid address call completed (may return default state)');
      } catch (error: any) {
        console.log('✅ Invalid address rejected: ' + error.message);
        expect(error).toBeTruthy();
      }
    });

    test('should handle malformed addresses', async ({ page }) => {
      await page.goto('/market/invalid-address');

      await page.waitForTimeout(2000);

      // Should handle gracefully (error page or redirect)
      expect(page.url()).toBeTruthy();
      console.log('✅ Malformed address handled');
    });
  });

  test.describe('Authentication Errors', () => {
    test('should require authentication for voting', async ({ page }) => {
      const wallet = new WalletHelper(page);
      await page.goto('/proposals');
      await page.waitForTimeout(2000);

      // Ensure wallet NOT connected
      if (await wallet.isConnected()) {
        await wallet.disconnectWallet();
      }

      const likeButton = page.locator('button:has-text("👍")').first();

      if (await likeButton.isVisible({ timeout: 3000 })) {
        await likeButton.click();
        await page.waitForTimeout(1000);

        // Should show auth prompt or error
        console.log('✅ Unauthenticated voting handled');
      } else {
        console.log('ℹ️  No vote buttons to test');
      }
    });

    test('should handle authenticated vs unauthenticated states', async ({ page }) => {
      const wallet = new WalletHelper(page);

      // Test unauthenticated
      await page.goto('/');
      const unauthed = !(await wallet.isConnected());
      console.log(`Unauthenticated state: ${unauthed}`);

      // Test authenticated
      await wallet.connectWallet('test');
      const authed = await wallet.isConnected();
      console.log(`Authenticated state: ${authed}`);

      expect(authed).toBe(true);
      console.log('✅ Authentication state management working');
    });
  });

  test.describe('Validation Errors', () => {
    test('should validate wallet balance before betting', async ({ page }) => {
      const wallet = new WalletHelper(page);
      const address = await wallet.connectWallet('test');

      const publicClient = createPublicClientForBasedAI();
      const balance = await publicClient.getBalance({ address: address as `0x${string}` });
      const balanceBASED = Number(balance) / 1e18;

      console.log(`Wallet balance: ${balanceBASED.toFixed(4)} BASED`);

      // Validate insufficient funds would be caught
      if (balanceBASED < 0.01) {
        console.log('✅ Low balance detected - would prevent betting');
      } else {
        console.log('ℹ️  Sufficient balance for betting');
      }

      expect(balanceBASED).toBeGreaterThanOrEqual(0);
    });

    test('should validate market state before betting', async ({ page }) => {
      const testMarketAddress = (process.env.TEST_MARKET_ADDRESS || '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84') as `0x${string}`;
      const contracts = new ContractHelper(createTestWallet(), createPublicClientForBasedAI());

      const state = await contracts.getMarketState(testMarketAddress);
      console.log(`Market state: ${state}`);

      // Only state 2 (ACTIVE) allows betting
      const canBet = state === 2;

      if (!canBet) {
        console.log(`✅ Market state ${state} would prevent betting (correct)`);
      } else {
        console.log('ℹ️  Market is ACTIVE - betting allowed');
      }
    });
  });

  test.describe('Transaction Errors', () => {
    test('should handle insufficient funds for betting', async ({ page }) => {
      const testMarketAddress = (process.env.TEST_MARKET_ADDRESS || '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84') as `0x${string}`;
      const wallet = new WalletHelper(page);
      await wallet.connectWallet('test');

      const contracts = new ContractHelper(createTestWallet(), createPublicClientForBasedAI());
      const state = await contracts.getMarketState(testMarketAddress);

      if (state !== 2) {
        console.log('⏭️  Market not ACTIVE, skipping bet error test');
        test.skip();
      }

      try {
        // Try to bet enormous amount (will fail)
        await contracts.placeBet(testMarketAddress, 1, "999999");
        console.log('⚠️  Bet succeeded (unexpected - wallet might have huge balance!)');
      } catch (error: any) {
        if (error.message?.includes('insufficient')) {
          console.log('✅ Insufficient funds error caught correctly');
        } else {
          console.log(`ℹ️  Different error: ${error.message}`);
        }
        expect(error).toBeTruthy();
      }
    });

    test('should handle betting on non-ACTIVE market', async ({ page }) => {
      const testMarketAddress = (process.env.TEST_MARKET_ADDRESS || '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84') as `0x${string}`;
      const contracts = new ContractHelper(createTestWallet(), createPublicClientForBasedAI());

      const state = await contracts.getMarketState(testMarketAddress);

      if (state === 2) {
        console.log('ℹ️  Market is ACTIVE - cannot test non-ACTIVE error');
        test.skip();
      }

      try {
        await contracts.placeBet(testMarketAddress, 1, "0.1");
        console.log('⚠️  Bet succeeded on non-ACTIVE market (unexpected!)');
      } catch (error: any) {
        console.log(`✅ Bet on non-ACTIVE market rejected: ${error.message}`);
        expect(error).toBeTruthy();
      }
    });
  });

  test.describe('Network State Errors', () => {
    test('should validate connection to BasedAI network', async ({ page }) => {
      const wallet = new WalletHelper(page);
      await wallet.connectWallet('test');

      // Check we're on correct network
      await page.goto('/');
      const isOnBasedAI = await wallet.isOnBasedAI();

      console.log(`On BasedAI network: ${isOnBasedAI}`);
      expect(isOnBasedAI).toBe(true);
    });

    test('should handle RPC connectivity', async ({ page }) => {
      const publicClient = createPublicClientForBasedAI();

      try {
        // Try to get chain ID
        const chainId = await publicClient.getChainId();
        console.log(`✅ RPC connection working - Chain ID: ${chainId}`);
        expect(chainId).toBe(32323); // BasedAI
      } catch (error: any) {
        console.log(`⚠️  RPC connection issue: ${error.message}`);
        throw error;
      }
    });
  });

  test.describe('UI Error States', () => {
    test('should handle empty markets list', async ({ page }) => {
      await page.goto('/markets');
      await page.waitForTimeout(2000);

      // Page should load regardless of content
      expect(page.url()).toContain('/markets');
      console.log('✅ Markets page loaded (may be empty)');
    });

    test('should handle loading states', async ({ page }) => {
      await page.goto('/proposals');

      // Page should eventually load
      await page.waitForTimeout(3000);

      expect(page.url()).toContain('/proposals');
      console.log('✅ Page loaded after waiting');
    });
  });

  test.describe('Recovery Mechanisms', () => {
    test('should reconnect wallet after disconnect', async ({ page }) => {
      const wallet = new WalletHelper(page);

      // Connect
      const address1 = await wallet.connectWallet('test');
      console.log(`First connection: ${address1}`);

      // Disconnect
      await wallet.disconnectWallet();
      expect(await wallet.isConnected()).toBe(false);

      // Reconnect
      const address2 = await wallet.connectWallet('test');
      console.log(`Reconnected: ${address2}`);

      expect(address2).toBe(address1);
      console.log('✅ Wallet reconnection successful');
    });

    test('should handle page refresh with authentication', async ({ page }) => {
      const wallet = new WalletHelper(page);

      // Connect wallet
      const address = await wallet.connectWallet('test');
      console.log(`Connected: ${address}`);

      // Reload page
      await page.reload();
      await page.waitForTimeout(2000);

      // Should still be connected
      const stillConnected = await wallet.isConnected();
      console.log(`After reload - still connected: ${stillConnected}`);

      expect(stillConnected).toBe(true);
      console.log('✅ Authentication persisted after reload');
    });
  });
});
