# Backend Migration Plan (Supabase -> Express + Postgres/Prisma)

## Overview
This document tracks incremental migration from the in-browser Supabase stub to a real Express + Postgres API powered by Prisma.

## Phases
1. Scaffold (DONE)
   - Added dependencies: express, cors, jsonwebtoken, bcryptjs, @prisma/client, prisma
   - Added prisma schema (initial pass)
   - Added server entry with health route
   - Added core routes: /api/access-codes, /api/invitations, /api/2fa
2. Database Bring-up (PENDING)
   - Provision Postgres (local Docker or managed)
   - Set DATABASE_URL in .env.local
   - Run: npx prisma migrate dev --name init
3. Frontend Adapter Layer (PENDING)
   - Create src/lib/apiClient.ts wrapping fetch to new endpoints
   - Replace supabase.functions.invoke usages:
     - generate-access-code -> POST /api/access-codes/generate
     - verify-access-code -> POST /api/access-codes/verify
     - create-invitation -> POST /api/invitations
     - manage-2fa -> POST /api/2fa/setup|enable|disable
   - Replace basic supabase.from(...) reads with dedicated REST endpoints or keep stub until parity achieved
4. Auth (PENDING)
   - Issue JWT on sign-in (temporary static user for dev)
   - Protect state-changing routes with middleware
5. Data Parity & Extra Tables (PENDING)
   - Implement endpoints for: profiles, visitors, access_logs listing, security_incidents, api_keys, webhooks
6. Remove Stub (PENDING)
   - Delete src/integrations/supabase/client.ts
   - Rip out supabase import usages
7. Cleanup & Hardening (PENDING)
   - Validation with zod
   - Error normalization
   - Rate limiting, logging, CORS tightening
8. Testing Adjustments (PENDING)
   - Add server start/stop helper in tests
   - Convert invoke call mocks -> REST mocks (msw or fetch spy)
   - Add integration tests hitting Express app directly
9. Lint Tightening (PENDING)
   - Re-enable stricter rules, remove remaining any

## Immediate Next Steps
- Provision Postgres & run first migration.
- Implement apiClient + update one feature (access code generation/verification) to verify E2E path.
- Commit and run tests adjusting affected components.

## Notes
Schema is minimal; will evolve as more tables are ported. TwoFASetting added to replicate user_2fa_settings usage. InvitationVisit join model anticipates visitor-invitation relations.
