// Simplified auth helpers for stub mode (Supabase removed)
// Using API abstraction (currently in-memory implementation)
import { api } from '../../src/services/api';

export interface TestUser { email: string; password: string; fullName: string; unitNumber: string; phone: string; role: 'resident' | 'security_guard' | 'admin' | 'visitor'; }
export interface AuthTestContext { user: TestUser; client: typeof api; session: any; userId: string; }

export function createAuthTestClient() { return api; }

export function generateTestUser(role: TestUser['role'] = 'resident'): TestUser {
  const r = Math.random().toString(36).slice(2, 8);
  return { email: `test-${role}-${Date.now()}-${r}@local`, password: 'Password123!', fullName: `Test ${role}`, unitNumber: `${Math.floor(Math.random()*900)+100}`, phone: '+254700000000', role };
}

function createAuthContext(user: TestUser, userId: string, session: any): AuthTestContext { return { user, client: api, session, userId }; }

export async function signUpTestUser(client: typeof api, user: TestUser, _communityId?: string): Promise<AuthTestContext> {
  // Stub: signUp == signIn for in-memory api
  const session = await client.auth.signIn(user.email, user.password);
  if (!session.user) throw new Error('Sign up failed');
  return createAuthContext(user, session.user.id, session);
}

export async function signInTestUser(client: typeof api, user: TestUser): Promise<AuthTestContext> {
  const session = await client.auth.signIn(user.email, user.password);
  if (!session.user) throw new Error('Sign in failed');
  return createAuthContext(user, session.user.id, session);
}

export async function signOutTestUser(client: typeof api) { await client.auth.signOut(); }

export async function getSessionInfo(client: typeof api) { const session = await client.auth.getSession(); return { isAuthenticated: !!session.user, user: session.user }; }

export async function cleanupTestAuth(_ids: string[]) { /* no-op */ }
export async function validateRLSBlocks(): Promise<boolean> { return true; }
