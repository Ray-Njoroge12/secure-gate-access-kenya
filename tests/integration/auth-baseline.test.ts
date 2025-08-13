import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  validateTestEnvironment, 
  assertSuccess,
  cleanupTestData 
} from '../utils/supabase-helpers';
import {
  createAuthTestClient,
  generateTestUser,
  signUpTestUser,
  signInTestUser,
  signOutTestUser,
  getSessionInfo,
  cleanupTestAuth,
  validateRLSBlocks,
  type TestUser,
  type AuthTestContext
} from '../utils/auth-helpers';

describe('Phase 1 - Core Data & Auth Baseline', () => {
  let testCommunityId: string;
  let testUserIds: string[] = [];
  
  beforeAll(async () => {
    console.log('🔐 Phase 1 - Setting up authentication baseline tests...');
    
    // Validate environment first
    await validateTestEnvironment();
    
    // Get a test community to use
    const adminClient = createAuthTestClient();
    const { data: communities } = await adminClient
      .from('communities')
      .select('id')
      .limit(1);
    
    if (!communities || communities.length === 0) {
      throw new Error('No communities available for auth testing');
    }
    
    testCommunityId = communities[0].id;
    console.log(`[Auth-Test] Using test community: ${testCommunityId}`);
  });

  afterAll(async () => {
    console.log('🧹 Phase 1 - Cleaning up authentication test data...');
    await cleanupTestAuth(testUserIds);
    console.log('[Auth-Test] ✅ Authentication test cleanup completed');
  });

  describe('Basic Authentication Flows', () => {
    it('should create a new resident user with sign up', async () => {
      const client = createAuthTestClient();
      const testUser = generateTestUser('resident');
      
      const context = await signUpTestUser(client, testUser, testCommunityId);
      testUserIds.push(context.userId);
      
      // Verify user was created
      expect(context.userId).toBeDefined();
      expect(context.session).toBeDefined();
      expect(context.session.user.email).toBe(testUser.email);
      
      // Verify profile was created
      const { data: profile, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', context.userId)
        .single();
      
      assertSuccess({ data: profile, error }, 'Profile creation');
      expect(profile).not.toBeNull();
      expect(profile!.email).toBe(testUser.email);
      expect(profile!.role).toBe('resident');
      
      // Verify resident profile was created
      const { data: resident, error: residentError } = await client
        .from('residents')
        .select('*')
        .eq('id', context.userId)
        .single();
      
      assertSuccess({ data: resident, error: residentError }, 'Resident profile creation');
      expect(resident).not.toBeNull();
      expect(resident!.email).toBe(testUser.email);
      expect(resident!.unit_number).toBe(testUser.unitNumber);
      expect(resident!.community_id).toBe(testCommunityId);
      
      console.log(`✅ Resident user created successfully: ${context.userId}`);
    });

    it('should create a new security guard user with profile', async () => {
      const client = createAuthTestClient();
      const testUser = generateTestUser('security_guard');
      
      const context = await signUpTestUser(client, testUser, testCommunityId);
      testUserIds.push(context.userId);
      
      // Verify user was created
      expect(context.userId).toBeDefined();
      expect(context.session).toBeDefined();
      
      // Verify profile was created with correct role
      const { data: profile, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', context.userId)
        .single();
      
      assertSuccess({ data: profile, error }, 'Security guard profile creation');
      expect(profile).not.toBeNull();
      expect(profile!.role).toBe('security_guard');
      
      console.log(`✅ Security guard user created successfully: ${context.userId}`);
    });

    it('should create a visitor user (profile only)', async () => {
      const client = createAuthTestClient();
      const testUser = generateTestUser('visitor');
      
      const context = await signUpTestUser(client, testUser);
      testUserIds.push(context.userId);
      
      // Verify user was created
      expect(context.userId).toBeDefined();
      expect(context.session).toBeDefined();
      
      // Verify profile was created
      const { data: profile, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', context.userId)
        .single();
      
      assertSuccess({ data: profile, error }, 'Visitor profile creation');
      expect(profile).not.toBeNull();
      expect(profile!.role).toBe('visitor');
      
      // Verify NO resident profile was created
      const { data: resident, error: residentError } = await client
        .from('residents')
        .select('*')
        .eq('id', context.userId)
        .single();
      
      expect(resident).toBeNull();
      
      console.log(`✅ Visitor user created successfully: ${context.userId}`);
    });

    it('should sign in an existing user', async () => {
      const client = createAuthTestClient();
      const testUser = generateTestUser('resident');
      
      // First create a user
      const signUpContext = await signUpTestUser(client, testUser, testCommunityId);
      testUserIds.push(signUpContext.userId);
      
      // Sign out
      await signOutTestUser(client);
      
      // Verify signed out
      const sessionAfterSignOut = await getSessionInfo(client);
      expect(sessionAfterSignOut.isAuthenticated).toBe(false);
      
      // Sign back in
      const signInContext = await signInTestUser(client, testUser);
      
      // Verify successful sign in
      expect(signInContext.userId).toBe(signUpContext.userId);
      expect(signInContext.session).toBeDefined();
      expect(signInContext.session.user.email).toBe(testUser.email);
      
      const sessionAfterSignIn = await getSessionInfo(client);
      expect(sessionAfterSignIn.isAuthenticated).toBe(true);
      
      console.log(`✅ User sign in/out flow working: ${signInContext.userId}`);
    });

    it('should handle sign in with invalid credentials', async () => {
      const client = createAuthTestClient();
      const testUser = generateTestUser('resident');
      testUser.password = 'WrongPassword123!';
      
      try {
        await signInTestUser(client, testUser);
        expect.fail('Sign in should have failed with invalid credentials');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Sign in failed');
        console.log('✅ Invalid credentials properly rejected');
      }
    });
  });

  describe('Role-Based Access Control', () => {
    let residentContext: AuthTestContext;
    let securityGuardContext: AuthTestContext;
    let visitorContext: AuthTestContext;

    beforeAll(async () => {
      // Create test users for each role
      const residentUser = generateTestUser('resident');
      const securityGuardUser = generateTestUser('security_guard');
      const visitorUser = generateTestUser('visitor');

      residentContext = await signUpTestUser(createAuthTestClient(), residentUser, testCommunityId);
      securityGuardContext = await signUpTestUser(createAuthTestClient(), securityGuardUser, testCommunityId);
      visitorContext = await signUpTestUser(createAuthTestClient(), visitorUser);

      testUserIds.push(residentContext.userId, securityGuardContext.userId, visitorContext.userId);
      
      console.log('✅ Role-based test users created');
    });

    it('should validate that users can access their own profile', async () => {
      // Test resident can access their own profile
      const { data: residentProfile } = await residentContext.client
        .from('profiles')
        .select('*')
        .eq('id', residentContext.userId)
        .single();
      
      assertSuccess({ data: residentProfile, error: null });
      expect(residentProfile.id).toBe(residentContext.userId);
      expect(residentProfile.role).toBe('resident');
      
      // Test security guard can access their own profile
      const { data: guardProfile } = await securityGuardContext.client
        .from('profiles')
        .select('*')
        .eq('id', securityGuardContext.userId)
        .single();
      
      assertSuccess({ data: guardProfile, error: null });
      expect(guardProfile.role).toBe('security_guard');
      
      console.log('✅ Users can access their own profiles');
    });

    it('should validate resident can access their own resident data', async () => {
      const { data: residentData } = await residentContext.client
        .from('residents')
        .select('*')
        .eq('id', residentContext.userId)
        .single();
      
      assertSuccess({ data: residentData, error: null });
      expect(residentData.id).toBe(residentContext.userId);
      expect(residentData.community_id).toBe(testCommunityId);
      
      console.log('✅ Resident can access their own data');
    });

    it('should validate that visitors cannot access resident data', async () => {
      // Visitor should not be able to access residents table
      const rlsBlocked = await validateRLSBlocks(visitorContext.client, 'residents', 'select');
      expect(rlsBlocked).toBe(true);
      
      console.log('✅ RLS properly blocks visitor access to residents data');
    });

    it('should validate communities are generally accessible', async () => {
      // Communities should be readable by all authenticated users
      const { data: communities, error } = await residentContext.client
        .from('communities')
        .select('*')
        .limit(1);
      
      assertSuccess({ data: communities, error });
      expect(communities.length).toBeGreaterThan(0);
      
      // Also test with visitor
      const { data: communitiesVisitor, error: errorVisitor } = await visitorContext.client
        .from('communities')
        .select('*')
        .limit(1);
      
      assertSuccess({ data: communitiesVisitor, error: errorVisitor });
      
      console.log('✅ Communities accessible to authenticated users');
    });
  });

  describe('Row Level Security Validation', () => {
    let authenticatedClient: ReturnType<typeof createAuthTestClient>;
    let unauthenticatedClient: ReturnType<typeof createAuthTestClient>;

    beforeAll(async () => {
      // Create an authenticated client
      const testUser = generateTestUser('resident');
      const context = await signUpTestUser(createAuthTestClient(), testUser, testCommunityId);
      authenticatedClient = context.client;
      testUserIds.push(context.userId);
      
      // Create an unauthenticated client
      unauthenticatedClient = createAuthTestClient();
    });

    it('should block unauthenticated access to sensitive tables', async () => {
      const tablesToTest: Array<'residents' | 'visit_invitations' | 'access_codes'> = [
        'residents',
        'visit_invitations', 
        'access_codes'
      ];

      for (const table of tablesToTest) {
        const isBlocked = await validateRLSBlocks(unauthenticatedClient, table, 'select');
        expect(isBlocked).toBe(true);
        console.log(`✅ RLS blocks unauthenticated access to ${table}`);
      }
    });

    it('should allow authenticated access where appropriate', async () => {
      // Authenticated user should be able to access communities
      const { data: communities, error } = await authenticatedClient
        .from('communities')
        .select('*')
        .limit(1);
      
      assertSuccess({ data: communities, error });
      expect(communities.length).toBeGreaterThan(0);
      
      console.log('✅ Authenticated access works for appropriate tables');
    });

    it('should validate RLS blocks unauthorized modifications', async () => {
      const isInsertBlocked = await validateRLSBlocks(unauthenticatedClient, 'residents', 'insert');
      expect(isInsertBlocked).toBe(true);
      
      const isUpdateBlocked = await validateRLSBlocks(unauthenticatedClient, 'residents', 'update');
      expect(isUpdateBlocked).toBe(true);
      
      const isDeleteBlocked = await validateRLSBlocks(unauthenticatedClient, 'residents', 'delete');
      expect(isDeleteBlocked).toBe(true);
      
      console.log('✅ RLS blocks unauthorized modifications');
    });
  });

  describe('Session Management', () => {
    it('should maintain session persistence correctly', async () => {
      const client = createAuthTestClient();
      const testUser = generateTestUser('resident');
      
      const context = await signUpTestUser(client, testUser, testCommunityId);
      testUserIds.push(context.userId);
      
      // Verify session is active
      let sessionInfo = await getSessionInfo(client);
      expect(sessionInfo.isAuthenticated).toBe(true);
      expect(sessionInfo.user.id).toBe(context.userId);
      
      // Sign out
      await signOutTestUser(client);
      
      // Verify session is cleared
      sessionInfo = await getSessionInfo(client);
      expect(sessionInfo.isAuthenticated).toBe(false);
      
      console.log('✅ Session management working correctly');
    });

    it('should handle multiple concurrent client sessions', async () => {
      const client1 = createAuthTestClient();
      const client2 = createAuthTestClient();
      
      const user1 = generateTestUser('resident');
      const user2 = generateTestUser('security_guard');
      
      const context1 = await signUpTestUser(client1, user1, testCommunityId);
      const context2 = await signUpTestUser(client2, user2, testCommunityId);
      
      testUserIds.push(context1.userId, context2.userId);
      
      // Both should be authenticated independently
      const session1 = await getSessionInfo(client1);
      const session2 = await getSessionInfo(client2);
      
      expect(session1.isAuthenticated).toBe(true);
      expect(session2.isAuthenticated).toBe(true);
      expect(session1.user.id).toBe(context1.userId);
      expect(session2.user.id).toBe(context2.userId);
      expect(session1.user.id).not.toBe(session2.user.id);
      
      console.log('✅ Multiple concurrent sessions work independently');
    });
  });
});
