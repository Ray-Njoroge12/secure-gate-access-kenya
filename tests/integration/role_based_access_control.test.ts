import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  createAuthTestClient, 
  generateTestUser, 
  signUpTestUser, 
  signInTestUser, 
  signOutTestUser, 
  getSessionInfo, 
  validateRLSBlocks, 
  cleanupTestAuth 
} from '../utils/auth-helpers';

describe('Role-Based Access Control Tests', () => {
  let residentContext: any;
  let guardContext: any;
  let adminContext: any;

  beforeAll(async () => {
    // Create test users for each role
    const residentUser = generateTestUser('resident');
    const guardUser = generateTestUser('security_guard');
    const adminUser = generateTestUser('admin');

    residentContext = await signUpTestUser(createAuthTestClient(), residentUser);
    guardContext = await signUpTestUser(createAuthTestClient(), guardUser);
    adminContext = await signUpTestUser(createAuthTestClient(), adminUser);
  }, 30000); // 30 second timeout

  afterAll(async () => {
    // Clean up test users
    await cleanupTestAuth([residentContext.userId, guardContext.userId, adminContext.userId]);
  });

  describe('User Role Creation', () => {
    it('should create a resident user', async () => {
      expect(residentContext.userId).toBeDefined();
      expect(residentContext.user.role).toBe('resident');
    });

    it('should create a guard user', async () => {
      expect(guardContext.userId).toBeDefined();
      expect(guardContext.user.role).toBe('security_guard');
    });

    it('should create an admin user', async () => {
      expect(adminContext.userId).toBeDefined();
      expect(adminContext.user.role).toBe('admin');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow residents to access their own profile', async () => {
      const { data: profile } = await residentContext.client
        .from('profiles')
        .select('*')
        .eq('id', residentContext.userId)
        .single();
      expect(profile).not.toBeNull();
      expect(profile.role).toBe('resident');
    });

    it('should block residents from accessing guard profiles', async () => {
      const isBlocked = await validateRLSBlocks(residentContext.client, 'profiles', 'select');
      expect(isBlocked).toBe(true);
    });

    it('should allow guards to access their own profile', async () => {
      const { data: profile } = await guardContext.client
        .from('profiles')
        .select('*')
        .eq('id', guardContext.userId)
        .single();
      expect(profile).not.toBeNull();
      expect(profile.role).toBe('security_guard');
    });

    it('should block guards from accessing resident profiles', async () => {
      const isBlocked = await validateRLSBlocks(guardContext.client, 'profiles', 'select');
      expect(isBlocked).toBe(true);
    });

    it('should allow admins to access all profiles', async () => {
      const { data: profiles } = await adminContext.client
        .from('profiles')
        .select('*');
      expect(profiles.length).toBeGreaterThan(0);
    });
  });

  describe('Session Management', () => {
    it('should maintain session for residents', async () => {
      const sessionInfo = await getSessionInfo(residentContext.client);
      expect(sessionInfo.isAuthenticated).toBe(true);
    });

    it('should maintain session for guards', async () => {
      const sessionInfo = await getSessionInfo(guardContext.client);
      expect(sessionInfo.isAuthenticated).toBe(true);
    });

    it('should maintain session for admins', async () => {
      const sessionInfo = await getSessionInfo(adminContext.client);
      expect(sessionInfo.isAuthenticated).toBe(true);
    });
  });

  describe('RLS Policies Validation', () => {
    it('should block unauthenticated access to sensitive tables', async () => {
      const unauthenticatedClient = createAuthTestClient();
      const isBlocked = await validateRLSBlocks(unauthenticatedClient, 'profiles', 'select');
      expect(isBlocked).toBe(true);
    });
  });
});
