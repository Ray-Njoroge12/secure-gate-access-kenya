import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(() => ({ data: [], error: null })),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  })),
}));

vi.mock('@/integrations/supabase/client', async () => {
  const actual = await vi.importActual('@supabase/supabase-js');
  return {
    supabase: (actual as typeof import('@supabase/supabase-js')).createClient('http://localhost', 'mock-key'),
  };
});