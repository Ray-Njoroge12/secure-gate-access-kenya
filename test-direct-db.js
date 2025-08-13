import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from both .env.local and .env
dotenv.config({ path: '.env.local' });
dotenv.config();

// Initialize Supabase clients
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Simple "encryption" (just base64 encoding for testing - NOT secure for production)
function simpleEncrypt(data) {
  return btoa(data);
}

// Simple SHA-256 hash function
async function hashSha256(data) {
  const textEncoder = new TextEncoder();
  const dataBuffer = textEncoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hexHash;
}

async function testDirectDatabaseApproach() {
  console.log('🔄 Testing direct database approach (bypassing Edge Functions)');
  
  try {
    // Step 1: Create a test invitation directly in database
    console.log('\n📧 Step 1: Creating invitation directly in database...');
    
    // Get test community and create resident
    const { data: communities } = await supabaseAdmin
      .from('communities')
      .select('id')
      .limit(1);
    
    if (!communities || communities.length === 0) {
      throw new Error('No test community found');
    }
    
    const communityId = communities[0].id;
    
    // Create test user and resident
    const testEmail = `direct-test-${Date.now()}@test.com`;
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      email_confirm: true
    });
    
    if (authError) {
      throw new Error(`Failed to create test user: ${authError.message}`);
    }
    
    console.log('Created test user:', authUser.user.id);
    
    // Create profiles
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authUser.user.id,
      email: testEmail,
      role: 'resident'
    });
    
    if (profileError) {
      console.error('Profile creation failed:', profileError);
      throw profileError;
    }
    
    const { error: residentError } = await supabaseAdmin.from('residents').insert({
      id: authUser.user.id,
      community_id: communityId,
      email: testEmail,
      phone_encrypted: simpleEncrypt('+254700000001'),
      unit_number: 'DIRECT101'
    });
    
    if (residentError) {
      console.error('Resident creation failed:', residentError);
      throw residentError;
    }
    
    console.log('✅ Profile and resident created successfully');
    
    // Create invitation directly
    const invitationToken = `test_token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('visit_invitations')
      .insert({
        resident_id: authUser.user.id,
        visitor_full_name: 'Direct Test Visitor',
        visitor_email: 'direct-visitor@test.com',
        visitor_phone: '+1234567890',
        visit_purpose: 'Direct Database Test',
        visit_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        visit_duration_hours: 2,
        invitation_token: invitationToken,
        token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        status: 'pending'
      })
      .select()
      .single();
    
    if (inviteError) {
      console.error('Failed to create invitation:', inviteError);
      throw inviteError;
    }
    
    console.log('✅ Invitation created directly:', invitation.id);
    
    // Step 2: Register visitor directly in database
    console.log('\n👤 Step 2: Registering visitor directly in database...');
    
    const visitorData = {
      fullName: 'Direct Test Visitor',
      idNumber: 'DIRECT123456',
      phoneNumber: '+1234567890',
      visitorEmail: 'direct-visitor@test.com',
      consent: true,
      photoUrl: 'https://example.com/photo.jpg'
    };
    
    // Simulate the complete-visitor-registration logic directly
    // 1. Encrypt/hash the data
    const encryptedFullName = visitorData.fullName ? simpleEncrypt(visitorData.fullName) : undefined;
    const encryptedIdNumber = visitorData.idNumber ? simpleEncrypt(visitorData.idNumber) : undefined;
    const idNumberHash = visitorData.idNumber ? await hashSha256(visitorData.idNumber) : undefined;
    const encryptedPhoneNumber = visitorData.phoneNumber ? simpleEncrypt(visitorData.phoneNumber) : undefined;
    const encryptedVisitorEmail = visitorData.visitorEmail ? simpleEncrypt(visitorData.visitorEmail) : undefined;
    
    console.log('Data encrypted/hashed successfully');
    
    // 2. Create visitor
    const { data: visitor, error: visitorError } = await supabaseAdmin
      .from('visitors')
      .insert({
        full_name_encrypted: encryptedFullName,
        id_number_encrypted: encryptedIdNumber,
        id_number_hash: idNumberHash,
        phone_encrypted: encryptedPhoneNumber,
        email_encrypted: encryptedVisitorEmail,
        photo_url: visitorData.photoUrl,
        gdpr_consent: visitorData.consent
      })
      .select()
      .single();

    if (visitorError) {
      console.error('Visitor creation failed:', visitorError);
      throw visitorError;
    }

    console.log('✅ Visitor created:', visitor.id);

    // 3. Update the invitation
    const { error: updateError } = await supabaseAdmin
      .from('visit_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Invitation update failed:', updateError);
      throw updateError;
    }

    console.log('✅ Invitation updated successfully');

    // 4. Create access code
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const pin_hash = await hashSha256(pin);
    
    const { data: access_code, error: accessCodeError } = await supabaseAdmin
      .from('access_codes')
      .insert({
        visitor_id: visitor.id,
        resident_id: invitation.resident_id,
        invitation_id: invitation.id,
        pin_hash,
        qr_token: `direct_token_${visitor.id}_${Date.now()}`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (accessCodeError) {
      console.error('Access code creation failed:', accessCodeError);
      throw accessCodeError;
    }

    console.log('✅ Access code created:', access_code.id);
    console.log('📍 Generated PIN:', pin);
    
    console.log('\n🎉 SUCCESS! Complete visitor flow working via direct database operations');
    console.log('Summary:');
    console.log('- Invitation ID:', invitation.id);
    console.log('- Visitor ID:', visitor.id);
    console.log('- Access Code ID:', access_code.id);
    console.log('- PIN:', pin);
    
    // Cleanup
    console.log('\n🧹 Cleanup...');
    await supabaseAdmin.from('access_codes').delete().eq('id', access_code.id);
    await supabaseAdmin.from('visitors').delete().eq('id', visitor.id);
    await supabaseAdmin.from('visit_invitations').delete().eq('id', invitation.id);
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('💥 Direct database test failed:', error);
  }
}

testDirectDatabaseApproach();
