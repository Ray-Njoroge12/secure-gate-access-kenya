import { describe, it, expect } from 'vitest';

// NOTE: Original visitor flow integration tests have been removed because the Supabase backend
// and related edge function/RLS behaviors were decommissioned. This placeholder intentionally
// keeps the suite skipped while the application operates in a React-only mode with an in-memory stub.
// If visitor flow logic is reintroduced with a new backend, replace this file with new tests.
describe.skip('Phase 2 - Visitor Flows (DISABLED - Supabase removed)', () => {
  it('placeholder', () => expect(true).toBe(true));
});
