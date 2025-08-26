#!/usr/bin/env node

/**
 * PostgreSQL RLS Application Script
 * 
 * This script applies the RLS policies directly to the PostgreSQL database
 * using the DATABASE_URL environment variable for authentication.
 */

import { readFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// RLS migration files to apply
const MIGRATION_FILES = [
  'supabase/migrations/20250821_update_profiles_rls.sql',
  'supabase/migrations/20250822_update_access_codes_rls.sql',
  'supabase/migrations/20250823_update_security_tables_rls.sql',
  'supabase/migrations/20250824_update_users_rls.sql',
  'supabase/migrations/20250825_update_api_keys_rls.sql',
  'supabase/migrations/20250826_update_visitor_tables_rls.sql',
  'supabase/migrations/20250827_update_remaining_tables_rls.sql'
];

async function applyRLSMigration() {
  console.log('🔧 Starting PostgreSQL RLS migration process...');
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    console.log('ℹ️  Please set DATABASE_URL to your PostgreSQL connection string:');
    console.log('   export DATABASE_URL=postgresql://user:password@localhost:5432/database');
    console.log('   or update your .env file with the correct connection string');
    return false;
  }

  console.log('✅ Using DATABASE_URL:', dbUrl.substring(0, Math.min(dbUrl.length, 40)) + '...');

  try {
    let successCount = 0;
    
    for (const migrationFile of MIGRATION_FILES) {
      console.log(`\n📋 Applying migration: ${migrationFile}`);
      
      try {
        // Read the SQL file
        const sqlContent = await readFile(migrationFile, 'utf8');
        
        // Execute the SQL using psql
        const { stdout, stderr } = await execAsync(`psql "${dbUrl}" -c "${sqlContent.replace(/"/g, '\\"')}"`);
        
        if (stderr && stderr.trim() && !stderr.includes('NOTICE:')) {
          console.error(`❌ Error applying ${migrationFile}:`, stderr);
        } else {
          console.log(`✅ Successfully applied: ${migrationFile}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to apply ${migrationFile}:`, error.message);
        console.log('ℹ️  Make sure psql is installed and available in your PATH');
        console.log('   You can install PostgreSQL client tools from: https://www.postgresql.org/download/');
      }
    }

    if (successCount === MIGRATION_FILES.length) {
      console.log('\n🎉 All RLS migrations applied successfully!');
      return true;
    } else {
      console.log(`\n⚠️  ${successCount} out of ${MIGRATION_FILES.length} migrations applied successfully.`);
      console.log('   Some migrations may have failed. Check the errors above.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error.message);
    console.log('\nℹ️  Alternative manual approach:');
    console.log('1. Connect to your PostgreSQL database using psql or a GUI tool');
    console.log('2. Run each SQL file manually:');
    MIGRATION_FILES.forEach(file => console.log(`   - ${file}`));
    console.log('3. Verify the RLS policies are applied correctly');
    return false;
  }
}

// Run the migration
applyRLSMigration().then(success => {
  if (success) {
    console.log('\n📋 Next steps:');
    console.log('1. Run the tests: npx vitest tests/integration/role_based_access_control.test.ts --run');
    console.log('2. Verify all tests pass with RLS enforcement');
    console.log('3. Test the application to ensure proper access control');
  } else {
    console.log('\n❌ RLS migration failed. Please apply manually as instructed above.');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
});
