/**
 * Global Setup for Playwright Tests
 * Loads environment variables from .env.test for all test workers
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

async function globalSetup() {
  console.log('🔧 Loading .env.test configuration...');

  const envPath = path.resolve(__dirname, '../../.env.test');

  if (!fs.existsSync(envPath)) {
    throw new Error(`.env.test not found at: ${envPath}`);
  }

  // Load .env.test
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    throw new Error(`Failed to load .env.test: ${result.error.message}`);
  }

  console.log(`✅ Loaded ${Object.keys(result.parsed || {}).length} environment variables`);

  // Verify critical variables
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'TEST_WALLET_PRIVATE_KEY',
    'ADMIN_WALLET_PRIVATE_KEY',
    'TEST_MARKET_ADDRESS'
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ All required environment variables present');

  // Check optional variables
  const optional = ['SUPABASE_SERVICE_KEY'];
  const missingOptional = optional.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.log(`⚠️  Optional variables not set: ${missingOptional.join(', ')}`);
    console.log('   Tests may require manual email confirmation');
  } else {
    console.log('✅ Optional service key present - auto-confirmation enabled');
  }
  console.log('');

  return result.parsed;
}

export default globalSetup;
