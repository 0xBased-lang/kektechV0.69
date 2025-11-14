/**
 * Delete E2E Test Users from Supabase
 * Uses service role to remove all wallet-*@kektech.xyz test users
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment from .env.test
require('dotenv').config({ path: '../frontend/.env.test' });

async function deleteTestUsers() {
  console.log('🧹 Deleting E2E Test Users from Supabase\n');

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase configuration');
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  // Create admin client with service role
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // 1. List all users
    console.log('📋 Fetching all users...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    console.log(`   Found ${users.length} total users\n`);

    // 2. Filter for test users
    const testUsers = users.filter(user =>
      user.email && user.email.includes('wallet-') && user.email.includes('@kektech.xyz')
    );

    if (testUsers.length === 0) {
      console.log('✅ No test users found - database is clean!\n');
      return;
    }

    console.log(`🎯 Found ${testUsers.length} test users to delete:\n`);
    testUsers.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email} (${user.id})`);
    });
    console.log('');

    // 3. Delete each test user
    let deleted = 0;
    let failed = 0;

    for (const user of testUsers) {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

        if (deleteError) {
          console.error(`   ❌ Failed to delete ${user.email}: ${deleteError.message}`);
          failed++;
        } else {
          console.log(`   ✅ Deleted ${user.email}`);
          deleted++;
        }
      } catch (err) {
        console.error(`   ❌ Error deleting ${user.email}:`, err.message);
        failed++;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Successfully deleted: ${deleted} users`);
    if (failed > 0) {
      console.log(`❌ Failed to delete: ${failed} users`);
    }
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
deleteTestUsers()
  .then(() => {
    console.log('🎉 Test user cleanup complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
