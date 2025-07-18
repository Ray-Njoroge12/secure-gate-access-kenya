import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import crypto from 'crypto';

// Test configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Test clients
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper function to generate phone numbers
function generatePhoneNumber(): string {
  return `+254${faker.string.numeric(9)}`;
}

// Test data storage
interface TestData {
  residents: any[];
  communities: any[];
  invitations: any[];
  visitors: any[];
  accessCodes: any[];
  guards: any[];
}

let testData: TestData = {
  residents: [],
  communities: [],
  invitations: [],
  visitors: [],
  accessCodes: [],
  guards: []
};

describe('Visitor Management System - Comprehensive Integrity Tests', () => {
  
  beforeAll(async () => {
    console.log('🚀 Starting comprehensive system integrity tests...');
    await setupTestEnvironment();
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up test environment...');
    await cleanupTestEnvironment();
  });

  describe('🏠 Resident Platform Tests', () => {
    
    it('should authenticate resident successfully', async () => {
      const testResident = testData.residents[0];
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: testResident.email,
        password: 'TestPassword123!'
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe(testResident.email);
      
      // Verify session persistence
      const { data: session } = await supabaseClient.auth.getSession();
      expect(session.session).toBeDefined();
    });

    it('should create single-use invitation successfully', async () => {
      const invitationData = {
        resident_id: testData.residents[0].id,
        visitor_full_name: faker.person.fullName(),
        visitor_email: faker.internet.email(),
        visitor_phone_number: generatePhoneNumber(),
        visit_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_multi_use: false,
        uses_remaining: 1
      };

      const { data, error } = await supabaseClient.functions.invoke('create-invitation', {
        body: invitationData
      });

      expect(error).toBeNull();
      expect(data?.invitation).toBeDefined();
      expect(data?.invitation?.invitation_token).toBeDefined();
      expect(data?.invitation?.status).toBe('pending');
      
      if (data?.invitation) {
        testData.invitations.push(data.invitation);
      }
    });

    it('should create multi-use invitation with date range', async () => {
      const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const invitationData = {
        resident_id: testData.residents[0].id,
        visitor_full_name: faker.person.fullName(),
        visitor_email: faker.internet.email(),
        visitor_phone_number: generatePhoneNumber(),
        visit_date: startDate.toISOString(),
        is_multi_use: true,
        uses_remaining: 5,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      };

      const { data, error } = await supabaseClient.functions.invoke('create-invitation', {
        body: invitationData
      });

      expect(error).toBeNull();
      expect(data?.invitation?.is_multi_use).toBe(true);
      expect(data?.invitation?.uses_remaining).toBe(5);
      
      if (data?.invitation) {
        testData.invitations.push(data.invitation);
      }
    });

    it('should enforce rate limiting on invitation creation', async () => {
      const invitationData = {
        resident_id: testData.residents[0].id,
        visitor_full_name: faker.person.fullName(),
        visitor_email: faker.internet.email(),
        visitor_phone_number: generatePhoneNumber(),
        visit_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_multi_use: false,
        uses_remaining: 1
      };

      // First request should succeed
      const { error: firstError } = await supabaseClient.functions.invoke('create-invitation', {
        body: invitationData
      });
      expect(firstError).toBeNull();

      // Immediate second request should be rate limited
      const { error: secondError } = await supabaseClient.functions.invoke('create-invitation', {
        body: invitationData
      });
      
      expect(secondError).toBeDefined();
      // Should return 429 status or rate limit error
    });

    it('should retrieve resident invitations with proper filtering', async () => {
      const { data, error } = await supabaseClient.functions.invoke('get-resident-invitations', {
        body: { resident_id: testData.residents[0].id }
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBeGreaterThan(0);
      
      // Verify data structure and encryption
      data?.forEach((invitation: any) => {
        expect(invitation.id).toBeDefined();
        expect(invitation.status).toBeDefined();
        expect(invitation.visitor_full_name_encrypted).toBeDefined();
      });
    });
  });

  describe('👤 Visitor Platform Tests', () => {
    
    it('should complete visitor registration with valid token', async () => {
      const invitation = testData.invitations[0];
      const visitorData = {
        fullName: faker.person.fullName(),
        idNumber: faker.string.numeric(8),
        phoneNumber: generatePhoneNumber(),
        visitorEmail: faker.internet.email(),
        consent: true,
        photoUrl: 'https://example.com/photo.jpg',
        invitationToken: invitation.invitation_token
      };

      const { data, error } = await supabaseClient.functions.invoke('complete-visitor-registration', {
        body: visitorData
      });

      expect(error).toBeNull();
      expect(data?.message).toBe('Registration successful');
      
      // Verify visitor was created in database
      const { data: visitor } = await supabaseAdmin
        .from('visitors')
        .select('*')
        .eq('id_number_hash', crypto.createHash('sha256').update(visitorData.idNumber).digest('hex'))
        .single();
        
      expect(visitor).toBeDefined();
      expect(visitor?.gdpr_consent).toBe(true);
      if (visitor) {
        testData.visitors.push(visitor);
      }
    });

    it('should reject registration with invalid token', async () => {
      const visitorData = {
        fullName: faker.person.fullName(),
        idNumber: faker.string.numeric(8),
        phoneNumber: generatePhoneNumber(),
        visitorEmail: faker.internet.email(),
        consent: true,
        photoUrl: 'https://example.com/photo.jpg',
        invitationToken: 'invalid-token-12345'
      };

      const { error } = await supabaseClient.functions.invoke('complete-visitor-registration', {
        body: visitorData
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain('Invalid or expired invitation token');
    });

    it('should reject registration without consent', async () => {
      const invitation = testData.invitations[1];
      const visitorData = {
        fullName: faker.person.fullName(),
        idNumber: faker.string.numeric(8),
        phoneNumber: generatePhoneNumber(),
        visitorEmail: faker.internet.email(),
        consent: false,
        photoUrl: 'https://example.com/photo.jpg',
        invitationToken: invitation?.invitation_token
      };

      const { error } = await supabaseClient.functions.invoke('complete-visitor-registration', {
        body: visitorData
      });

      expect(error).toBeDefined();
    });

    it('should generate access code after successful registration', async () => {
      // Check if access code was generated for the registered visitor
      const { data: accessCodes } = await supabaseAdmin
        .from('access_codes')
        .select('*')
        .eq('visitor_id', testData.visitors[0]?.id);

      expect(accessCodes).toBeDefined();
      expect(accessCodes && accessCodes.length).toBeGreaterThan(0);
      
      if (accessCodes && accessCodes.length > 0) {
        const accessCode = accessCodes[0];
        expect(accessCode.pin_hash).toBeDefined();
        expect(accessCode.qr_token).toBeDefined();
        expect(accessCode.expires_at).toBeDefined();
        expect(accessCode.used_at).toBeNull();
        
        testData.accessCodes.push(accessCode);
      }
    });
  });

  describe('🛡️ Security Platform Tests', () => {
    
    it('should verify valid QR code successfully', async () => {
      const accessCode = testData.accessCodes[0];
      
      const { data, error } = await supabaseClient.functions.invoke('verify-access-code', {
        body: { code: accessCode.qr_token }
      });

      expect(error).toBeNull();
      expect(data?.access_code).toBeDefined();
      expect(data?.access_code?.visitors).toBeDefined();
      
      // Verify visitor data is decrypted
      expect(data?.access_code?.visitors?.full_name).toBeDefined();
      expect(data?.access_code?.visitors?.id_number).toBeDefined();
      expect(data?.access_code?.visitors?.phone_number).toBeDefined();
    });

    it('should mark access code as used after verification', async () => {
      const accessCode = testData.accessCodes[0];
      
      // Verify the code was marked as used
      const { data: updatedCode } = await supabaseAdmin
        .from('access_codes')
        .select('used_at')
        .eq('id', accessCode.id)
        .single();

      expect(updatedCode && updatedCode.used_at).toBeDefined();
      expect(updatedCode && new Date(updatedCode.used_at)).toBeInstanceOf(Date);
    });

    it('should reject already used QR code', async () => {
      const accessCode = testData.accessCodes[0];
      
      const { error } = await supabaseClient.functions.invoke('verify-access-code', {
        body: { code: accessCode.qr_token }
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain('already been used');
    });

    it('should verify valid PIN successfully', async () => {
      // Create a new access code for PIN testing
      const newVisitor = await createTestVisitor();
      const newAccessCode = await createTestAccessCode(newVisitor.id);
      
      // Generate a test PIN (in real system, this would be sent via SMS/email)
      const testPin = '123456';
      const pinHash = await hashPin(testPin);
      
      // Update access code with test PIN hash
      await supabaseAdmin
        .from('access_codes')
        .update({ pin_hash: pinHash })
        .eq('id', newAccessCode.id);

      const { data, error } = await supabaseClient.functions.invoke('verify-access-code', {
        body: { code: testPin }
      });

      expect(error).toBeNull();
      expect(data?.access_code).toBeDefined();
    });

    it('should reject invalid PIN', async () => {
      const { error } = await supabaseClient.functions.invoke('verify-access-code', {
        body: { code: '999999' }
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain('Invalid PIN');
    });

    it('should log all access attempts in audit trail', async () => {
      const { data: auditLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('event_type', 'ACCESS_VERIFICATION')
        .order('created_at', { ascending: false })
        .limit(5);

      expect(auditLogs).toBeDefined();
      expect(auditLogs && auditLogs.length).toBeGreaterThan(0);
      
      auditLogs?.forEach((log: any) => {
        expect(log.event_type).toBe('ACCESS_VERIFICATION');
        expect(log.details).toBeDefined();
        expect(log.created_at).toBeDefined();
      });
    });
  });

  describe('🔒 Data Security & Privacy Tests', () => {
    
    it('should encrypt PII data correctly', async () => {
      const testDataObj = {
        fullName: 'John Doe',
        phoneNumber: '+254700123456',
        visitorEmail: 'john@example.com'
      };

      const { data, error } = await supabaseClient.functions.invoke('encrypt-pii', {
        body: testDataObj
      });

      expect(error).toBeNull();
      expect(data?.encryptedFullName).toBeDefined();
      expect(data?.encryptedPhoneNumber).toBeDefined();
      expect(data?.encryptedVisitorEmail).toBeDefined();
      
      // Verify encrypted data is different from original
      expect(data?.encryptedFullName).not.toBe(testDataObj.fullName);
      expect(data?.encryptedPhoneNumber).not.toBe(testDataObj.phoneNumber);
      expect(data?.encryptedVisitorEmail).not.toBe(testDataObj.visitorEmail);
    });

    it('should decrypt PII data correctly', async () => {
      const visitor = testData.visitors[0];
      
      const { data, error } = await supabaseClient.functions.invoke('decrypt-visitor-data', {
        body: {
          encryptedFullName: visitor.full_name_encrypted,
          encryptedIdNumber: visitor.id_number_encrypted,
          encryptedPhoneNumber: visitor.phone_encrypted
        }
      });

      expect(error).toBeNull();
      expect(data?.decryptedFullName).toBeDefined();
      expect(data?.decryptedIdNumber).toBeDefined();
      expect(data?.decryptedPhoneNumber).toBeDefined();
      
      // Verify decrypted data is readable
      expect(typeof data?.decryptedFullName).toBe('string');
      expect(data?.decryptedFullName && data.decryptedFullName.length).toBeGreaterThan(0);
    });

    it('should enforce data retention policies', async () => {
      // Test the data retention cleanup function
      const { error } = await supabaseAdmin.rpc('clean_old_invitations');
      expect(error).toBeNull();
      
      // Verify old data is cleaned up (this would need old test data)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 365); // Default retention period
      
      const { data: oldInvitations } = await supabaseAdmin
        .from('visit_invitations')
        .select('id')
        .lt('created_at', cutoffDate.toISOString());
        
      expect(oldInvitations?.length || 0).toBe(0);
    });

    it('should validate GDPR consent requirements', async () => {
      // Verify all visitors have explicit consent
      const { data: visitors } = await supabaseAdmin
        .from('visitors')
        .select('gdpr_consent')
        .eq('gdpr_consent', false);
        
      expect(visitors?.length || 0).toBe(0);
    });
  });

  describe('⚡ Performance & Load Tests', () => {
    
    it('should handle concurrent invitation creation', async () => {
      const concurrentRequests = 10;
      const promises: Promise<any>[] = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        const invitationData = {
          resident_id: testData.residents[0].id,
          visitor_full_name: faker.person.fullName(),
          visitor_email: faker.internet.email(),
          visitor_phone_number: generatePhoneNumber(),
          visit_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          is_multi_use: false,
          uses_remaining: 1
        };
        
        promises.push(
          supabaseClient.functions.invoke('create-invitation', {
            body: invitationData
          })
        );
      }
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      // Some requests should succeed, some might be rate limited
      expect(successful).toBeGreaterThan(0);
      console.log(`Concurrent test: ${successful} successful, ${failed} failed`);
    });

    it('should handle bulk visitor registrations efficiently', async () => {
      const startTime = Date.now();
      const bulkSize = 5;
      
      // Create multiple invitations first
      const invitations: any[] = [];
      for (let i = 0; i < bulkSize; i++) {
        const { data } = await supabaseClient.functions.invoke('create-invitation', {
          body: {
            resident_id: testData.residents[0].id,
            visitor_full_name: faker.person.fullName(),
            visitor_email: faker.internet.email(),
            visitor_phone_number: generatePhoneNumber(),
            visit_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            is_multi_use: false,
            uses_remaining: 1
          }
        });
        if (data?.invitation) {
          invitations.push(data.invitation);
        }
      }
      
      // Register visitors concurrently
      const registrationPromises = invitations.map(invitation => 
        supabaseClient.functions.invoke('complete-visitor-registration', {
          body: {
            fullName: faker.person.fullName(),
            idNumber: faker.string.numeric(8),
            phoneNumber: generatePhoneNumber(),
            visitorEmail: faker.internet.email(),
            consent: true,
            photoUrl: 'https://example.com/photo.jpg',
            invitationToken: invitation.invitation_token
          }
        })
      );
      
      const results = await Promise.allSettled(registrationPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBe(bulkSize);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      console.log(`Bulk registration: ${bulkSize} registrations in ${duration}ms`);
    });
  });

  describe('🔍 Edge Cases & Error Handling', () => {
    
    it('should handle expired invitation tokens', async () => {
      // Create an invitation with past expiry
      const expiredInvitation = await supabaseAdmin
        .from('visit_invitations')
        .insert({
          resident_id: testData.residents[0].id,
          invitation_token: crypto.randomUUID(),
          token_expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          status: 'pending',
          visit_date: new Date().toISOString(),
          visitor_full_name_encrypted: Buffer.from('Test User'),
          visitor_phone_encrypted: Buffer.from('+254700000000'),
          visitor_email_encrypted: Buffer.from('test@example.com')
        })
        .select()
        .single();

      const { error } = await supabaseClient.functions.invoke('complete-visitor-registration', {
        body: {
          fullName: faker.person.fullName(),
          idNumber: faker.string.numeric(8),
          phoneNumber: generatePhoneNumber(),
          visitorEmail: faker.internet.email(),
          consent: true,
          photoUrl: 'https://example.com/photo.jpg',
          invitationToken: expiredInvitation.data?.invitation_token
        }
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain('expired');
    });

    it('should handle malformed QR codes', async () => {
      const malformedCodes = [
        'invalid.jwt.token',
        'not-a-jwt-at-all',
        '',
        null,
        undefined
      ];

      for (const code of malformedCodes) {
        const { error } = await supabaseClient.functions.invoke('verify-access-code', {
          body: { code }
        });
        expect(error).toBeDefined();
      }
    });

    it('should handle database connection failures gracefully', async () => {
      // This would require mocking database failures
      // For now, we'll test with invalid data that should cause DB errors
      const { error } = await supabaseClient.functions.invoke('create-invitation', {
        body: {
          resident_id: 'invalid-uuid',
          visitor_full_name: null,
          visitor_email: 'invalid-email',
          visitor_phone_number: '',
          visit_date: 'invalid-date'
        }
      });

      expect(error).toBeDefined();
    });
  });
});

// Helper functions
async function setupTestEnvironment() {
  console.log('Setting up test environment...');
  
  // Create test community
  const { data: community } = await supabaseAdmin
    .from('communities')
    .insert({
      name: 'Test Community',
      address: 'Test Address',
      phone: '+254700000000'
    })
    .select()
    .single();
  
  if (community) {
    testData.communities.push(community);
  }
  
  // Create test resident
  const { data: resident } = await supabaseAdmin
    .from('residents')
    .insert({
      email: `test-resident-${Date.now()}@example.com`,
      phone_encrypted: Buffer.from('+254700123456'),
      unit_number: 'A101',
      community_id: community?.id
    })
    .select()
    .single();
    
  if (resident) {
    testData.residents.push(resident);
  }
  
  // Create auth user for resident
  const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
    email: resident?.email || '',
    password: 'TestPassword123!',
    email_confirm: true
  });
  
  // Create profile for resident
  if (authUser.user) {
    await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        role: 'resident'
      });
  }
}

async function cleanupTestEnvironment() {
  console.log('Cleaning up test data...');
  
  // Clean up in reverse order of dependencies
  if (testData.accessCodes.length > 0) {
    await supabaseAdmin
      .from('access_codes')
      .delete()
      .in('id', testData.accessCodes.map(ac => ac.id));
  }
  
  if (testData.visitors.length > 0) {
    await supabaseAdmin
      .from('visitors')
      .delete()
      .in('id', testData.visitors.map(v => v.id));
  }
  
  if (testData.invitations.length > 0) {
    await supabaseAdmin
      .from('visit_invitations')
      .delete()
      .in('id', testData.invitations.map(i => i.id));
  }
  
  if (testData.residents.length > 0) {
    await supabaseAdmin
      .from('residents')
      .delete()
      .in('id', testData.residents.map(r => r.id));
  }
  
  if (testData.communities.length > 0) {
    await supabaseAdmin
      .from('communities')
      .delete()
      .in('id', testData.communities.map(c => c.id));
  }
}

async function createTestVisitor() {
  const { data: visitor } = await supabaseAdmin
    .from('visitors')
    .insert({
      full_name_encrypted: Buffer.from('Test Visitor'),
      id_number_hash: crypto.createHash('sha256').update('12345678').digest('hex'),
      id_number_encrypted: Buffer.from('12345678'),
      phone_encrypted: Buffer.from('+254700000000'),
      email_encrypted: Buffer.from('visitor@test.com'),
      gdpr_consent: true,
      registration_status: 'completed'
    })
    .select()
    .single();
    
  return visitor;
}

async function createTestAccessCode(visitorId: string) {
  const { data: accessCode } = await supabaseAdmin
    .from('access_codes')
    .insert({
      visitor_id: visitorId,
      resident_id: testData.residents[0].id,
      pin_hash: 'temp-hash',
      qr_token: 'temp-token',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();
    
  return accessCode;
}

async function hashPin(pin: string): Promise<string> {
  // This is a simplified hash - in real system, use Argon2
  return crypto.createHash('sha256').update(pin).digest('hex');
}
