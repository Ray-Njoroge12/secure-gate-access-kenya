import '@testing-library/jest-dom/vitest';
import fs from 'fs';
import path from 'path';
import { vi } from 'vitest';

// In-memory minimal Supabase-like stub to eliminate real network calls.
type Row = Record<string, any>;
interface TableStore { [table: string]: Row[] }
const store: TableStore = {};

function buildQuery(table: string) {
  let rows = store[table] || (store[table] = []);
  const filters: ((r: Row) => boolean)[] = [];
  const apply = () => rows.filter(r => filters.every(f => f(r)));
  const builder: any = {
    select(_cols?: string) { return builder; },
    insert(values: Row | Row[]) { const arr = Array.isArray(values) ? values : [values]; rows.push(...arr); return { data: arr, error: null }; },
    update(values: Row) { apply().forEach(r => Object.assign(r, values)); return { data: apply(), error: null }; },
    delete() { const current = apply(); store[table] = rows = rows.filter(r => !current.includes(r)); return { data: current, error: null }; },
    eq(field: string, value: any) { filters.push(r => r[field] === value); return builder; },
    order(_field: string, _opts?: any) { return builder; },
    limit(_n: number) { return builder; },
    single: async () => ({ data: apply()[0] || null, error: null }),
    then: (resolve: any, reject: any) => { try { resolve({ data: apply(), error: null }); } catch (e) { reject(e); } }
  };
  return builder;
}

const session = { user: { id: 'stub-user', role: 'resident', email: 'stub@example.com' } };

function makeClient() {
  return {
    from: (table: string) => buildQuery(table),
    auth: {
      signUp: async () => ({ data: { user: session.user, session }, error: null }),
      signInWithPassword: async () => ({ data: { user: session.user, session }, error: null }),
      getSession: async () => ({ data: { session }, error: null }),
      signOut: async () => ({ error: null })
    },
    functions: { invoke: async () => ({ data: { ok: true }, error: null }) },
    rpc: async () => ({ data: null, error: null })
  };
}

// Global mock for any import of @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, _key: string) => makeClient()
}));

// Minimal env file loader (avoids adding dotenv dependency while npm is unstable)
function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (!process.env[key] && val) process.env[key] = val;
  });
}

loadEnvFile(path.resolve('.env.local'));
loadEnvFile(path.resolve('.env'));

const isUnitTest = process.env.UNIT_TESTS === '1';
const isIntegration = process.env.INTEGRATION_TESTS === '1';

if (process.env.DEBUG_TESTS) {
  const mask = (v?: string) => v ? v.substring(0, 6) + '…' : 'missing';
   
  console.log('[vitest.setup] ENV loaded: URL=', mask(process.env.VITE_SUPABASE_URL), ' ANON=', mask(process.env.VITE_SUPABASE_ANON_KEY), ' SRV=', mask(process.env.SUPABASE_SERVICE_ROLE_KEY));
   
  console.log('[vitest.setup] Mode:', isIntegration ? 'INTEGRATION' : isUnitTest ? 'UNIT/MOCK' : 'DEFAULT');
}

console.log('[vitest.setup] Using in-memory Supabase stub (no network calls)');