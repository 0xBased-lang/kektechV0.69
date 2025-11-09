/**
 * Supabase Database Types
 *
 * Auto-generated types for type-safe database operations
 *
 * To regenerate:
 * npx supabase gen types typescript --project-id cvablivsycsejtmlbheo > lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Comment: {
        Row: {
          id: string
          marketAddress: string
          userId: string
          comment: string
          upvotes: number
          downvotes: number
          type: string
          timestamp: string
        }
        Insert: {
          id?: string
          marketAddress: string
          userId: string
          comment: string
          upvotes?: number
          downvotes?: number
          type?: string
          timestamp?: string
        }
        Update: {
          id?: string
          marketAddress?: string
          userId?: string
          comment?: string
          upvotes?: number
          downvotes?: number
          type?: string
          timestamp?: string
        }
      }
      CommentVote: {
        Row: {
          id: string
          commentId: string
          userId: string
          vote: string
          timestamp: string
        }
        Insert: {
          id?: string
          commentId: string
          userId: string
          vote: string
          timestamp?: string
        }
        Update: {
          id?: string
          commentId?: string
          userId?: string
          vote?: string
          timestamp?: string
        }
      }
      ProposalVote: {
        Row: {
          id: string
          marketAddress: string
          userId: string
          vote: string
          timestamp: string
        }
        Insert: {
          id?: string
          marketAddress: string
          userId: string
          vote: string
          timestamp?: string
        }
        Update: {
          id?: string
          marketAddress?: string
          userId?: string
          vote?: string
          timestamp?: string
        }
      }
      ResolutionVote: {
        Row: {
          id: string
          marketAddress: string
          userId: string
          vote: string
          comment: string
          timestamp: string
        }
        Insert: {
          id?: string
          marketAddress: string
          userId: string
          vote: string
          comment: string
          timestamp?: string
        }
        Update: {
          id?: string
          marketAddress?: string
          userId?: string
          vote?: string
          comment?: string
          timestamp?: string
        }
      }
      MarketMetadata: {
        Row: {
          id: string
          question: string
          description: string | null
          creator: string
          state: number
          expiryTime: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          question: string
          description?: string | null
          creator: string
          state: number
          expiryTime: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          question?: string
          description?: string | null
          creator?: string
          state?: number
          expiryTime?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      UserActivity: {
        Row: {
          id: string
          userId: string
          activityType: string
          marketAddress: string
          timestamp: string
        }
        Insert: {
          id?: string
          userId: string
          activityType: string
          marketAddress: string
          timestamp?: string
        }
        Update: {
          id?: string
          userId?: string
          activityType?: string
          marketAddress?: string
          timestamp?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
