#!/usr/bin/env node

/**
 * Manual RLS Application Script
 * 
 * This script applies the RLS policies directly to the Supabase database
 * using the service role key for authentication.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://fwacwevimpifqvwpxquq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sbp_5db448dd334aace573f0e9a4fd9e08126ab77dab';

// RLS migration SQL
const RLS_MIGRATION_SQL = `
-- Update RLS policies for profiles table

-- First, ensure RLS is enabled on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can view their own profiles." ON profiles;
DROP POLICY IF EXISTS "Guards can view all profiles." ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles." ON profiles;

-- Create a policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create a policy for guards to view all profiles (they need to check role in profiles table)
CREATE POLICY "Guards can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'security_guard'
    )
  );

-- Create a policy for admins to view all profiles (they need to check role in profiles table)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Block all other operations by default
CREATE POLICY "Only admins can modify profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Block unauthenticated access completely
CREATE POLICY "No anonymous access to profiles" ON profiles
  FOR ALL USING (auth.role() = 'authenticated');
`;

async function applyRLSMigration() {
  console.log('🔧 Connecting to Supabase database...');
  
  try {
    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Connected to Supabase');
    console.log('🔧 Applying RLS policies...');

    // Execute the RLS migration SQL
    const { error } = await supabase.rpc('exec_sql', { sql: RLS_MIGRATION_SQL });

    if (error) {
      console.error('❌ Error applying RLS policies:', error.message);
      
      // If the exec_sql function doesn't exist, try direct SQL execution
      console.log('⚠️  Trying alternative approach...');
      
      // For direct SQL execution, we might need to use a different approach
      // since Supabase JavaScript client doesn't support raw SQL execution directly
      console.log('ℹ️  Please apply the RLS migration manually in the Supabase dashboard:');
      console.log('1. Go to https://supabase.com/dashboard/project/fwacwevimpifqvwpxquq/sql');
      console.log('2. Copy and paste the SQL from supabase/migrations/20250821_update_profiles_rls.sql');
      console.log('3. Execute the SQL');
      
      return false;
    }

    console.log('✅ RLS policies applied successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error.message);
    console.log('ℹ️  Please apply the RLS migration manually in the Supabase dashboard:');
    console.log('1. Go to https://supabase.com/dashboard/project/fwacwevimpifqvwpxquq/sql');
    console.log('2. Copy and paste the SQL from supabase/migrations/20250821_update_profiles_rls.sql');
    console.log('3. Execute the SQL');
    return false;
  }
}

// Run the migration
applyRLSMigration().then(success => {
  if (success) {
    console.log('\n🎉 RLS migration completed successfully!');
    console.log('📋 Next steps:');
    console.log('1. Run the tests again: npx vitest tests/integration/role_based_access_control.test.ts --run');
    console.log('2. Verify all tests pass');
  } else {
    console.log('\n❌ RLS migration failed. Please apply manually as instructed above.');
    process.exit(1);
  }
});
