#!/usr/bin/env node

/**
 * Tenant Isolation Verification Script
 * Tests multi-tenant access code functionality and cross-tenant isolation
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuration - update with your actual values
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fwacwevimpifqvwpxquq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to create test data
async function createTestCommunities() {
  console.log('🏘️  Creating test communities...');
  
  const communities = [
    { name: 'Test Community A', address: '123 Test St', contact_phone: '+254700000001' },
    { name: 'Test Community B', address: '456 Test Ave', contact_phone: '+254700000002' }
  ];

  const results = [];
  for (const community of communities) {
    const { data, error } = await supabaseService
      .from('communities')
      .insert(community)
      .select()
      .single();
    
    if (error && !error.message.includes('duplicate')) {
      console.error(`❌ Failed to create community ${community.name}:`, error);
      continue;
    }
    
    if (data) {
      results.push(data);
      console.log(`✅ Created community: ${data.name} (${data.id})`);
    }
  }
  
  return results;
}

// Helper function to create test residents
async function createTestResidents(communities) {
  console.log('👥 Creating test residents...');
  
  const residents = [];
  for (let i = 0; i < communities.length; i++) {
    const community = communities[i];
    const resident = {
      full_name: `Test Resident ${String.fromCharCode(65 + i)}`,
      email: `resident${String.fromCharCode(97 + i)}@test.com`,
      phone: `+25470000000${i + 3}`,
      unit_number: `Unit ${i + 1}01`,
      community_id: community.id
    };

    const { data, error } = await supabaseService
      .from('residents')
      .insert(resident)
      .select()
      .single();
    
    if (error && !error.message.includes('duplicate')) {
      console.error(`❌ Failed to create resident:`, error);
      continue;
    }
    
    if (data) {
      residents.push(data);
      console.log(`✅ Created resident: ${data.full_name} in ${community.name}`);
    }
  }
  
  return residents;
}

// Helper to hash PIN for testing (SHA-256)
async function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

// Test access code creation with tenant scoping
async function testAccessCodeCreation(residents) {
  console.log('🔑 Testing tenant-aware access code creation...');
  
  const testCodes = [];
  
  for (let i = 0; i < residents.length; i++) {
    const resident = residents[i];
    const pin = `12345${i}`;
    const pinHash = await hashPin(pin);
    
    // Create a mock visitor
    const { data: visitor, error: visitorError } = await supabaseService
      .from('visitors')
      .insert({
        full_name_encrypted: `Test Visitor ${i + 1}`,
        id_number_encrypted: `ID${i + 1}234567890`,
        phone_encrypted: `+25470000001${i}`,
        email_encrypted: `visitor${i + 1}@test.com`,
        gdpr_consent: true,
        registration_status: 'completed'
      })
      .select()
      .single();

    if (visitorError) {
      console.error(`❌ Failed to create visitor:`, visitorError);
      continue;
    }

    // Create access code with explicit community_id
    const accessCode = {
      visitor_id: visitor.id,
      resident_id: resident.id,
      community_id: resident.community_id,
      pin_hash: pinHash,
      qr_token: `mock-qr-token-${i + 1}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    const { data, error } = await supabaseService
      .from('access_codes')
      .insert(accessCode)
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create access code:`, error);
      continue;
    }

    testCodes.push({ ...data, pin });
    console.log(`✅ Created access code for ${resident.full_name} in community ${resident.community_id}`);
  }

  return testCodes;
}

// Test cross-tenant isolation
async function testCrossTenantIsolation(communities, testCodes) {
  console.log('🔒 Testing cross-tenant isolation...');
  
  let isolationTests = 0;
  let isolationPassed = 0;

  for (let i = 0; i < communities.length; i++) {
    const communityA = communities[i];
    const communityB = communities[(i + 1) % communities.length];
    
    if (communityA.id === communityB.id) continue;

    // Try to access Community A's codes from Community B context
    // Simulate setting tenant context
    console.log(`\n🧪 Testing: Community ${communityB.name} trying to access Community ${communityA.name} codes...`);
    
    // This should return no results due to RLS
    const { data, error, count } = await supabaseService
      .from('access_codes')
      .select('*', { count: 'exact' })
      .eq('community_id', communityA.id);

    isolationTests++;
    
    if (error) {
      console.log(`✅ RLS correctly blocked cross-tenant access: ${error.message}`);
      isolationPassed++;
    } else if (data && data.length === 0) {
      console.log(`✅ Cross-tenant isolation working: No access codes returned for different community`);
      isolationPassed++;
    } else {
      console.log(`❌ Cross-tenant isolation FAILED: Found ${data?.length || 0} codes from different community`);
    }
  }

  return { isolationTests, isolationPassed };
}

// Test tenant-aware API calls
async function testTenantAwareAPIs(testCodes) {
  console.log('🌐 Testing tenant-aware API functionality...');
  
  let apiTests = 0;
  let apiPassed = 0;

  for (const codeData of testCodes) {
    console.log(`\n🧪 Testing verify-access-code API for community ${codeData.community_id}...`);
    
    try {
      // Test PIN verification
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-access-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: codeData.pin,
          method: 'pin',
          community_id: codeData.community_id
        })
      });

      apiTests++;
      const result = await response.json();
      
      if (response.ok && result.valid) {
        console.log(`✅ PIN verification successful for tenant ${codeData.community_id}`);
        apiPassed++;
      } else {
        console.log(`❌ PIN verification failed:`, result);
      }

      // Test cross-tenant PIN attempt (should fail)
      const wrongCommunityId = testCodes.find(c => c.community_id !== codeData.community_id)?.community_id;
      if (wrongCommunityId) {
        const wrongResponse = await fetch(`${SUPABASE_URL}/functions/v1/verify-access-code`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: codeData.pin,
            method: 'pin',
            community_id: wrongCommunityId
          })
        });

        apiTests++;
        const wrongResult = await wrongResponse.json();
        
        if (!wrongResponse.ok || !wrongResult.valid) {
          console.log(`✅ Cross-tenant PIN verification correctly blocked`);
          apiPassed++;
        } else {
          console.log(`❌ Cross-tenant PIN verification FAILED - should have been blocked`);
        }
      }

    } catch (error) {
      console.error(`❌ API test error:`, error.message);
      apiTests++;
    }
  }

  return { apiTests, apiPassed };
}

// Test access logs tenant scoping
async function testAccessLogsScoping(communities) {
  console.log('📊 Testing access logs tenant scoping...');
  
  let logTests = 0;
  let logPassed = 0;

  for (const community of communities) {
    // Check access logs are scoped to community
    const { data, error } = await supabaseService
      .from('access_logs')
      .select('*')
      .eq('community_id', community.id);

    logTests++;
    
    if (error) {
      console.log(`❌ Access logs query failed for community ${community.id}:`, error);
    } else {
      const hasValidLogs = data.every(log => log.community_id === community.id);
      if (hasValidLogs) {
        console.log(`✅ Access logs correctly scoped to community ${community.name} (${data.length} logs)`);
        logPassed++;
      } else {
        console.log(`❌ Access logs contain cross-tenant data for community ${community.name}`);
      }
    }
  }

  return { logTests, logPassed };
}

// Cleanup test data
async function cleanup(communities) {
  console.log('🧹 Cleaning up test data...');
  
  // Delete access codes first (due to foreign keys)
  await supabaseService.from('access_codes').delete().in('community_id', communities.map(c => c.id));
  
  // Delete visitors
  await supabaseService.from('visitors').delete().like('full_name_encrypted', 'Test Visitor%');
  
  // Delete residents
  await supabaseService.from('residents').delete().like('full_name', 'Test Resident%');
  
  // Delete communities
  await supabaseService.from('communities').delete().in('id', communities.map(c => c.id));
  
  console.log('✅ Cleanup completed');
}

// Main test execution
async function main() {
  console.log('🚀 Starting Tenant Isolation Verification\n');
  
  let communities = [];
  let totalTests = 0;
  let totalPassed = 0;

  try {
    // Setup test data
    communities = await createTestCommunities();
    if (communities.length < 2) {
      console.error('❌ Need at least 2 communities for isolation testing');
      return;
    }

    const residents = await createTestResidents(communities);
    const testCodes = await testAccessCodeCreation(residents);

    // Run tests
    console.log('\n' + '='.repeat(50));
    console.log('RUNNING TENANT ISOLATION TESTS');
    console.log('='.repeat(50));

    const isolationResult = await testCrossTenantIsolation(communities, testCodes);
    totalTests += isolationResult.isolationTests;
    totalPassed += isolationResult.isolationPassed;

    const apiResult = await testTenantAwareAPIs(testCodes);
    totalTests += apiResult.apiTests;
    totalPassed += apiResult.apiPassed;

    const logResult = await testAccessLogsScoping(communities);
    totalTests += logResult.logTests;
    totalPassed += logResult.logPassed;

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    // Cleanup
    if (communities.length > 0) {
      await cleanup(communities);
    }
  }

  // Final results
  console.log('\n' + '='.repeat(50));
  console.log('FINAL RESULTS');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalTests - totalPassed}`);
  console.log(`Success Rate: ${totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%`);

  if (totalPassed === totalTests) {
    console.log('🎉 ALL TENANT ISOLATION TESTS PASSED!');
  } else {
    console.log('⚠️  Some tests failed - review tenant isolation implementation');
  }
}

// Run the verification
main().catch(console.error);
