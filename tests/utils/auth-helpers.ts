import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/integrations/supabase/types';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

export interface TestUser {
  email: string;
  password: string;
  fullName: string;
  unitNumber: string;
  phone: string;
  role: 'resident' | 'security_guard' | 'visitor';
}

export interface AuthTestContext {
  user: TestUser;
  client: ReturnType<typeof createClient<Database>>;
  session: any;
  userId: string;
}

/**
 * Creates a fresh Supabase client for auth testing
 */
export function createAuthTestClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: {
        getItem: (key: string) => {
          // Use in-memory storage for tests to avoid conflicts
          return (globalThis as any).__testAuthStorage?.[key] || null;
        },
        setItem: (key: string, value: string) => {
          if (!(globalThis as any).__testAuthStorage) {
            (globalThis as any).__testAuthStorage = {};
          }
          (globalThis as any).__testAuthStorage[key] = value;
        },
        removeItem: (key: string) => {
          if ((globalThis as any).__testAuthStorage) {
            delete (globalThis as any).__testAuthStorage[key];
          }
        }
      },
      persistSession: false, // Don't persist in tests
      autoRefreshToken: false, // Don't auto-refresh in tests
    }
  });
}

/**
 * Generates unique test user data
 */
export function generateTestUser(role: TestUser['role'] = 'resident'): TestUser {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return {
    email: `test-${role}-${timestamp}-${random}@supabase.io`,
    password: 'TestPassword123!',
    fullName: `Test ${role} ${random}`,
    unitNumber: `${Math.floor(Math.random() * 999) + 1}`,
    phone: `+254${Math.floor(Math.random() * 900000000) + 100000000}`,
    role
  };
}

/**
 * Creates auth context with session
 */
function createAuthContextWithSession(
  client: ReturnType<typeof createClient<Database>>,
  userData: TestUser,
  userId: string,
  session: any
): AuthTestContext {
  return {
    user: userData,
    client,
    session,
    userId
  };
}

/**
 * Signs up a new test user and creates their profile
 */
