#!/usr/bin/env node

// Script to verify test environment setup
import { createClient } from '@supabase/supabase-js';

console.log('🔍 Verifying test environment setup...\n');

// Check required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('📋 Checking required environment variables:');
let allEnvVarsSet = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  const isSet = !!value;
  const status = isSet ? '✅' : '❌';
  
  console.log(`${status} ${envVar}: ${isSet ? 'Set' : 'Missing'}`);
  
  if (!isSet) {
    allEnvVarsSet = false;
  }
});

console.log('\n');

if (!allEnvVarsSet) {
  console.log('❌ Missing required environment variables.');
  console.log('Please set the following environment variables:');
  console.log('- VITE_SUPABASE_URL: Your Supabase project URL');
  console.log('- VITE_SUPABASE_ANON_KEY: Your Supabase anonymous key');
  console.log('- SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key');
  console.log('\nYou can set these in a .env.local file:');
  console.log('cp .env.example .env.local');
  console.log('# Then edit .env.local with your credentials');
  process.exit(1);
}

console.log('✅ All required environment variables are set.\n');

// Test Supabase connection
console.log('🔗 Testing Supabase connection...');

try {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Simple query to test connection
  const { data, error } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);
  
  if (error) {
    console.log('❌ Supabase connection failed:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    
    if (error.code === 'PGRST301') {
      console.log('\n💡 This may indicate Row Level Security (RLS) is enabled.');
      console.log('   Try using the service role key for admin operations.');
    }
    
    process.exit(1);
  }
  
  console.log('✅ Supabase connection successful!');
  console.log('   Connection to database established.');
  
} catch (error) {
  console.log('❌ Failed to connect to Supabase:');
  console.log(`   Error: ${error.message}`);
  
  if (error.message.includes('fetch')) {
    console.log('\n💡 This may indicate network issues or incorrect URL.');
    console.log('   Verify your VITE_SUPABASE_URL is correct.');
  }
  
  process.exit(1);
}

console.log('\n🎉 Test environment verification completed successfully!');
console.log('You should now be able to run the integration tests.');
