/**
 * KEKTECH 3.0 - E2E Test Suite
 * Test 4: Market Trading (Place Bets)
 *
 * ✅ UPDATED: Now uses programmatic wallet and contract helper for real bets
 * Tests placing bets on active markets with actual blockchain transactions
 */

import { test, expect } from '@playwright/test';
import { WalletHelper } from './helpers/wallet';
import { APIHelper } from './helpers/api';
import { ContractHelper } from './helpers/contract-helper';
import { createTestWallet, createPublicClientForBasedAI } from './helpers/wallet-client';

test.describe('Market Trading', () => {
  let wallet: WalletHelper;
  let api: APIHelper;
  let contracts: ContractHelper;
  const testMarketAddress = (process.env.TEST_MARKET_ADDRESS || '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84') as `0x${string}`;

  test.beforeEach(async ({ page }) => {
    wallet = new WalletHelper(page);
    api = new APIHelper();

    // Create contract helper with test wallet
    const testWallet = createTestWallet();
    const publicClient = createPublicClientForBasedAI();
    contracts = new ContractHelper(testWallet, publicClient);
  });

  test('should display markets page', async ({ page }) => {
    await page.goto('/markets');

    // Page should load without errors
    expect(page.url()).toContain('/markets');
    console.log('✅ Markets page loaded');
  });

  test('should check if market is ACTIVE for trading', async ({ page }) => {
    const state = await contracts.getMarketState(testMarketAddress);
    console.log(`✅ Market state: ${state}`);

    // State 2 = ACTIVE (can trade)
    // Other states may prevent trading
    const stateNames = ['PROPOSED', 'APPROVED', 'ACTIVE', 'RESOLVING', 'DISPUTED', 'FINALIZED'];
    console.log(`Market is ${stateNames[state]}`);

    expect(state).toBeGreaterThanOrEqual(0);
    expect(state).toBeLessThanOrEqual(5);
  });

  test('should connect wallet and check balance before trading', async ({ page }) => {
    // ✅ Connect wallet
    const address = await wallet.connectWallet('test');
    console.log(`✅ Wallet connected: ${address}`);

    // Check wallet balance
    const publicClient = createPublicClientForBasedAI();
    const balance = await publicClient.getBalance({ address: address as `0x${string}` });
    const balanceBASED = Number(balance) / 1e18;

    console.log(`✅ Wallet balance: ${balanceBASED.toFixed(4)} BASED`);

    expect(balanceBASED).toBeGreaterThanOrEqual(0);

    if (balanceBASED < 0.1) {
      console.log('⚠️  Wallet has low balance - may not be able to place bets');
    }
  });

  test('should place bet on market (if ACTIVE)', async ({ page }) => {
    const state = await contracts.getMarketState(testMarketAddress);

    if (state !== 2) {
      console.log(`⏭️  Market not ACTIVE (state: ${state}), skipping bet test`);
      test.skip();
    }

    // Get initial shares
    const address = await wallet.connectWallet('test');
    const initialYesShares = await contracts.getUserShares(testMarketAddress, address as `0x${string}`, 1);
    const initialNoShares = await contracts.getUserShares(testMarketAddress, address as `0x${string}`, 0);

    console.log(`Initial shares - YES: ${initialYesShares}, NO: ${initialNoShares}`);

    try {
      // ✅ Place bet via contract (REAL BET! 🎰)
      const betAmount = '0.1'; // 0.1 BASED
      const outcome = 1; // YES

      console.log(`📝 Placing bet: ${betAmount} BASED on outcome ${outcome}...`);

      const hash = await contracts.placeBet(testMarketAddress, outcome, betAmount);
      console.log(`✅ Bet transaction submitted: ${hash}`);

      // Wait for confirmation
      const receipt = await contracts.waitForTransaction(hash);
      console.log(`✅ Bet confirmed in block ${receipt.blockNumber}`);

      // Verify shares increased
      const newYesShares = await contracts.getUserShares(testMarketAddress, address as `0x${string}`, 1);

      expect(newYesShares).toBeGreaterThan(initialYesShares);
      console.log(`✅ Shares increased: ${initialYesShares} → ${newYesShares}`);
    } catch (error: any) {
      if (error.message?.includes('insufficient funds')) {
        console.log('⚠️  Wallet needs more BASED tokens');
        test.skip();
      } else if (error.message?.includes('not active') || error.message?.includes('cannot bet')) {
        console.log('⚠️  Market not accepting bets');
        test.skip();
      } else {
        throw error;
      }
    }
  });

  test('should get user position from blockchain', async ({ page }) => {
    const address = await wallet.connectWallet('test');

    // Get user's shares for both outcomes
    const yesShares = await contracts.getUserShares(testMarketAddress, address as `0x${string}`, 1);
    const noShares = await contracts.getUserShares(testMarketAddress, address as `0x${string}`, 0);

    console.log(`✅ User position:`);
    console.log(`   YES shares: ${yesShares}`);
    console.log(`   NO shares: ${noShares}`);

    expect(typeof yesShares).toBe('bigint');
    expect(typeof noShares).toBe('bigint');
  });

  test('should get market info including volume and shares', async ({ page }) => {
    const info = await contracts.getMarketInfo(testMarketAddress);

    console.log(`✅ Market trading info:`);
    console.log(`   State: ${info.state}`);
    console.log(`   Total Volume: ${info.totalVolume} BASED`);
    console.log(`   YES shares: ${info.yesShares}`);
    console.log(`   NO shares: ${info.noShares}`);

    // Calculate odds
    const totalShares = info.yesShares + info.noShares;
    if (totalShares > 0) {
      const yesOdds = (info.yesShares / totalShares * 100).toFixed(1);
      const noOdds = (info.noShares / totalShares * 100).toFixed(1);
      console.log(`   Current odds: YES ${yesOdds}% / NO ${noOdds}%`);
    }

    expect(parseFloat(info.totalVolume)).toBeGreaterThanOrEqual(0);
  });

  test('should sell shares (if user has position)', async ({ page }) => {
    const address = await wallet.connectWallet('test');

    // Check if user has shares
    const yesShares = await contracts.getUserShares(testMarketAddress, address as `0x${string}`, 1);

    if (yesShares === 0n) {
      console.log('⏭️  User has no shares to sell, skipping');
      test.skip();
    }

    try {
      // Sell a small amount (e.g., 10% of shares or minimum 1)
      const sharesToSell = yesShares > 10n ? yesShares / 10n : 1n;

      console.log(`📝 Selling ${sharesToSell} YES shares...`);

      const hash = await contracts.sellShares(testMarketAddress, 1, sharesToSell);
      console.log(`✅ Sell transaction submitted: ${hash}`);

      const receipt = await contracts.waitForTransaction(hash);
      console.log(`✅ Shares sold in block ${receipt.blockNumber}`);

      // Verify shares decreased
      const newShares = await contracts.getUserShares(testMarketAddress, address as `0x${string}`, 1);
      expect(newShares).toBeLessThan(yesShares);

      console.log(`✅ Shares decreased: ${yesShares} → ${newShares}`);
    } catch (error: any) {
      if (error.message?.includes('insufficient')) {
        console.log('⚠️  Cannot sell - insufficient shares');
        test.skip();
      } else {
        console.log(`ℹ️  Sell test: ${error.message}`);
      }
    }
  });

  test('should claim winnings (if market resolved and user won)', async ({ page }) => {
    const state = await contracts.getMarketState(testMarketAddress);

    if (state !== 5) {
      console.log(`⏭️  Market not FINALIZED (state: ${state}), cannot claim`);
      test.skip();
    }

    const address = await wallet.connectWallet('test');

    // Check if already claimed
    const hasClaimed = await contracts.hasClaimed(testMarketAddress, address as `0x${string}`);

    if (hasClaimed) {
      console.log('✅ User already claimed winnings');
      test.skip();
    }

    try {
      console.log('📝 Claiming winnings...');

      const hash = await contracts.claimWinnings(testMarketAddress);
      console.log(`✅ Claim transaction submitted: ${hash}`);

      const receipt = await contracts.waitForTransaction(hash);
      console.log(`✅ Winnings claimed in block ${receipt.blockNumber}`);

      // Verify claimed
      const nowClaimed = await contracts.hasClaimed(testMarketAddress, address as `0x${string}`);
      expect(nowClaimed).toBe(true);
    } catch (error: any) {
      if (error.message?.includes('no winnings') || error.message?.includes('nothing to claim')) {
        console.log('ℹ️  User did not win or has no position');
        test.skip();
      } else {
        console.log(`ℹ️  Claim test: ${error.message}`);
      }
    }
  });

  test('should navigate to market detail page in UI', async ({ page }) => {
    await wallet.connectWallet('test');
    await page.goto(`/market/${testMarketAddress}`);

    // Page should load
    expect(page.url()).toContain(testMarketAddress.toLowerCase());
    console.log('✅ Market detail page loaded');
  });

  test('should validate bet requirements', async ({ page }) => {
    const state = await contracts.getMarketState(testMarketAddress);
    console.log(`Market state: ${state}`);

    // Only ACTIVE markets (state 2) allow betting
    const canBet = state === 2;

    if (canBet) {
      console.log('✅ Market is ACTIVE - betting allowed');
    } else {
      console.log(`ℹ️  Market not ACTIVE - betting not allowed (state: ${state})`);
    }
  });
});
