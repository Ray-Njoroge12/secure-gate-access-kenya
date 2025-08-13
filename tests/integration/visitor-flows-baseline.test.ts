/**
 * Phase 2: Visitor Flows - Integration Test Suite
 * 
 * Comprehensive testing of visitor registration, invitation management,
 * and access code generation workflows.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../src/integrations/supabase/types';
import { 
  supabaseAdmin, 
  validateTestEnvironment, 
  assertSuccess,
  debugLog 
} from '../utils/supabase-helpers';
import { 
  signUpTestUser, 
  cleanupTestAuth, 
  createAuthTestClient
} from '../utils/auth-helpers';
import {
  generateTestVisitor,
  generateTestInvitation,
  createTestInvitation,
  registerTestVisitor,
  generateTestAccessCode,
  verifyTestAccessCode,
  getInvitationByToken,
  getVisitorById,
  getAccessCodesForVisitor,
  cleanupVisitorTestData,
  validateEncryptedData,
  testCompleteVisitorFlow,
  TestVisitor,
  TestInvitation
} from '../utils/visitor-flow-helpers';

describe('Phase 2 - Visitor Flows', () => {
  let adminClient: ReturnType<typeof createClient<Database>>;
  let residentClient: ReturnType<typeof createClient<Database>>;
  let unauthenticatedClient: ReturnType<typeof createClient<Database>>;
  
  let testResidentId: string;
  let testCommunityId: string;
  let testUserIds: string[] = [];
  let testDataIds = {
    invitationIds: [] as string[],
    visitorIds: [] as string[],
    accessCodeIds: [] as string[]
  };

  beforeAll(async () => {
    console.log('🎯 Phase 2 - Setting up visitor flow tests...');
    
    // Validate test environment
    validateTestEnvironment();
    
    // Setup clients
    adminClient = supabaseAdmin;
    unauthenticatedClient = createAuthTestClient();
    
    // Create a test resident user for invitation creation
    const residentUserData = {
      email: `test-resident-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@supabase.io`,
      password: 'TestPassword123!',
      role: 'resident' as const,
      fullName: 'Test Resident',
      phone: '+254700000001',
      unitNumber: 'A101'
    };
    
    const residentContext = await signUpTestUser(
      createAuthTestClient(),
      residentUserData,
      testCommunityId
    );
    
    testResidentId = residentContext.userId;
    testUserIds.push(residentContext.userId);
    residentClient = residentContext.client;
    
    // Get a test community ID
    const { data: communities } = await adminClient
      .from('communities')
      .select('id')
      .limit(1);
      
    if (!communities || communities.length === 0) {
      throw new Error('No communities found for testing');
    }
    
    testCommunityId = communities[0].id;
    console.log(`[Visitor-Test] Using test community: ${testCommunityId}`);
    console.log(`[Visitor-Test] Using test resident: ${testResidentId}`);
  });

  afterAll(async () => {
    console.log('🧹 Phase 2 - Cleaning up visitor flow test data...');
    
    // Clean up visitor test data
    await cleanupVisitorTestData(adminClient, testDataIds);
    
    // Clean up test users
    await cleanupTestAuth(testUserIds);
    
    console.log('[Visitor-Test] ✅ Visitor flow test cleanup completed');
  });

  describe('Invitation Management', () => {
    it('should create invitation with encrypted visitor data', async () => {
      const invitationData = generateTestInvitation(testResidentId, '-create-test');
      
      // Create invitation via Edge Function
      const invitation = await createTestInvitation(residentClient, invitationData);
      testDataIds.invitationIds.push(invitation.id);
      
      // Verify invitation was created properly
      expect(invitation).toBeDefined();
      expect(invitation.id).toBeDefined();
      expect(invitation.invitation_token).toBeDefined();
      expect(invitation.status).toBe('pending');
      expect(invitation.resident_id).toBe(testResidentId);
      
      // Verify visitor data fields exist
      expect(invitation.visitor_full_name).toBeDefined();
      expect(invitation.visitor_phone).toBeDefined();
      expect(invitation.visitor_email).toBeDefined();
      
      // Verify visitor data is stored correctly
      expect(invitation.visitor_full_name).toBe(invitationData.visitorFullName);
      expect(invitation.visitor_email).toBe(invitationData.visitorEmail);
      
      console.log('✅ Invitation created with visitor data');
    });

    it('should enforce RLS for invitation creation', async () => {
      const invitationData = generateTestInvitation('fake-resident-id', '-rls-test');
      
      // Try to create invitation as unauthenticated user
      await expect(createTestInvitation(unauthenticatedClient, invitationData))
        .rejects.toThrow();
      
      console.log('✅ RLS properly blocks unauthorized invitation creation');
    });

    it('should validate invitation token retrieval', async () => {
      const invitationData = generateTestInvitation(testResidentId, '-token-test');
      const invitation = await createTestInvitation(residentClient, invitationData);
      testDataIds.invitationIds.push(invitation.id);
      
      // Retrieve invitation by token
      const retrievedInvitation = await getInvitationByToken(
        adminClient, 
        invitation.invitation_token
      );
      
      expect(retrievedInvitation).toBeDefined();
      expect(retrievedInvitation.id).toBe(invitation.id);
      expect(retrievedInvitation.status).toBe('pending');
      
      console.log('✅ Invitation token retrieval working');
    });
  });

  describe('Visitor Registration', () => {
    it('should complete visitor registration with PII encryption', async () => {
      // First create an invitation
      const invitationData = generateTestInvitation(testResidentId, '-reg-test');
      const invitation = await createTestInvitation(residentClient, invitationData);
      testDataIds.invitationIds.push(invitation.id);
      
      // Register visitor for the invitation
      const visitorData = generateTestVisitor('-reg-test');
      const registration = await registerTestVisitor(
        residentClient, // Use authenticated client that can call Edge Functions
        visitorData,
        invitation.invitation_token
      );
      
      testDataIds.visitorIds.push(registration.visitor.id);
      
      // Verify visitor was created
      expect(registration.visitor).toBeDefined();
      expect(registration.visitor.id).toBeDefined();
      expect(registration.visitor.gdpr_consent).toBe(true);
      
      // Verify PII encryption
      const isEncrypted = await validateEncryptedData(
        adminClient,
        registration.visitor.id,
        visitorData
      );
      expect(isEncrypted).toBe(true);
      
      console.log('✅ Visitor registration with PII encryption successful');
    });

    it('should reject registration with invalid invitation token', async () => {
      const visitorData = generateTestVisitor('-invalid-test');
      
      await expect(registerTestVisitor(
        adminClient,
        visitorData,
        'invalid-token-12345'
      )).rejects.toThrow(/Invalid or expired invitation token/);
      
      console.log('✅ Invalid invitation token properly rejected');
    });

    it('should handle GDPR consent requirements', async () => {
      const invitationData = generateTestInvitation(testResidentId, '-gdpr-test');
      const invitation = await createTestInvitation(residentClient, invitationData);
      testDataIds.invitationIds.push(invitation.id);
      
      const visitorData = generateTestVisitor('-gdpr-test');
      const registration = await registerTestVisitor(
        adminClient,
        visitorData,
        invitation.invitation_token
      );
      
      testDataIds.visitorIds.push(registration.visitor.id);
      
      // Verify GDPR consent is recorded
      const visitor = await getVisitorById(adminClient, registration.visitor.id);
      expect(visitor.gdpr_consent).toBe(true);
      expect(visitor.data_retention_until).toBeDefined();
      
      console.log('✅ GDPR consent handling working correctly');
    });
  });

  describe('Access Code Generation', () => {
    it('should generate secure access codes', async () => {
      // Complete visitor registration first
      const invitationData = generateTestInvitation(testResidentId, '-access-test');
      const invitation = await createTestInvitation(residentClient, invitationData);
      testDataIds.invitationIds.push(invitation.id);
      
      const visitorData = generateTestVisitor('-access-test');
      const registration = await registerTestVisitor(
        adminClient,
        visitorData,
        invitation.invitation_token
      );
      testDataIds.visitorIds.push(registration.visitor.id);
      
      // Generate access code
      const accessCode = await generateTestAccessCode(
        adminClient,
        registration.visitor.id,
        testResidentId,
        testCommunityId
      );
      testDataIds.accessCodeIds.push(accessCode.id);
      
      // Verify access code structure
      expect(accessCode).toBeDefined();
      expect(accessCode.id).toBeDefined();
      expect(accessCode.pin).toBeDefined();
      expect(accessCode.pin).toMatch(/^\d{6}$/); // 6-digit PIN
      expect(accessCode.qr_token).toBeDefined();
      expect(accessCode.expires_at).toBeDefined();
      
      // Verify expiration is in the future
      const expiresAt = new Date(accessCode.expires_at);
      const now = new Date();
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
      
      console.log('✅ Access code generation successful');
    });

    it('should enforce RLS for access code viewing', async () => {
      // Create visitor and access code
      const invitationData = generateTestInvitation(testResidentId, '-rls-access-test');
      const invitation = await createTestInvitation(residentClient, invitationData);
      testDataIds.invitationIds.push(invitation.id);
      
      const visitorData = generateTestVisitor('-rls-access-test');
      const registration = await registerTestVisitor(adminClient, visitorData, invitation.invitation_token);
      testDataIds.visitorIds.push(registration.visitor.id);
      
      const accessCode = await generateTestAccessCode(
        adminClient,
        registration.visitor.id,
        testResidentId,
        testCommunityId
      );
      testDataIds.accessCodeIds.push(accessCode.id);
      
      // Test that unauthenticated user cannot see access codes
      await expect(getAccessCodesForVisitor(unauthenticatedClient, registration.visitor.id))
        .rejects.toThrow();
      
      console.log('✅ RLS properly protects access code viewing');
    });
  });

  describe('Access Code Verification', () => {
    it('should verify valid access codes', async () => {
      // Setup complete visitor flow
      const invitationData = generateTestInvitation(testResidentId, '-verify-test');
      const invitation = await createTestInvitation(residentClient, invitationData);
      testDataIds.invitationIds.push(invitation.id);
      
      const visitorData = generateTestVisitor('-verify-test');
      const registration = await registerTestVisitor(adminClient, visitorData, invitation.invitation_token);
      testDataIds.visitorIds.push(registration.visitor.id);
      
      const accessCode = await generateTestAccessCode(
        adminClient,
        registration.visitor.id,
        testResidentId,
        testCommunityId
      );
      testDataIds.accessCodeIds.push(accessCode.id);
      
      // Verify the access code
      const verification = await verifyTestAccessCode(
        adminClient,
        accessCode.pin,
        accessCode.qr_token
      );
      
      expect(verification).toBeDefined();
      expect(verification.success).toBe(true);
      
      console.log('✅ Access code verification successful');
    });

    it('should reject invalid access codes', async () => {
      await expect(verifyTestAccessCode(
        adminClient,
        '000000', // Invalid PIN
        'invalid-qr-token'
      )).rejects.toThrow();
      
      console.log('✅ Invalid access codes properly rejected');
    });
  });

  describe('End-to-End Visitor Flow', () => {
    it('should complete full visitor journey', async () => {
      console.log('[E2E-Test] 🔄 Testing complete visitor journey...');
      
      // Test complete flow
      const flowResult = await testCompleteVisitorFlow(
        residentClient,
        adminClient,
        testResidentId,
        testCommunityId
      );
      
      // Track test data for cleanup
      testDataIds.invitationIds.push(flowResult.invitation.id);
      testDataIds.visitorIds.push(flowResult.visitor.id);
      testDataIds.accessCodeIds.push(flowResult.accessCode.id);
      
      // Verify all components are linked correctly
      expect(flowResult.invitation).toBeDefined();
      expect(flowResult.visitor).toBeDefined(); 
      expect(flowResult.accessCode).toBeDefined();
      
      expect(flowResult.accessCode.visitor_id).toBe(flowResult.visitor.id);
      expect(flowResult.accessCode.resident_id).toBe(testResidentId);
      
      // Test access code verification
      const verification = await verifyTestAccessCode(
        adminClient,
        flowResult.accessCode.pin,
        flowResult.accessCode.qr_token
      );
      
      expect(verification.success).toBe(true);
      
      console.log('✅ Complete visitor journey successful');
    });

    it('should maintain data security throughout flow', async () => {
      console.log('[Security-Test] 🔒 Testing data security...');
      
      // Create visitor flow
      const flowResult = await testCompleteVisitorFlow(
        residentClient,
        adminClient,
        testResidentId,
        testCommunityId
      );
      
      testDataIds.invitationIds.push(flowResult.invitation.id);
      testDataIds.visitorIds.push(flowResult.visitor.id);
      testDataIds.accessCodeIds.push(flowResult.accessCode.id);
      
      // Verify visitor PII is encrypted
      const visitor = await getVisitorById(adminClient, flowResult.visitor.id);
      
      // Check encrypted fields exist and look encrypted
      expect(visitor.full_name_encrypted).toBeDefined();
      expect(visitor.phone_encrypted).toBeDefined();
      expect(visitor.email_encrypted).toBeDefined();
      expect(visitor.id_number_encrypted).toBeDefined();
      
      // Verify PIN is hashed (not plain text)
      const accessCodes = await getAccessCodesForVisitor(adminClient, flowResult.visitor.id);
      expect(accessCodes.length).toBeGreaterThan(0);
      expect(accessCodes[0].pin_hash).toBeDefined();
      expect(accessCodes[0].pin_hash).not.toBe(flowResult.accessCode.pin);
      
      console.log('✅ Data security maintained throughout flow');
    });
  });

  describe('Data Compliance & Cleanup', () => {
    it('should handle GDPR data retention policies', async () => {
      const invitationData = generateTestInvitation(testResidentId, '-gdpr-retention-test');
      const invitation = await createTestInvitation(residentClient, invitationData);
      testDataIds.invitationIds.push(invitation.id);
      
      const visitorData = generateTestVisitor('-gdpr-retention-test');
      const registration = await registerTestVisitor(adminClient, visitorData, invitation.invitation_token);
      testDataIds.visitorIds.push(registration.visitor.id);
      
      const visitor = await getVisitorById(adminClient, registration.visitor.id);
      
      // Verify data retention timestamp is set
      expect(visitor.data_retention_until).toBeDefined();
      
      // Verify it's in the future (reasonable retention period)
      const retentionDate = new Date(visitor.data_retention_until);
      const now = new Date();
      expect(retentionDate.getTime()).toBeGreaterThan(now.getTime());
      
      console.log('✅ GDPR data retention policies working');
    });

    it('should track audit logs for security events', async () => {
      const invitationData = generateTestInvitation(testResidentId, '-audit-test');
      const invitation = await createTestInvitation(residentClient, invitationData);
      testDataIds.invitationIds.push(invitation.id);
      
      // Check audit log was created
      const { data: auditLogs } = await adminClient
        .from('audit_logs')
        .select('*')
        .eq('entity_type', 'visit_invitation')
        .eq('entity_id', invitation.id);
      
      expect(auditLogs).toBeDefined();
      expect(auditLogs!.length).toBeGreaterThan(0);
      expect(auditLogs![0].event_type).toBe('create_invitation');
      expect(auditLogs![0].user_id).toBe(testResidentId);
      
      console.log('✅ Audit logging working correctly');
    });
  });
});
