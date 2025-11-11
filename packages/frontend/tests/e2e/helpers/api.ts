/**
 * KEKTECH 3.0 - API Helper Utilities
 * Helper functions for API interactions in E2E tests
 */

import { expect } from '@playwright/test';

export class APIHelper {
  constructor(private baseURL: string = 'http://localhost:3006') {}

  /**
   * Get proposal votes for a market
   */
  async getProposalVotes(marketAddress: string) {
    const response = await fetch(`${this.baseURL}/api/proposals/${marketAddress}/votes`);
    expect(response.ok).toBeTruthy();
    const data = await response.json();
    return data.data;
  }

  /**
   * Wait for vote count to update (with polling)
   */
  async waitForVoteUpdate(
    marketAddress: string,
    expectedLikes: number,
    expectedDislikes: number,
    timeout: number = 10000
  ) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const votes = await this.getProposalVotes(marketAddress);

      if (votes.likes === expectedLikes && votes.dislikes === expectedDislikes) {
        console.log(`✅ Vote count updated: ${expectedLikes} likes, ${expectedDislikes} dislikes`);
        return votes;
      }

      await new Promise(resolve => setTimeout(resolve, 500)); // Poll every 500ms
    }

    throw new Error(`Vote count did not update within ${timeout}ms`);
  }

  /**
   * Check if user has voted
   */
  async getUserVote(marketAddress: string, userAddress: string): Promise<string | null> {
    const votes = await this.getProposalVotes(marketAddress);
    return votes.userVote || null;
  }
}
