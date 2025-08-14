// Simple test for encrypt-pii function
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fwacwevimpifqvwpxquq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3YWN3ZXZpbXBpZnF2d3B4cXVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDMzMjc1NiwiZXhwIjoyMDQ5OTA4NzU2fQ.VKVPm3rB2XKjdJEE_Fq6FIjKOQmtdaXZEJCvZn8kHV0'
);

async function testEncrypt() {
  console.log('Testing encrypt-pii function...');
  
  const testData = {
    fullName: "Test User",
    idNumber: "12345678",
    phoneNumber: "0700000000", 
    visitorEmail: "test@example.com"
  };
  
  console.log('Sending data:', testData);
  
  try {
    const { data, error } = await supabase.functions.invoke('encrypt-pii', {
      body: testData
    });
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testEncrypt();
