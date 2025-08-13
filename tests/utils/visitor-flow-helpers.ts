/**
 * Phase 2: Visitor Flow Testing Helpers
 * 
 * Utilities for testing visitor registration, invitation management,
 * and access code generation workflows.
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from '../../src/integrations/supabase/types';
import { debugLog } from './supabase-helpers';

// Test visitor data types
export interface TestVisitor {
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  email: string;
  photoUrl?: string;
}

export interface TestInvitation {
  residentId: string;
  visitorFullName: string;
  visitorEmail: string;
  visitorPhone: string;
  visitDate: string;
  visitPurpose: string;
  isMultiUse?: boolean;
  usesRemaining?: number;
}

export interface TestAccessCode {
  visitorId: string;
  residentId: string;
  invitationId: string;
  pin: string;
  qrToken: string;
  expiresAt: string;
}

/**
 * Generate test visitor data
 */
export function generateTestVisitor(suffix: string = ''): TestVisitor {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const uniqueId = `${timestamp}-${random}${suffix}`;
  
  return {
    fullName: `Test Visitor ${uniqueId}`,
    idNumber: `ID${uniqueId.substring(0, 8)}`,
    phoneNumber: `+254700${uniqueId.substring(0, 6)}`,
    email: `visitor-${uniqueId}@example.com`,
    photoUrl: `https://example.com/photos/visitor-${uniqueId}.jpg`
  };
}

/**
 * Generate test invitation data
 */
export function generateTestInvitation(residentId: string, suffix: string = ''): TestInvitation {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const uniqueId = `${timestamp}-${random}${suffix}`;
  
  // Visit date 1 day from now
  const visitDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  return {
    residentId,
    visitorFullName: `Test Visitor ${uniqueId}`,
    visitorEmail: `visitor-${uniqueId}@example.com`,
    visitorPhone: `+254700${uniqueId.substring(0, 6)}`,
    visitDate,
    visitPurpose: 'Business Meeting',
    isMultiUse: false,
    usesRemaining: 1
  };
}

/**
 * Create a test invitation via Edge Function
 */
export async function createTestInvitation(
  client: SupabaseClient<Database>,
  invitationData: TestInvitation
): Promise<any> {
  debugLog(`[Visitor-Helper] 📧 Creating invitation for: ${invitationData.visitorEmail}`);
  
  const { data, error } = await client.functions.invoke('create-invitation', {
    body: {
      residentId: invitationData.residentId,
      visitorFullName: invitationData.visitorFullName,
      visitorEmail: invitationData.visitorEmail,
      visitorPhone: invitationData.visitorPhone,
      visitPurpose: "Business Meeting", // Default purpose
      visitDate: invitationData.visitDate,
      visitDurationHours: 2 // Default duration
    }
  });
  
  if (error) {
    debugLog(`[Visitor-Helper] ❌ Invitation creation failed: ${JSON.stringify(error, null, 2)}`);
    // Log the full error response for debugging
    debugLog(`[Visitor-Helper] ❌ Full error details:`, { error, data });
    throw new Error(`Invitation creation failed: ${error.message || 'Edge Function returned a non-2xx status code'}`);
  }
  
  debugLog(`[Visitor-Helper] ✅ Invitation created: ${data.invitation.id}`);
  return data.invitation;
}

/**
 * Register a visitor for an invitation via Edge Function
 */
export async function registerTestVisitor(
  client: SupabaseClient<Database>,
  visitorData: TestVisitor,
  invitationToken: string
): Promise<any> {
  debugLog(`[Visitor-Helper] 👤 Registering visitor: ${visitorData.fullName}`);
  
  const response = await client.functions.invoke('complete-visitor-registration', {
    body: {
      fullName: visitorData.fullName,
      idNumber: visitorData.idNumber,
      phoneNumber: visitorData.phoneNumber,
      visitorEmail: visitorData.email,
      consent: true,
      photoUrl: visitorData.photoUrl,
      invitationToken
    }
  });
  
  const { data, error } = response;
  
  if (error) {
    debugLog(`[Visitor-Helper] ❌ Visitor registration failed:`);
    debugLog(`  Error: ${JSON.stringify(error, null, 2)}`);
    debugLog(`  Data: ${JSON.stringify(data, null, 2)}`);
    debugLog(`  Response details: ${JSON.stringify({
      status: (error as any)?.status,
      statusText: (error as any)?.statusText,
      message: error.message,
      context: (error as any)?.context
    }, null, 2)}`);
    throw new Error(`Visitor registration failed: ${error.message || 'Unknown error'}`);
  }
  
  debugLog(`[Visitor-Helper] ✅ Visitor registered: ${data.visitor.id}`);
  return data;
}

/**
 * Generate access code for a visitor via Edge Function
 */
export async function generateTestAccessCode(
  client: SupabaseClient<Database>,
  visitorId: string,
  residentId: string,
  communityId: string
): Promise<any> {
  debugLog(`[Visitor-Helper] 🔑 Generating access code for visitor: ${visitorId}`);
  
  const { data, error } = await client.functions.invoke('generate-access-code', {
    body: {
      visitor_id: visitorId,
      resident_id: residentId,
      visitor_email: 'test@example.com', // Will be overridden by function
      community_id: communityId
    }
  });
  
  if (error) {
    debugLog(`[Visitor-Helper] ❌ Access code generation failed: ${JSON.stringify(error, null, 2)}`);
    throw new Error(`Access code generation failed: ${error.message}`);
  }
  
  debugLog(`[Visitor-Helper] ✅ Access code generated: ${data.access_code.id}`);
  return data.access_code;
}

