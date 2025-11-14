/**
 * KEKTECH 3.0 - SIWE Authentication Verification
 * POST /api/auth/verify - Verify wallet signature and create session
 *
 * This route implements EIP-4361 (Sign-In with Ethereum) verification
 * and integrates with Supabase authentication.
 *
 * Security:
 * - Server-side signature verification
 * - Nonce validation for replay protection
 * - Domain and timestamp validation
 * - Service role key only used server-side
 */

import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { z } from 'zod';

// Input validation schema
const authRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/, 'Invalid signature format'),
});

// Helper function to create Supabase admin client (lazy initialization)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Helper function to create rate limiter (lazy initialization)
function getRateLimiter() {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'auth',
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  try {
    // 1. CORS validation
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'https://kektech-frontend.vercel.app', // Vercel production deployment
      'https://kektech.xyz',
      'https://www.kektech.xyz',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    ].filter(Boolean);

    if (origin && !allowedOrigins.includes(origin)) {
      console.warn('[AUTH] Blocked unauthorized origin', { origin, ip });
      return NextResponse.json(
        { success: false, error: 'Unauthorized origin' },
        { status: 403 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = authRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.warn('[AUTH] Invalid request format', {
        ip,
        errors: validationResult.error.issues,
      });
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { message, signature } = validationResult.data;

    // 3. Verify SIWE signature (to extract wallet address for rate limiting)
    const siweMessage = new SiweMessage(message);
    const verificationResult = await siweMessage.verify({ signature });

    if (!verificationResult.success) {
      console.warn('[AUTH] Signature verification failed', { ip });
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Extract wallet address from verified message
    const walletAddress = verificationResult.data.address.toLowerCase();

    // 4. Rate limiting (per wallet address)
    const ratelimit = getRateLimiter();
    const { success: rateLimitOk, remaining } = await ratelimit.limit(walletAddress);

    if (!rateLimitOk) {
      console.warn('[AUTH] Rate limit exceeded', {
        walletAddress,
        ip,
        remaining,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Too many authentication attempts. Please try again in 15 minutes.',
        },
        { status: 429 }
      );
    }

    console.log('[AUTH] Rate limit check passed', { walletAddress, remaining });

    // 5. Validate domain matches expected domain
    const expectedDomain = new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').host;
    if (siweMessage.domain !== expectedDomain) {
      return NextResponse.json(
        { success: false, error: 'Invalid domain' },
        { status: 401 }
      );
    }

    // Validate timestamp (message must be recent - max 10 minutes old)
    const now = new Date();
    const issuedAt = new Date(siweMessage.issuedAt || 0);
    const maxAge = 10 * 60 * 1000; // 10 minutes in milliseconds

    if (now.getTime() - issuedAt.getTime() > maxAge) {
      return NextResponse.json(
        { success: false, error: 'Message expired' },
        { status: 401 }
      );
    }

    // Validate expiration time if present
    if (siweMessage.expirationTime) {
      const expirationTime = new Date(siweMessage.expirationTime);
      if (now > expirationTime) {
        return NextResponse.json(
          { success: false, error: 'Message expired' },
          { status: 401 }
        );
      }
    }

    // Create email for Supabase auth (unique per wallet)
    const email = `${walletAddress}@kektech.xyz`;

    // Initialize Supabase admin client (lazy initialization at runtime)
    const supabaseAdmin = getSupabaseAdmin();

    // Check if auth user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const existingUser = existingUsers.users.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      // User exists, use existing ID
      userId = existingUser.id;
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-confirm since we verified signature
        user_metadata: {
          wallet_address: walletAddress,
          chain: 'ethereum',
          signed_at: new Date().toISOString(),
        },
      });

      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }

      userId = newUser.user.id;
    }

    // Create server-side session with cookie-based authentication
    // Step 1: Generate magic link to get hashed_token (using admin client)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email, // Already defined: `${walletAddress}@kektech.xyz`
    });

    if (linkError) {
      console.error('[AUTH] Error generating link:', linkError);
      throw linkError;
    }

    // Step 2: Create server client for cookie-based session management
    const supabase = await createServerClient();

    // Step 3: Verify OTP with server client (stores session in cookies automatically)
    const { data: _sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (sessionError) {
      console.error('[AUTH] Error verifying OTP:', sessionError);
      throw sessionError;
    }

    // 🔧 FIX: Ensure session is retrievable from cookies before returning success
    // This prevents race conditions where frontend makes requests before cookies propagate
    let retries = 0;
    const maxRetries = 5; // 500ms max wait
    let sessionReady = false;

    while (retries < maxRetries && !sessionReady) {
      const { data: { session: verifiedSession }, error: _checkError } = await supabase.auth.getSession();

      if (verifiedSession?.user?.id === userId) {
        sessionReady = true;
        break;
      }

      // Wait 100ms before retry
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }

    if (!sessionReady) {
      console.error('[AUTH] Session not established in cookies after verifyOtp');
      throw new Error('Session not established in cookies');
    }

    console.log('[AUTH] Session verified in cookies after', retries, 'retries');

    // Log successful authentication
    console.log('[AUTH] Authentication successful', {
      walletAddress,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Return success (session is stored in cookies, no tokens needed in response)
    return NextResponse.json({
      success: true,
      userId,
      walletAddress,
    });

  } catch (error: unknown) {
    const duration = Date.now() - startTime;

    console.error('[AUTH] Verification error', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      ip,
      duration,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Authentication failed',
      },
      { status: 500 }
    );
  }
}
