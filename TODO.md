# Supabase Migration Plan

## Phase 1: Backend Implementation
- [ ] Implement `/api/auth` routes for login and signup (JWT issuance)
- [ ] Implement `/api/profiles` routes for user profile management
- [ ] Implement `/api/visitors` routes for visitor data
- [ ] Implement `/api/access-logs` routes for access logging
- [ ] Implement `/api/incidents` routes for incident management
- [ ] Implement `/api/analytics` routes for analytics data
- [ ] Implement utility routes for encryption and compliance

## Phase 2: Frontend Migration
- [ ] Update `AuthForm.tsx` to use new API client for authentication
- [ ] Replace all `supabase.from()` calls with API client calls
- [ ] Update `useAuthSession.ts` to work with JWT-based authentication
- [ ] Remove Supabase client stub and adjust imports

## Phase 3: Testing
- [ ] Update existing tests to use new API endpoints
- [ ] Ensure all tests pass after migration
- [ ] Remove Supabase mocks from tests

## Phase 4: Cleanup
- [ ] Remove Supabase directory and references
- [ ] Clean up environment variables in `.env.example`
- [ ] Update documentation to reflect changes

## Phase 5: Verification
- [ ] Run comprehensive tests to ensure functionality
- [ ] Verify that all Supabase references are removed
- [ ] Ensure the application works without Supabase