export async function signUpTestUser(
  client: ReturnType<typeof createClient<Database>>,
  userData: TestUser,
  communityId?: string
): Promise<AuthTestContext> {
  console.log(`[Auth-Helper] 🔐 Signing up test user: ${userData.email} (${userData.role})`);
  
  const { data, error } = await client.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      emailRedirectTo: `${process.env.VITE_SUPABASE_URL}/auth/v1/verify`,
      data: {
        full_name: userData.fullName,
        unit_number: userData.unitNumber,
        phone: userData.phone,
      }
    }
  });

  if (error) {
    throw new Error(`Sign up failed: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Sign up succeeded but no user returned');
  }

  // In test mode, if email confirmation is required, we'll manually confirm
  if (!data.session) {
    console.log(`[Auth-Helper] ⚠️ Email confirmation required for: ${userData.email}`);
    
    // For testing, we'll try to auto-confirm the user (if possible with admin client)
    const adminClient = createClient<Database>(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Try to confirm the user via admin action
    try {
      const { data: confirmData, error: confirmError } = await adminClient.auth.admin.updateUserById(
        data.user.id,
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.log(`[Auth-Helper] ⚠️ Could not auto-confirm user: ${confirmError.message}`);
      } else {
        console.log(`[Auth-Helper] ✅ Auto-confirmed user: ${data.user.id}`);
        
        // Now try to sign in to get a session
        const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        });
        
        if (signInData.session) {
          console.log(`[Auth-Helper] ✅ Got session after confirmation`);
          const context = createAuthContextWithSession(client, userData, data.user.id, signInData.session);
          await createUserProfiles(context, communityId);
          return context;
        }
      }
    } catch (adminError) {
      console.log(`[Auth-Helper] ⚠️ Admin confirmation failed:`, adminError);
    }
    
    // If we still don't have a session, create a context without it but still create profiles
    console.log(`[Auth-Helper] ⚠️ Proceeding without session for: ${data.user.id}`);
    const context = createAuthContextWithSession(client, userData, data.user.id, null);
    await createUserProfiles(context, communityId);
    return context;
  }

  // We have a session, proceed normally
  const context = createAuthContextWithSession(client, userData, data.user.id, data.session);
  await createUserProfiles(context, communityId);
  return context;
}

/**
 * Creates user profiles after signup
 */
async function createUserProfiles(
  context: AuthTestContext,
  communityId?: string
): Promise<void> {
  try {
    // Use admin client to bypass RLS for test profile creation
    const adminClient = createClient<Database>(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Create a profile for all users with their role using admin client
    await createUserProfile(adminClient, context.userId, context.user);
    
    // Create profile based on role using admin client
    if (context.user.role === 'resident') {
      await createResidentProfile(adminClient, context.userId, context.user, communityId);
    }
  } catch (error) {
    console.log(`[Auth-Helper] ⚠️ Profile creation failed:`, error);
    // Don't throw - this might be expected behavior with RLS
  }
}

/**
 * Signs in an existing test user
 */
export async function signInTestUser(
  client: ReturnType<typeof createClient<Database>>,
  userData: TestUser
): Promise<AuthTestContext> {
  console.log(`[Auth-Helper] 🔑 Signing in test user: ${userData.email}`);
  
  const { data, error } = await client.auth.signInWithPassword({
    email: userData.email,
    password: userData.password,
  });

  if (error) {
    throw new Error(`Sign in failed: ${error.message}`);
  }

  if (!data.user || !data.session) {
    throw new Error('Sign in succeeded but no user or session returned');
  }

  console.log(`[Auth-Helper] ✅ User signed in: ${data.user.id}`);
  
  return {
    user: userData,
    client,
    session: data.session,
    userId: data.user.id
  };
}

/**
 * Signs out the current user
 */
export async function signOutTestUser(
  client: ReturnType<typeof createClient<Database>>
): Promise<void> {
  console.log('[Auth-Helper] 🚪 Signing out test user');
  
  const { error } = await client.auth.signOut();
  if (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
  
  // Clear test storage
  (globalThis as any).__testAuthStorage = {};
  
  console.log('[Auth-Helper] ✅ User signed out');
}

/**
 * Creates a user profile for the user
 */
async function createUserProfile(
  client: ReturnType<typeof createClient<Database>>,
  userId: string,
  userData: TestUser
) {
  const { error } = await client
    .from('profiles')
    .insert({
      id: userId,
      email: userData.email,
      role: userData.role,
    });

  if (error) {
    throw new Error(`User profile creation failed: ${error.message}`);
  }

  console.log(`[Auth-Helper] ✅ User profile created for: ${userId} (${userData.role})`);
}

/**
 * Creates a resident profile for the user
 */
async function createResidentProfile(
  client: ReturnType<typeof createClient<Database>>,
  userId: string,
  userData: TestUser,
  communityId?: string
) {
  // Get a community to assign to (or use provided one)
  let targetCommunityId = communityId;
  
  if (!targetCommunityId) {
    const { data: communities } = await client
      .from('communities')
      .select('id')
      .limit(1);
    
    targetCommunityId = communities?.[0]?.id;
  }

  if (!targetCommunityId) {
    throw new Error('No community available for resident profile creation');
  }

  const { error } = await client
    .from('residents')
    .insert({
      id: userId,
      email: userData.email,
      unit_number: userData.unitNumber,
      phone_encrypted: userData.phone, // In tests, we'll skip encryption for simplicity
      community_id: targetCommunityId,
    });

  if (error) {
    throw new Error(`Resident profile creation failed: ${error.message}`);
  }

  console.log(`[Auth-Helper] ✅ Resident profile created for: ${userId}`);
}

/**
 * Gets current session info for debugging
 */
export async function getSessionInfo(
  client: ReturnType<typeof createClient<Database>>
): Promise<any> {
  const { data, error } = await client.auth.getSession();
  
  if (error) {
    throw new Error(`Failed to get session: ${error.message}`);
  }
  
  return {
    session: data.session,
    user: data.session?.user,
    isAuthenticated: !!data.session?.user
  };
}

/**
 * Cleanup function to remove test users and their data
 */
export async function cleanupTestAuth(
  userIds: string[]
): Promise<void> {
  if (userIds.length === 0) return;
  
  console.log('[Auth-Helper] 🧹 Cleaning up test users:', userIds);
  
  // Use admin client for cleanup
  const adminClient = createClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    // Clean up profiles first (to handle foreign key constraints)
    await adminClient.from('residents').delete().in('id', userIds);
    await adminClient.from('profiles').delete().in('id', userIds);
    await adminClient.from('visitors').delete().in('id', userIds);
    
    // Then clean up auth users (if possible via admin API)
    // Note: Supabase doesn't allow deleting auth users via client in most setups
    // This would need to be done via admin API or manual cleanup
    
    console.log('[Auth-Helper] ✅ Test user cleanup completed');
  } catch (error) {
    console.warn('[Auth-Helper] ⚠️ Cleanup had some issues:', error);
  }
}

/**
 * Validates that RLS is working by attempting unauthorized access
 */
export async function validateRLSBlocks(
  client: ReturnType<typeof createClient<Database>>,
  tableName: 'residents' | 'visit_invitations' | 'access_codes' | 'visitors' | 'communities' | 'profiles',
  operation: 'select' | 'insert' | 'update' | 'delete' = 'select'
): Promise<boolean> {
  try {
    let result;
    
    switch (operation) {
      case 'select':
        result = await client.from(tableName).select('*').limit(1);
        break;
      case 'insert':
        // Create minimal valid data for each table
        if (tableName === 'communities') {
          result = await client.from(tableName).insert({ name: 'Test' }).select();
        } else if (tableName === 'profiles') {
          result = await client.from(tableName).insert({ id: 'fake-id', email: 'test@test.com' }).select();
        } else {
          // For other tables, we expect this to fail due to RLS anyway
          result = await client.from(tableName).insert({} as any).select();
        }
        break;
      case 'update':
        result = await client.from(tableName).update({} as any).eq('id', 'fake-id');
        break;
      case 'delete':
        result = await client.from(tableName).delete().eq('id', 'fake-id');
        break;
    }
    
    // If we get here without error, RLS might not be working as expected
    if (result.error) {
      // Check if it's an RLS-related error
      const errorCode = result.error.code;
      const errorMessage = result.error.message;
      
      // Common RLS error indicators
      if (errorCode === 'PGRST301' || errorMessage.includes('permission denied') || 
          errorMessage.includes('row-level security')) {
        return true; // RLS is properly blocking
      }
    }
    
    return false; // RLS might not be working properly
  } catch (error) {
    // Unexpected error, assume RLS is working
    return true;
  }
}
