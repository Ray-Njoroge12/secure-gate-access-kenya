import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from both .env.local and .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('URL exists:', !!supabaseUrl);
console.log('Anon key exists:', !!supabaseAnonKey);
console.log('Service role key exists:', !!supabaseServiceRoleKey);

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testSimpleEdgeFunction() {
  console.log('🧪 Testing a simple Edge Function call...');
  
  try {
    // First, test create-invitation (which works)
    console.log('📧 Testing create-invitation (known working)...');
    
    const { data: invitation, error: inviteError } = await supabaseAdmin.functions.invoke('create-invitation', {
      body: {
        residentId: '00000000-0000-0000-0000-000000000000',
        visitorFullName: 'Test Visitor',
        visitorEmail: 'simple-test@example.com',
        visitorPhone: '+1234567890',
        visitPurpose: 'Simple diagnostic test',
        visitDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        visitDurationHours: 2
      }
    });
    
    if (inviteError) {
      console.error('❌ create-invitation failed:', inviteError);
    } else {
      console.log('✅ create-invitation succeeded:', invitation);
      
      // Now test complete-visitor-registration with minimal data
      console.log('👤 Testing complete-visitor-registration...');
      
      const { data: registrationResult, error: registrationError } = await supabaseClient.functions.invoke('complete-visitor-registration', {
        body: {
          fullName: 'Test User',
          idNumber: '123456789',
          phoneNumber: '+1234567890',
          visitorEmail: 'simple-test@example.com',
          consent: true,
          photoUrl: 'https://example.com/photo.jpg',
          invitationToken: invitation.invitationToken
        }
      });
      
      if (registrationError) {
        console.error('❌ complete-visitor-registration failed:', registrationError);
        console.error('Full error details:', JSON.stringify(registrationError, null, 2));
        
        // Check environment variables that the function might need
        console.log('\n🔍 Checking required environment variables...');
        console.log('APP_ENCRYPTION_KEY exists:', !!process.env.APP_ENCRYPTION_KEY);
        console.log('RS256_PRIVATE_KEY exists:', !!process.env.RS256_PRIVATE_KEY);
        console.log('SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
        console.log('FROM_EMAIL exists:', !!process.env.FROM_EMAIL);
        
      } else {
        console.log('✅ complete-visitor-registration succeeded:', registrationResult);
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

testSimpleEdgeFunction();
