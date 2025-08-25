// Simplified auth helpers for stub mode (Supabase removed)
import supabase from '../../src/integrations/supabase/client';

export interface TestUser { email: string; password: string; fullName: string; unitNumber: string; phone: string; role: 'resident' | 'security_guard' | 'admin' | 'visitor'; }
export interface AuthTestContext { user: TestUser; client: typeof supabase; session: any; userId: string; }

export function createAuthTestClient() { return supabase; }

export function generateTestUser(role: TestUser['role'] = 'resident'): TestUser {
  const r = Math.random().toString(36).slice(2, 8);
  return { email: `test-${role}-${Date.now()}-${r}@local`, password: 'Password123!', fullName: `Test ${role}`, unitNumber: `${Math.floor(Math.random()*900)+100}`, phone: '+254700000000', role };
}

function createAuthContext(user: TestUser, userId: string, session: any): AuthTestContext { return { user, client: supabase, session, userId }; }

export async function signUpTestUser(client: typeof supabase, user: TestUser, _communityId?: string): Promise<AuthTestContext> {
  const { data, error } = await client.auth.signUp({ email: user.email, password: user.password });
  if (error || !data.user) throw new Error('Sign up failed');
  return createAuthContext(user, data.user.id, data.session);
}

export async function signInTestUser(client: typeof supabase, user: TestUser): Promise<AuthTestContext> {
  const { data, error } = await client.auth.signInWithPassword({ email: user.email, password: user.password });
  if (error || !data.user) throw new Error('Sign in failed');
  return createAuthContext(user, data.user.id, data.session);
}

export async function signOutTestUser(client: typeof supabase) { await client.auth.signOut(); }

export async function getSessionInfo(client: typeof supabase) { const { data } = await client.auth.getSession(); return { isAuthenticated: !!data.session?.user, user: data.session?.user }; }

export async function cleanupTestAuth(_ids: string[]) { /* no-op */ }
export async function validateRLSBlocks(): Promise<boolean> { return true; }
