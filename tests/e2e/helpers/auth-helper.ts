/**
 * KEKTECH 3.0 - Authentication Helper for E2E Tests
 * Programmatic Supabase authentication with wallet signatures
 *
 * Bypasses UI and creates real Supabase sessions for automated testing
 */

import { type WalletClient, type Address, recoverMessageAddress } from 'viem';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';
import { createHash } from 'crypto';

// ==================== AUTH MESSAGE GENERATION ====================

/**
 * Generate authentication message for signing
 * Same format as useWalletAuth hook
 */
function generateAuthMessage(address: string, nonce: string): string {
  return `Welcome to KEKTECH!\n\nSign this message to authenticate your wallet.\n\nWallet: ${address}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
}

/**
 * Generate random nonce for replay protection
 */
function generateNonce(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// ==================== AUTH HELPER CLASS ====================

export class AuthHelper {
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private supabaseServiceKey?: string;

  constructor() {
    // Get Supabase config from ENV
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    this.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error('Supabase config missing in .env.test');
    }
  }

  /**
   * Authenticate wallet programmatically
   * Creates Supabase session without UI interaction
   *
   * @param walletClient - Viem wallet client
   * @returns Session tokens for injection into browser
   */
  async authenticateWallet(walletClient: WalletClient) {
    if (!walletClient.account) {
      throw new Error('Wallet client has no account');
    }

    const address = walletClient.account.address;
    const supabase = createSupabaseClient(this.supabaseUrl, this.supabaseAnonKey);

    try {
      // 1. Generate authentication message
      const nonce = generateNonce();
      const message = generateAuthMessage(address, nonce);

      // 2. Sign message with wallet
      const signature = await walletClient.signMessage({
        account: walletClient.account,
        message,
      });

      // 3. Verify signature (optional but good practice)
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature,
      });

      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Signature verification failed');
      }

      // 4. Sign in to Supabase (or create account if needed)
      // Use wallet address as deterministic password (not signature which changes each time)
      // Hash to fit Supabase 72-char password limit
      const hashedPassword = createHash('sha256').update(address.toLowerCase()).digest('hex').substring(0, 64);

      // Format email: hash address to shorter format (Supabase has strict email validation)
      // Use first 16 chars of address hash for brevity
      const addressHash = createHash('sha256').update(address.toLowerCase()).digest('hex').substring(0, 16);
      const emailAddress = `wallet-${addressHash}@kektech.xyz`;

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailAddress,
        password: hashedPassword,
      });

      if (signInError) {
        // User doesn't exist - create account
        if (signInError.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: emailAddress,
            password: hashedPassword,
            options: {
              data: {
                wallet_address: address.toLowerCase(),
                nonce,
                signed_at: new Date().toISOString(),
              },
            },
          });

          // If user already exists, try to sign in instead
          if (signUpError && signUpError.message.includes('User already registered')) {
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email: emailAddress,
              password: hashedPassword,
            });

            if (retryError) {
              throw new Error(`Sign in failed for existing user: ${retryError.message}`);
            }

            if (!retryData.session) {
              throw new Error('No session after sign in');
            }

            return {
              session: retryData.session,
              user: retryData.user,
              walletAddress: address,
            };
          }

          if (signUpError) {
            throw new Error(`Sign up failed: ${signUpError.message}`);
          }

          // Auto-confirm email for E2E testing (only if service key available)
          if (this.supabaseServiceKey) {
            try {
              // Create admin client with service role
              const adminClient = createSupabaseClient(
                this.supabaseUrl,
                this.supabaseServiceKey
              );

              // Get the user that was just created
              const { data: userData } = await adminClient.auth.admin.listUsers();
              const newUser = userData?.users.find((u: any) => u.email === emailAddress);

              if (newUser) {
                // Confirm the email
                await adminClient.auth.admin.updateUserById(newUser.id, {
                  email_confirm: true
                });
                console.log(`✅ Auto-confirmed email for test user: ${emailAddress}`);

                // Small delay to let Supabase process the confirmation
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (confirmError) {
              console.warn('⚠️ Auto-confirmation failed (continuing anyway):', confirmError);
              // Don't throw - let the test continue, it might still work
            }
          }

          // Retry sign in
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email: emailAddress,
            password: hashedPassword,
          });

          if (retryError) {
            throw new Error(`Sign in after signup failed: ${retryError.message}`);
          }

          if (!retryData.session) {
            throw new Error('No session after signup');
          }

          return {
            session: retryData.session,
            user: retryData.user,
            walletAddress: address,
          };
        } else {
          throw new Error(`Sign in failed: ${signInError.message}`);
        }
      }

      if (!signInData.session) {
        throw new Error('No session returned from sign in');
      }

      return {
        session: signInData.session,
        user: signInData.user,
        walletAddress: address,
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Inject Supabase session into Playwright browser context
   * This makes the browser "logged in" without UI interaction
   *
   * @param page - Playwright page
   * @param sessionData - Session data from authenticateWallet()
   */
  async injectAuthSession(page: Page, sessionData: any) {
    const { session } = sessionData;

    if (!session) {
      throw new Error('No session to inject');
    }

    // Inject Supabase session into browser localStorage
    // This mimics what Supabase client does when user authenticates
    await page.evaluate(
      ({ supabaseUrl, session }) => {
        const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;

        const authData = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: session.user,
        };

        localStorage.setItem(storageKey, JSON.stringify(authData));
      },
      { supabaseUrl: this.supabaseUrl, session }
    );
  }

  /**
   * Clear authentication from browser
   * @param page - Playwright page
   */
  async clearAuthSession(page: Page) {
    await page.evaluate(
      ({ supabaseUrl }) => {
        const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
        localStorage.removeItem(storageKey);
      },
      { supabaseUrl: this.supabaseUrl }
    );
  }

  /**
   * Verify authentication status in browser
   * @param page - Playwright page
   * @returns True if authenticated
   */
  async isAuthenticated(page: Page): Promise<boolean> {
    return await page.evaluate(
      ({ supabaseUrl }) => {
        const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
        const authData = localStorage.getItem(storageKey);
        return !!authData;
      },
      { supabaseUrl: this.supabaseUrl }
    );
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Create authenticated page context
 * Combines wallet authentication and session injection
 *
 * @param page - Playwright page
 * @param walletClient - Viem wallet client
 * @returns Authentication session data
 */
export async function authenticatePageWithWallet(
  page: Page,
  walletClient: WalletClient
) {
  const authHelper = new AuthHelper();

  // 1. Authenticate wallet programmatically
  const sessionData = await authHelper.authenticateWallet(walletClient);

  // 2. Navigate to app (establishes domain)
  await page.goto(process.env.TEST_BASE_URL || 'http://localhost:3006');

  // 3. Inject session into browser
  await authHelper.injectAuthSession(page, sessionData);

  // 4. Reload to apply authentication
  await page.reload();

  return sessionData;
}

// ==================== EXPORTS ====================

export type { Address };
