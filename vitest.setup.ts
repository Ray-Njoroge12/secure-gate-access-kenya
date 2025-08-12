import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import fs from 'fs';
import path from 'path';

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

const isIntegration = process.env.INTEGRATION_TESTS === '1';

if (process.env.DEBUG_TESTS) {
  const mask = (v?: string) => v ? v.substring(0, 6) + '…' : 'missing';
  // eslint-disable-next-line no-console
  console.log('[vitest.setup] ENV loaded: URL=', mask(process.env.VITE_SUPABASE_URL), ' ANON=', mask(process.env.VITE_SUPABASE_ANON_KEY), ' SRV=', mask(process.env.SUPABASE_SERVICE_ROLE_KEY));
  // eslint-disable-next-line no-console
  console.log('[vitest.setup] Mode:', isIntegration ? 'INTEGRATION' : 'UNIT/MOCK');
}

if (!isIntegration) {
  // Only mock for unit tests; allow real Supabase client in integration runs
  vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        admin: { createUser: vi.fn(() => ({ data: { user: { id: 'mock-user-id', email: 'mock@example.com' } }, error: null })) }
      },
      functions: {
        invoke: vi.fn(),
      },
      from: vi.fn(() => ({
        insert: vi.fn(() => ({ select: () => ({ single: () => ({ data: {}, error: null }) }) })),
        select: vi.fn(() => ({ data: [], error: null })),
        update: vi.fn(() => ({ eq: () => ({ }) })),
        delete: vi.fn(() => ({ in: () => ({}) })),
        eq: vi.fn(() => ({ single: () => ({ data: {}, error: null }) })),
      })),
    })),
  }));

  vi.mock('@/integrations/supabase/client', async () => {
    const actual = await vi.importActual('@supabase/supabase-js');
    return {
      supabase: (actual as typeof import('@supabase/supabase-js')).createClient('http://localhost', 'mock-key'),
    };
  });
}