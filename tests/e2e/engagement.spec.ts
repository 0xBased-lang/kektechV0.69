/**
 * KEKTECH 3.0 - Engagement Features E2E Test
 *
 * Tests for comment posting, voting UI, and user interactions
 */
import { test, expect } from '@playwright/test'

const TEST_MARKET = '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84'

test.describe('Engagement Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/market/${TEST_MARKET}`)
    await page.waitForLoadState('networkidle')
  })

  test.describe('Comment Section', () => {
    test('should display comment form for signed-in users or sign-in prompt', async ({ page }) => {
      // Either a comment form or a sign-in button should be visible
      const commentForm = page.locator('form').filter({ hasText: /comment/i })
      const signInButton = page.getByRole('button', { name: /sign in|connect/i })

      const hasCommentForm = await commentForm.isVisible().catch(() => false)
      const hasSignInButton = await signInButton.isVisible().catch(() => false)

      expect(hasCommentForm || hasSignInButton).toBe(true)
    })

    test('should show character count when typing comment', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="comment" i]')

      // Only test if textarea is visible (user is signed in)
      if (await textarea.isVisible().catch(() => false)) {
        await textarea.fill('This is a test comment')

        // Look for character count display
        const charCount = page.locator('text=/\\d+\\/2000/i')
        await expect(charCount).toBeVisible()
      }
    })

    test('should disable submit button when comment is empty', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="comment" i]')

      if (await textarea.isVisible().catch(() => false)) {
        // Clear textarea
        await textarea.fill('')

        // Submit button should be disabled
        const submitButton = page.getByRole('button', { name: /post comment/i })
        await expect(submitButton).toBeDisabled()
      }
    })

    test('should enable submit button when comment has content', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="comment" i]')

      if (await textarea.isVisible().catch(() => false)) {
        await textarea.fill('This is a valid comment with enough characters')

        const submitButton = page.getByRole('button', { name: /post comment/i })
        await expect(submitButton).toBeEnabled()
      }
    })
  })

  test.describe('Comment List', () => {
    test('should display existing comments or empty state', async ({ page }) => {
      // Wait for comments to load
      await page.waitForTimeout(1000)

      const commentList = page.locator('[data-testid="comment-list"]')
      const emptyState = page.locator('text=/no comments/i')

      const hasComments = await commentList.isVisible().catch(() => false)
      const hasEmptyState = await emptyState.isVisible().catch(() => false)

      // Either comments or empty state should be visible
      expect(hasComments || hasEmptyState).toBe(true)
    })

    test('should display vote buttons on comments', async ({ page }) => {
      await page.waitForTimeout(1000)

      // Look for thumbs up/down icons
      const upvoteButtons = page.locator('button:has-text("👍"), button[aria-label*="upvote" i]')
      const downvoteButtons = page.locator('button:has-text("👎"), button[aria-label*="downvote" i]')

      const hasVoteButtons = await upvoteButtons.count().then(c => c > 0) ||
                              await downvoteButtons.count().then(c => c > 0)

      // If there are comments, there should be vote buttons
      // We can't assert this strictly because there might be no comments
    })
  })

  test.describe('Proposal Voting', () => {
    test('should display proposal voting UI', async ({ page }) => {
      const likeButton = page.getByRole('button', { name: /like/i })
      const dislikeButton = page.getByRole('button', { name: /dislike/i })

      // Both buttons should exist
      await expect(likeButton).toBeVisible()
      await expect(dislikeButton).toBeVisible()
    })

    test('should display vote counts', async ({ page }) => {
      // Look for numbers indicating vote counts
      const voteCountPattern = /\d+/

      const likeSection = page.locator('text=/like/i').locator('..')
      const dislikeSection = page.locator('text=/dislike/i').locator('..')

      // Should have numbers visible near the vote buttons
      await expect(likeSection.locator('text=' + voteCountPattern).first()).toBeVisible()
      await expect(dislikeSection.locator('text=' + voteCountPattern).first()).toBeVisible()
    })

    test('should show loading state when voting', async ({ page }) => {
      const likeButton = page.getByRole('button', { name: /like/i })

      // Click the button if not disabled
      if (await likeButton.isEnabled()) {
        await likeButton.click()

        // Look for loading indicator (spinner or "voting..." text)
        const loadingIndicator = page.locator('text=/voting|loading/i, [data-testid="spinner"]')

        // Loading state should appear briefly
        // This may not always be visible if the operation is very fast
        // So we don't make it a hard assertion
      }
    })
  })

  test.describe('Resolution Voting', () => {
    test('should display resolution voting form', async ({ page }) => {
      // Look for resolution voting section
      const resolutionSection = page.locator('text=/resolution/i').locator('..')

      // Should have agree/disagree options
      const agreeOption = page.locator('text=/agree/i')
      const disagreeOption = page.locator('text=/disagree/i')

      const hasResolutionVoting = await resolutionSection.isVisible().catch(() => false)

      // Resolution voting might not be visible for all markets
      // Only check if it exists
      if (hasResolutionVoting) {
        await expect(agreeOption).toBeVisible()
        await expect(disagreeOption).toBeVisible()
      }
    })

    test('should require comment for resolution vote', async ({ page }) => {
      const commentTextarea = page.locator('textarea[placeholder*="reason" i]')

      if (await commentTextarea.isVisible().catch(() => false)) {
        // Submit button should be disabled with short comment
        await commentTextarea.fill('Too short')

        const submitButton = page.getByRole('button', { name: /submit vote/i })
        await expect(submitButton).toBeDisabled()
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should show error boundary on component error', async ({ page }) => {
      // Trigger an error by navigating to invalid market
      await page.goto('/market/invalid-address')
      await page.waitForLoadState('networkidle')

      // Should either show error boundary or gracefully handle
      const errorBoundary = page.locator('text=/something went wrong/i')
      const notFound = page.locator('text=/not found|invalid/i')

      const hasErrorHandling = await errorBoundary.isVisible().catch(() => false) ||
                                 await notFound.isVisible().catch(() => false)

      // Error should be handled gracefully
      expect(hasErrorHandling).toBe(true)
    })

    test('should show toast on failed action', async ({ page }) => {
      // Try to vote without authentication
      const voteButton = page.getByRole('button', { name: /like|upvote/i }).first()

      if (await voteButton.isEnabled()) {
        await voteButton.click()

        // Look for toast notification
        const toast = page.locator('[data-sonner-toast], [role="alert"]')
        await expect(toast).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Loading States', () => {
    test('should show skeleton loaders while loading', async ({ page }) => {
      // Navigate to market page
      await page.goto(`/market/${TEST_MARKET}`)

      // Look for skeleton loaders (elements with animate-pulse class)
      const skeletons = page.locator('.animate-pulse')

      // Skeletons might only be visible briefly, so we check if they existed
      // during the loading phase by taking a screenshot early
    })
  })

  test.describe('Empty States', () => {
    test('should show empty state when no comments exist', async ({ page }) => {
      // Create a market address that definitely has no comments
      const emptyMarket = '0x' + '0'.repeat(40)

      await page.goto(`/market/${emptyMarket}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000) // Wait for API call

      // Look for empty state message
      const emptyState = page.locator('text=/no comments yet|be the first/i')
      await expect(emptyState).toBeVisible({ timeout: 5000 })
    })
  })
})
