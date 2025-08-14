import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('URL exists:', !!supabaseUrl);
console.log('Anon key exists:', !!supabaseAnonKey);
console.log('Service role key exists:', !!supabaseServiceRoleKey);

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testCompleteVisitorRegistration() {
  console.log('🧪 Testing complete-visitor-registration Edge Function...');
  
  try {
    // First, create an invitation to test with
    console.log('📧 Creating test invitation...');
    
    const { data: invitation, error: inviteError } = await supabaseAdmin.functions.invoke('create-invitation', {
      body: {
        visitorEmail: 'test-visitor@example.com',
        expectedArrival: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        purpose: 'Testing visitor registration',
        residentId: '00000000-0000-0000-0000-000000000000' // Placeholder
      }
    });
    
    if (inviteError) {
      console.error('❌ Failed to create invitation:', inviteError);
      return;
    }
    
    console.log('✅ Invitation created:', invitation);
    
    // Now test the visitor registration
    console.log('👤 Testing visitor registration...');
    
    const visitorData = {
      fullName: 'Test Visitor',
      idNumber: '12345678',
      phoneNumber: '+1234567890',
      visitorEmail: 'test-visitor@example.com',
      consent: true,
      photoUrl: 'https://example.com/photo.jpg',
      invitationToken: invitation.invitationToken
    };
    
    const { data: registrationResult, error: registrationError } = await supabaseClient.functions.invoke('complete-visitor-registration', {
      body: visitorData
    });
    
    if (registrationError) {
      console.error('❌ Visitor registration failed:', registrationError);
      console.error('Full error:', JSON.stringify(registrationError, null, 2));
    } else {
      console.log('✅ Visitor registration successful:', registrationResult);
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

testCompleteVisitorRegistration();
