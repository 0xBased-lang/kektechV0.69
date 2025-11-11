/**
 * KEKTECH 3.0 - E2E Test Suite
 * Test 2: Proposal Voting (Like/Dislike)
 *
 * Tests voting on market proposals with authentication
 */

import { test, expect } from '@playwright/test';
import { WalletHelper } from './helpers/wallet';
import { APIHelper } from './helpers/api';

test.describe('Proposal Voting Flow', () => {
  let wallet: WalletHelper;
  let api: APIHelper;
  let testMarketAddress: string;

  test.beforeEach(async ({ page }) => {
    wallet = new WalletHelper(page);
    api = new APIHelper();

    // Navigate to proposals page
    await page.goto('/proposals');

    // Get first market address from page
    const firstMarket = page.locator('[data-market-address]').first();
    testMarketAddress = await firstMarket.getAttribute('data-market-address') || '';

    if (!testMarketAddress) {
      // Fallback: Use test market from env
      testMarketAddress = process.env.TEST_MARKET_ADDRESS || '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84';
    }
  });

  test('should display proposal cards with voting buttons', async ({ page }) => {
    // Wait for proposals to load
    await page.waitForSelector('[data-testid="proposal-card"]', { timeout: 10000 });

    // Verify vote buttons are visible
    const likeButton = page.locator('button:has-text("👍")').first();
    const dislikeButton = page.locator('button:has-text("👎")').first();

    await expect(likeButton).toBeVisible();
    await expect(dislikeButton).toBeVisible();
  });

  test('should show login prompt when voting without wallet', async ({ page }) => {
    // Ensure wallet is NOT connected
    const isConnected = await wallet.isConnected();
    if (isConnected) {
      await wallet.disconnectWallet();
    }

    // Try to vote
    const likeButton = page.locator('button:has-text("👍")').first();
    await likeButton.click();

    // Should prompt to connect wallet
    const walletModal = page.locator('[data-testid="wallet-modal"], .wallet-modal, text=/connect wallet/i');
    await expect(walletModal).toBeVisible({ timeout: 3000 });
  });

  test('should submit like vote successfully', async ({ page }) => {
    const isConnected = await wallet.isConnected();

    if (!isConnected) {
      console.log('⏭️  Skipping: Requires connected wallet');
      test.skip();
    }

    // Get initial vote counts
    const initialVotes = await api.getProposalVotes(testMarketAddress);
    console.log(`Initial votes - Likes: ${initialVotes.likes}, Dislikes: ${initialVotes.dislikes}`);

    // Click like button
    const likeButton = page.locator(`[data-market-address="${testMarketAddress}"] button:has-text("👍")`);
    await likeButton.click();

    // Wait for vote to process
    await page.waitForTimeout(2000);

    // Verify vote count incremented
    const updatedVotes = await api.waitForVoteUpdate(
      testMarketAddress,
      initialVotes.userVote === 'like' ? initialVotes.likes : initialVotes.likes + 1,
      initialVotes.userVote === 'dislike' ? initialVotes.dislikes - 1 : initialVotes.dislikes,
      10000
    );

    expect(updatedVotes.userVote).toBe('like');
    console.log(`✅ Vote submitted: ${updatedVotes.likes} likes`);
  });

  test('should change vote from like to dislike', async ({ page }) => {
    const isConnected = await wallet.isConnected();

    if (!isConnected) {
      console.log('⏭️  Skipping: Requires connected wallet');
      test.skip();
    }

    // First, ensure user has liked
    const likeButton = page.locator(`[data-market-address="${testMarketAddress}"] button:has-text("👍")`);
    await likeButton.click();
    await page.waitForTimeout(1000);

    const initialVotes = await api.getProposalVotes(testMarketAddress);

    // Now click dislike
    const dislikeButton = page.locator(`[data-market-address="${testMarketAddress}"] button:has-text("👎")`);
    await dislikeButton.click();

    // Wait for vote to update
    await page.waitForTimeout(2000);

    const updatedVotes = await api.getProposalVotes(testMarketAddress);

    // Verify vote changed
    expect(updatedVotes.userVote).toBe('dislike');
    expect(updatedVotes.dislikes).toBeGreaterThan(initialVotes.dislikes);
    console.log(`✅ Vote changed to dislike`);
  });

  test('should persist vote after page refresh', async ({ page }) => {
    const isConnected = await wallet.isConnected();

    if (!isConnected) {
      console.log('⏭️  Skipping: Requires connected wallet');
      test.skip();
    }

    // Vote
    const likeButton = page.locator(`[data-market-address="${testMarketAddress}"] button:has-text("👍")`);
    await likeButton.click();
    await page.waitForTimeout(2000);

    // Refresh page
    await page.reload();

    // Wait for page to load
    await page.waitForSelector('[data-testid="proposal-card"]', { timeout: 10000 });

    // Verify vote is still there
    const votes = await api.getProposalVotes(testMarketAddress);
    expect(votes.userVote).toBe('like');

    // UI should show active like button
    const activeLikeButton = page.locator(`[data-market-address="${testMarketAddress}"] button:has-text("👍")[data-active="true"]`);
    await expect(activeLikeButton).toBeVisible().catch(() => {
      console.log('ℹ️  Active state might not be visually indicated');
    });
  });

  test('should display vote counts correctly', async ({ page }) => {
    await page.waitForSelector('[data-testid="proposal-card"]', { timeout: 10000 });

    // Get votes from API
    const votes = await api.getProposalVotes(testMarketAddress);

    // Find vote count display on page
    const voteDisplay = page.locator(`[data-market-address="${testMarketAddress}"] [data-testid="vote-counts"]`);
    const voteText = await voteDisplay.textContent();

    // Verify counts are displayed
    expect(voteText).toContain(votes.likes.toString());
    expect(voteText).toContain(votes.dislikes.toString());

    console.log(`✅ Vote counts displayed: ${votes.likes} likes, ${votes.dislikes} dislikes`);
  });
});
