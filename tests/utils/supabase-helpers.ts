import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Shared test clients
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Debug logging helper
export function debugLog(message: string, data?: any) {
  if (process.env.DEBUG_TESTS) {
    // eslint-disable-next-line no-console
    console.log(`[DB-Helper] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

// Test client validation
export function validateTestClients(): void {
  debugLog('Validating test clients...');
  
  // Check basic client structure
  if (!supabaseAdmin || typeof supabaseAdmin !== 'object') {
    throw new Error('supabaseAdmin is not properly initialized');
  }
  
  if (!supabaseClient || typeof supabaseClient !== 'object') {
    throw new Error('supabaseClient is not properly initialized');
  }
  
  // Check if clients have expected methods/properties
  if (typeof (supabaseAdmin as any).from !== 'function') {
    throw new Error('supabaseAdmin missing method: from');
  }
  
  if (typeof (supabaseClient as any).from !== 'function') {
    throw new Error('supabaseClient missing method: from');
  }
  
  // Functions is an object with invoke method, not a function itself
  if (!((supabaseAdmin as any).functions && typeof (supabaseAdmin as any).functions.invoke === 'function')) {
    throw new Error('supabaseAdmin.functions.invoke missing');
  }
  
  if (!((supabaseClient as any).functions && typeof (supabaseClient as any).functions.invoke === 'function')) {
    throw new Error('supabaseClient.functions.invoke missing');
  }
  
  // Auth exists on client
  if (!((supabaseClient as any).auth && typeof (supabaseClient as any).auth.signInWithPassword === 'function')) {
    throw new Error('supabaseClient.auth.signInWithPassword missing');
  }
  
  // Validate query builder methods on a sample table call
  const builder = supabaseAdmin.from('communities');
  const builderMethods = ['select', 'insert', 'update', 'delete'];
  
  for (const method of builderMethods) {
    if (typeof (builder as any)[method] !== 'function') {
      throw new Error(`Query builder missing method: ${method} (possible mock leakage)`);
    }
  }
  
  debugLog('✅ Test clients validation passed (basic structure confirmed)');
}

// Simple assertion helper
export function assertSuccess(result: any, operation: string): void {
  if (result.error) {
    debugLog(`❌ ${operation} failed:`, result.error);
    throw new Error(`${operation} failed: ${JSON.stringify(result.error)}`);
  }
  
  if (!result.data) {
    debugLog(`❌ ${operation} returned no data`);
    throw new Error(`${operation} returned no data`);
  }
  
  debugLog(`✅ ${operation} succeeded`);
}

// Simple cleanup helper
export async function cleanupTestData(entityIds: { [table: string]: string[] }): Promise<void> {
  debugLog('Starting test data cleanup...', entityIds);
  
  const tables = Object.keys(entityIds).reverse(); // Delete in reverse dependency order
  
  for (const table of tables) {
    const ids = entityIds[table];
    if (ids.length > 0) {
      try {
        const result = await supabaseAdmin.from(table).delete().in('id', ids);
        debugLog(`Cleaned up ${table}:`, result);
      } catch (err) {
        console.warn(`⚠️ Failed to cleanup ${table}:`, err);
      }
    }
  }
  
  debugLog('Test data cleanup completed');
}

// Environment validation
export function validateTestEnvironment(): void {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (!SUPABASE_URL.startsWith('http')) {
    throw new Error(`Invalid SUPABASE_URL format: ${SUPABASE_URL}`);
  }
  
  debugLog('✅ Test environment validation passed');
}