/**
 * Verify access code via Edge Function
 */
export async function verifyTestAccessCode(
  client: SupabaseClient<Database>,
  pin: string,
  qrToken?: string
): Promise<any> {
  debugLog(`[Visitor-Helper] 🔍 Verifying access code with PIN: ${pin}`);
  
  const { data, error } = await client.functions.invoke('verify-access-code', {
    body: {
      pin,
      qr_token: qrToken
    }
  });
  
  if (error) {
    debugLog(`[Visitor-Helper] ❌ Access code verification failed: ${JSON.stringify(error, null, 2)}`);
    throw new Error(`Access code verification failed: ${error.message}`);
  }
  
  debugLog(`[Visitor-Helper] ✅ Access code verified successfully`);
  return data;
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(
  client: SupabaseClient<Database>,
  token: string
): Promise<any> {
  const { data, error } = await client
    .from('visit_invitations')
    .select('*')
    .eq('invitation_token', token)
    .single();
    
  if (error) {
    throw new Error(`Failed to get invitation: ${error.message}`);
  }
  
  return data;
}

/**
 * Get visitor by ID
 */
export async function getVisitorById(
  client: SupabaseClient<Database>,
  visitorId: string
): Promise<any> {
  const { data, error } = await client
    .from('visitors')
    .select('*')
    .eq('id', visitorId)
    .single();
    
  if (error) {
    throw new Error(`Failed to get visitor: ${error.message}`);
  }
  
  return data;
}

/**
 * Get access codes for a visitor
 */
export async function getAccessCodesForVisitor(
  client: SupabaseClient<Database>,
  visitorId: string
): Promise<any[]> {
  const { data, error } = await client
    .from('access_codes')
    .select('*')
    .eq('visitor_id', visitorId);
    
  if (error) {
    throw new Error(`Failed to get access codes: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Clean up test visitor data
 */
export async function cleanupVisitorTestData(
  adminClient: SupabaseClient<Database>,
  testIds: {
    invitationIds?: string[];
    visitorIds?: string[];
    accessCodeIds?: string[];
  }
): Promise<void> {
  debugLog('[Visitor-Helper] 🧹 Cleaning up visitor test data...');
  
  try {
    // Clean up access codes
    if (testIds.accessCodeIds && testIds.accessCodeIds.length > 0) {
      await adminClient.from('access_codes').delete().in('id', testIds.accessCodeIds);
    }
    
    // Clean up visitors
    if (testIds.visitorIds && testIds.visitorIds.length > 0) {
      await adminClient.from('visitors').delete().in('id', testIds.visitorIds);
    }
    
    // Clean up invitations
    if (testIds.invitationIds && testIds.invitationIds.length > 0) {
      await adminClient.from('visit_invitations').delete().in('id', testIds.invitationIds);
    }
    
    debugLog('[Visitor-Helper] ✅ Visitor test data cleanup completed');
  } catch (error) {
    debugLog(`[Visitor-Helper] ⚠️ Cleanup error (non-fatal): ${error}`);
  }
}

/**
 * Validate encrypted PII data is properly stored
 */
export async function validateEncryptedData(
  adminClient: SupabaseClient<Database>,
  visitorId: string,
  originalData: TestVisitor
): Promise<boolean> {
  debugLog(`[Visitor-Helper] 🔒 Validating encrypted data for visitor: ${visitorId}`);
  
  const visitor = await getVisitorById(adminClient, visitorId);
  
  // Check that encrypted fields exist and are not plain text
  const validations = [
    {
      field: 'full_name_encrypted',
      original: originalData.fullName,
      encrypted: visitor.full_name_encrypted
    },
    {
      field: 'phone_encrypted', 
      original: originalData.phoneNumber,
      encrypted: visitor.phone_encrypted
    },
    {
      field: 'email_encrypted',
      original: originalData.email,
      encrypted: visitor.email_encrypted
    }
  ];
  
  for (const validation of validations) {
    if (!validation.encrypted) {
      debugLog(`[Visitor-Helper] ❌ Missing encrypted field: ${validation.field}`);
      return false;
    }
    
    // Encrypted data should be different from original (basic check)
    if (validation.encrypted === validation.original) {
      debugLog(`[Visitor-Helper] ❌ Field appears unencrypted: ${validation.field}`);
      return false;
    }
  }
  
  debugLog(`[Visitor-Helper] ✅ All PII fields properly encrypted`);
  return true;
}

/**
 * Test complete visitor flow end-to-end
 */
export async function testCompleteVisitorFlow(
  residentClient: SupabaseClient<Database>,
  adminClient: SupabaseClient<Database>,
  residentId: string,
  communityId: string
): Promise<{
  invitation: any;
  visitor: any;
  accessCode: any;
}> {
  debugLog('[Visitor-Helper] 🔄 Testing complete visitor flow...');
  
  // 1. Create invitation
  const invitationData = generateTestInvitation(residentId);
  const invitation = await createTestInvitation(residentClient, invitationData);
  
  // 2. Register visitor
  const visitorData = generateTestVisitor();
  const registration = await registerTestVisitor(
    adminClient, // Use admin client for registration (simulates external visitor)
    visitorData,
    invitation.invitation_token
  );
  
  // 3. Generate access code  
  const accessCode = await generateTestAccessCode(
    adminClient,
    registration.visitor.id,
    residentId,
    communityId
  );
  
  debugLog('[Visitor-Helper] ✅ Complete visitor flow test successful');
  
  return {
    invitation,
    visitor: registration.visitor,
    accessCode
  };
}
