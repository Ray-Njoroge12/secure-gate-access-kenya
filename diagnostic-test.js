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

async function diagnosticTest() {
  console.log('🔍 Diagnostic Test for complete-visitor-registration');
  console.log('Environment check:');
  console.log('- URL exists:', !!supabaseUrl);
  console.log('- Service role key exists:', !!supabaseServiceRoleKey);
  
  try {
    // First create an invitation to test with
    console.log('\n📧 Step 1: Creating test invitation...');
    
    // Create a test resident first (need valid resident ID)
    const { data: communities } = await supabaseAdmin
      .from('communities')
      .select('id')
      .limit(1);
    
    if (!communities || communities.length === 0) {
      throw new Error('No test community found');
    }
    
    const communityId = communities[0].id;
    console.log('Using community:', communityId);
    
    // Create a test user and resident
    const testEmail = `diagnostic-${Date.now()}@test.com`;
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      email_confirm: true
    });
    
    if (authError) {
      throw new Error(`Failed to create test user: ${authError.message}`);
    }
    
    console.log('Created test user:', authUser.user.id);
    
    // Create profile and resident
    await supabaseAdmin.from('profiles').insert({
      id: authUser.user.id,
      full_name: 'Test Resident',
      role: 'resident'
    });
    
    await supabaseAdmin.from('residents').insert({
      id: authUser.user.id,
      community_id: communityId,
      unit_number: 'A101',
      move_in_date: new Date().toISOString().split('T')[0]
    });
    
    console.log('Created resident profile');
    
    // Now create invitation using authenticated client
    const supabaseResident = createClient(supabaseUrl, supabaseServiceRoleKey);
    // Simulate authenticated user
    await supabaseResident.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail
    });
    
    const { data: invitation, error: inviteError } = await supabaseResident.functions.invoke('create-invitation', {
      body: {
        residentId: authUser.user.id,
        visitorFullName: 'Diagnostic Test Visitor',
        visitorEmail: 'diagnostic-visitor@test.com',
        visitorPhone: '+1234567890',
        visitPurpose: 'Diagnostic Test',
        visitDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        visitDurationHours: 2
      }
    });
    
    if (inviteError) {
      console.error('❌ Failed to create invitation:', inviteError);
      throw inviteError;
    }
    
    console.log('✅ Invitation created successfully');
    console.log('Invitation token:', invitation.invitation_token);
    
    // Now test visitor registration
    console.log('\n👤 Step 2: Testing visitor registration...');
    
    const registrationData = {
      fullName: 'Diagnostic Test Visitor',
      idNumber: 'DIAG123456',
      phoneNumber: '+1234567890',
      visitorEmail: 'diagnostic-visitor@test.com',
      consent: true,
      photoUrl: 'https://example.com/photo.jpg',
      invitationToken: invitation.invitation_token
    };
    
    console.log('Registration data:', registrationData);
    
    // Call the function directly with detailed error handling
    const response = await fetch(`${supabaseUrl}/functions/v1/complete-visitor-registration`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey
      },
      body: JSON.stringify(registrationData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (!response.ok) {
      console.error('❌ Function call failed');
      try {
        const errorData = JSON.parse(responseText);
        console.error('Error details:', errorData);
      } catch {
        console.error('Raw error response:', responseText);
      }
    } else {
      console.log('✅ Registration successful!');
      try {
        const successData = JSON.parse(responseText);
        console.log('Success data:', successData);
      } catch {
        console.log('Raw success response:', responseText);
      }
    }
    
    // Cleanup
    console.log('\n🧹 Cleanup...');
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    
  } catch (error) {
    console.error('💥 Diagnostic test failed:', error);
  }
}

diagnosticTest();
