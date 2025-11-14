/**
 * KEKTECH 3.0 - Voting API Integration Tests
 *
 * Tests for proposal voting and resolution voting endpoints
 */
import { describe, it, expect } from 'vitest'

const TEST_MARKET_ADDRESS = '0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84'
const TEST_USER_ID = 'test-voter-123'
const BASE_URL = 'http://localhost:3000'

// Legacy endpoints under /api/voting/* were removed; skip until new routes exist.
describe.skip('Voting API (legacy endpoints)', () => {
  describe('Proposal Voting', () => {
    describe('GET /api/voting/proposal-votes/[marketAddress]', () => {
      it('should fetch proposal votes for a market', async () => {
        const response = await fetch(`${BASE_URL}/api/voting/proposal-votes/${TEST_MARKET_ADDRESS}`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('likes')
        expect(data).toHaveProperty('dislikes')
        expect(typeof data.likes).toBe('number')
        expect(typeof data.dislikes).toBe('number')
      })

      it('should return 0 votes for new market', async () => {
        const newMarketAddress = '0x' + '0'.repeat(40)
        const response = await fetch(`${BASE_URL}/api/voting/proposal-votes/${newMarketAddress}`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.likes).toBe(0)
        expect(data.dislikes).toBe(0)
      })
    })

    describe('POST /api/voting/proposal-vote', () => {
      it('should submit a like vote', async () => {
        const voteData = {
          userId: `${TEST_USER_ID}-like`,
          marketAddress: TEST_MARKET_ADDRESS,
          vote: 'like' as const,
        }

        const response = await fetch(`${BASE_URL}/api/voting/proposal-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(voteData),
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('votes')
        expect(data.votes).toHaveProperty('likes')
        expect(data.votes).toHaveProperty('dislikes')
      })

      it('should submit a dislike vote', async () => {
        const voteData = {
          userId: `${TEST_USER_ID}-dislike`,
          marketAddress: TEST_MARKET_ADDRESS,
          vote: 'dislike' as const,
        }

        const response = await fetch(`${BASE_URL}/api/voting/proposal-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(voteData),
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
      })

      it('should allow user to change vote', async () => {
        const userId = `${TEST_USER_ID}-changer`

        // First vote: like
        await fetch(`${BASE_URL}/api/voting/proposal-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            marketAddress: TEST_MARKET_ADDRESS,
            vote: 'like' as const,
          }),
        })

        // Change to dislike
        const response = await fetch(`${BASE_URL}/api/voting/proposal-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            marketAddress: TEST_MARKET_ADDRESS,
            vote: 'dislike' as const,
          }),
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
      })

      it('should reject vote with invalid type', async () => {
        const voteData = {
          userId: TEST_USER_ID,
          marketAddress: TEST_MARKET_ADDRESS,
          vote: 'invalid' as any,
        }

        const response = await fetch(`${BASE_URL}/api/voting/proposal-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(voteData),
        })

        expect(response.status).toBe(400)
      })

      it('should reject vote with missing userId', async () => {
        const voteData = {
          marketAddress: TEST_MARKET_ADDRESS,
          vote: 'like' as const,
        }

        const response = await fetch(`${BASE_URL}/api/voting/proposal-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(voteData),
        })

        expect(response.status).toBe(400)
      })
    })
  })

  describe('Resolution Voting', () => {
    describe('GET /api/voting/resolution-votes/[marketAddress]', () => {
      it('should fetch resolution votes for a market', async () => {
        const response = await fetch(`${BASE_URL}/api/voting/resolution-votes/${TEST_MARKET_ADDRESS}`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('votes')
        expect(Array.isArray(data.votes)).toBe(true)
      })

      it('should include vote structure with required fields', async () => {
        const response = await fetch(`${BASE_URL}/api/voting/resolution-votes/${TEST_MARKET_ADDRESS}`)
        const data = await response.json()

        if (data.votes.length > 0) {
          const vote = data.votes[0]
          expect(vote).toHaveProperty('userId')
          expect(vote).toHaveProperty('marketAddress')
          expect(vote).toHaveProperty('vote')
          expect(vote).toHaveProperty('comment')
          expect(vote).toHaveProperty('createdAt')
        }
      })
    })

    describe('POST /api/voting/resolution-vote', () => {
      it('should submit an agree vote with comment', async () => {
        const voteData = {
          userId: `${TEST_USER_ID}-agree`,
          marketAddress: TEST_MARKET_ADDRESS,
          vote: 'agree' as const,
          comment: 'I agree with this resolution because it makes sense.',
        }

        const response = await fetch(`${BASE_URL}/api/voting/resolution-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(voteData),
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('vote')
        expect(data.vote.vote).toBe('agree')
        expect(data.vote.comment).toBe(voteData.comment)
      })

      it('should submit a disagree vote with comment', async () => {
        const voteData = {
          userId: `${TEST_USER_ID}-disagree`,
          marketAddress: TEST_MARKET_ADDRESS,
          vote: 'disagree' as const,
          comment: 'I disagree with this resolution for several reasons.',
        }

        const response = await fetch(`${BASE_URL}/api/voting/resolution-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(voteData),
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
      })

      it('should reject vote with short comment', async () => {
        const voteData = {
          userId: TEST_USER_ID,
          marketAddress: TEST_MARKET_ADDRESS,
          vote: 'agree' as const,
          comment: 'Too short', // Less than 20 characters
        }

        const response = await fetch(`${BASE_URL}/api/voting/resolution-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(voteData),
        })

        expect(response.status).toBe(400)
      })

      it('should reject vote without comment', async () => {
        const voteData = {
          userId: TEST_USER_ID,
          marketAddress: TEST_MARKET_ADDRESS,
          vote: 'agree' as const,
        }

        const response = await fetch(`${BASE_URL}/api/voting/resolution-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(voteData),
        })

        expect(response.status).toBe(400)
      })

      it('should prevent duplicate votes from same user', async () => {
        const userId = `${TEST_USER_ID}-duplicate`
        const voteData = {
          userId,
          marketAddress: TEST_MARKET_ADDRESS,
          vote: 'agree' as const,
          comment: 'This is my first resolution vote and I agree.',
        }

        // First vote should succeed
        await fetch(`${BASE_URL}/api/voting/resolution-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(voteData),
        })

        // Second vote should fail
        const secondResponse = await fetch(`${BASE_URL}/api/voting/resolution-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...voteData,
            comment: 'Trying to vote again with different comment.',
          }),
        })

        expect(secondResponse.status).toBe(409) // Conflict
      })

      it('should reject vote with invalid vote type', async () => {
        const voteData = {
          userId: TEST_USER_ID,
          marketAddress: TEST_MARKET_ADDRESS,
          vote: 'maybe' as any,
          comment: 'This is my comment but vote type is invalid.',
        }

        const response = await fetch(`${BASE_URL}/api/voting/resolution-vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(voteData),
        })

        expect(response.status).toBe(400)
      })
    })
  })
})
