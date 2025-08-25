// Local stub import (the application now runs without real Supabase)
// We re-export the single stub instance for tests to use unified helpers.
import supabase from '../../src/integrations/supabase/client';

// For backward compatibility in tests that expect both client + admin.
export const supabaseClient = supabase as any;
export const supabaseAdmin = supabase as any;

// Debug logging helper
export function debugLog(message: string, data?: any) {
  if (process.env.DEBUG_TESTS) {
     
    console.log(`[DB-Helper] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

// Test client validation
export function validateTestClients(): void {
  debugLog('Validating stub test clients...');
  // Minimal surface checks only
  if (!supabaseClient || typeof supabaseClient !== 'object') throw new Error('stub client missing');
  if (typeof (supabaseClient as any).from !== 'function') throw new Error('stub from missing');
  if (!(supabaseClient as any).functions?.invoke) throw new Error('stub functions.invoke missing');
  if (!(supabaseClient as any).auth?.signInWithPassword) throw new Error('stub auth.signInWithPassword missing');
  debugLog('✅ Stub client validation passed');
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
  // No required Supabase env vars anymore; keep a simple log for visibility.
  debugLog('Environment validation skipped (Supabase removed).');
}
