/**
 * KEKTECH 3.0 - Comments API Integration Tests
 *
 * Tests for comment posting, fetching, and voting endpoints
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// Test data
const TEST_MARKET_ADDRESS = '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84'
const TEST_USER_ID = 'test-user-123'
const BASE_URL = 'http://localhost:3000'

// Legacy endpoints relied on the removed /api/comments/post + /api/comments/vote routes.
// Skip these integration tests until the new API surface is wired up.
describe.skip('Comments API (legacy endpoints)', () => {
  describe('GET /api/comments/[marketAddress]', () => {
    it('should fetch comments for a market', async () => {
      const response = await fetch(`${BASE_URL}/api/comments/${TEST_MARKET_ADDRESS}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('comments')
      expect(Array.isArray(data.comments)).toBe(true)
    })

    it('should return empty array for invalid market address', async () => {
      const invalidAddress = '0xinvalid'
      const response = await fetch(`${BASE_URL}/api/comments/${invalidAddress}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data.comments).toHaveLength(0)
    })

    it('should include comment structure with required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/comments/${TEST_MARKET_ADDRESS}`)
      const data = await response.json()

      if (data.comments.length > 0) {
        const comment = data.comments[0]
        expect(comment).toHaveProperty('id')
        expect(comment).toHaveProperty('userId')
        expect(comment).toHaveProperty('marketAddress')
        expect(comment).toHaveProperty('content')
        expect(comment).toHaveProperty('upvotes')
        expect(comment).toHaveProperty('downvotes')
        expect(comment).toHaveProperty('createdAt')
      }
    })
  })

  describe('POST /api/comments/post', () => {
    it('should post a new comment', async () => {
      const commentData = {
        userId: TEST_USER_ID,
        marketAddress: TEST_MARKET_ADDRESS,
        content: 'This is a test comment from Vitest',
      }

      const response = await fetch(`${BASE_URL}/api/comments/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      })

      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('comment')
      expect(data.comment.content).toBe(commentData.content)
      expect(data.comment.userId).toBe(commentData.userId)
    })

    it('should reject comment with missing userId', async () => {
      const commentData = {
        marketAddress: TEST_MARKET_ADDRESS,
        content: 'Test comment',
      }

      const response = await fetch(`${BASE_URL}/api/comments/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      })

      expect(response.status).toBe(400)
    })

    it('should reject comment with empty content', async () => {
      const commentData = {
        userId: TEST_USER_ID,
        marketAddress: TEST_MARKET_ADDRESS,
        content: '',
      }

      const response = await fetch(`${BASE_URL}/api/comments/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      })

      expect(response.status).toBe(400)
    })

    it('should reject comment with too long content', async () => {
      const commentData = {
        userId: TEST_USER_ID,
        marketAddress: TEST_MARKET_ADDRESS,
        content: 'a'.repeat(2001), // Max is 2000
      }

      const response = await fetch(`${BASE_URL}/api/comments/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/comments/vote', () => {
    let testCommentId: string

    beforeAll(async () => {
      // Create a test comment to vote on
      const commentData = {
        userId: TEST_USER_ID,
        marketAddress: TEST_MARKET_ADDRESS,
        content: 'Comment for voting test',
      }

      const response = await fetch(`${BASE_URL}/api/comments/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      })

      const data = await response.json()
      testCommentId = data.comment.id
    })

    it('should upvote a comment', async () => {
      const voteData = {
        userId: `${TEST_USER_ID}-voter-1`,
        commentId: testCommentId,
        vote: 'upvote' as const,
      }

      const response = await fetch(`${BASE_URL}/api/comments/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('upvotes')
      expect(data).toHaveProperty('downvotes')
    })

    it('should downvote a comment', async () => {
      const voteData = {
        userId: `${TEST_USER_ID}-voter-2`,
        commentId: testCommentId,
        vote: 'downvote' as const,
      }

      const response = await fetch(`${BASE_URL}/api/comments/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('upvotes')
      expect(data).toHaveProperty('downvotes')
    })

    it('should reject vote with invalid vote type', async () => {
      const voteData = {
        userId: TEST_USER_ID,
        commentId: testCommentId,
        vote: 'invalid' as any,
      }

      const response = await fetch(`${BASE_URL}/api/comments/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData),
      })

      expect(response.status).toBe(400)
    })

    it('should reject vote with missing commentId', async () => {
      const voteData = {
        userId: TEST_USER_ID,
        vote: 'upvote' as const,
      }

      const response = await fetch(`${BASE_URL}/api/comments/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/comments/delete', () => {
    it('should delete a comment', async () => {
      // First, create a comment to delete
      const commentData = {
        userId: TEST_USER_ID,
        marketAddress: TEST_MARKET_ADDRESS,
        content: 'Comment to be deleted',
      }

      const createResponse = await fetch(`${BASE_URL}/api/comments/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      })

      const createData = await createResponse.json()
      const commentId = createData.comment.id

      // Now delete it
      const deleteResponse = await fetch(`${BASE_URL}/api/comments/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          commentId,
        }),
      })

      const deleteData = await deleteResponse.json()

      expect(deleteResponse.status).toBe(200)
      expect(deleteData).toHaveProperty('success', true)
    })

    it('should prevent deletion by non-owner', async () => {
      // Create a comment
      const commentData = {
        userId: TEST_USER_ID,
        marketAddress: TEST_MARKET_ADDRESS,
        content: 'Comment owned by someone else',
      }

      const createResponse = await fetch(`${BASE_URL}/api/comments/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      })

      const createData = await createResponse.json()
      const commentId = createData.comment.id

      // Try to delete as different user
      const deleteResponse = await fetch(`${BASE_URL}/api/comments/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'different-user',
          commentId,
        }),
      })

      expect(deleteResponse.status).toBe(403)
    })
  })
})
