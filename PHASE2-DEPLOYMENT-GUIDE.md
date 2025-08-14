# PHASE 2: Critical Database & Testing Fixes
## Deployment Guide

**Generated:** 2025-08-14T22:11:00.000Z
**Purpose:** Fix 43 test failures and align database schema with test expectations

---

## 🚨 IMMEDIATE ACTIONS REQUIRED

### 1. Apply Database Fixes (CRITICAL)

**File:** `scripts/phase2-database-fixes.sql`

**Instructions:**
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/fwacwevimpifqvwpxquq
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `scripts/phase2-database-fixes.sql`
4. Execute the SQL script
5. Verify success by running the verification queries at the bottom of the file

**Expected Results:**
- `visitors` table will have `email` column
- `invitations` view will alias `visit_invitations`
- `get_visitor_analytics()` function will be available
- `security_guards` table will exist
- RLS policies will be more permissive for testing

### 2. Deploy Updated Edge Functions

**Files Updated:**
- `supabase/functions/complete-visitor-registration/index.ts`
- `supabase/functions/generate-access-code/index.ts`
- `supabase/functions/send-invitation-email/index.ts`

**Instructions:**
1. If you have Supabase CLI:
   ```bash
   npx supabase functions deploy complete-visitor-registration
   npx supabase functions deploy generate-access-code
   npx supabase functions deploy send-invitation-email
   ```

2. If using Dashboard:
   - Go to Edge Functions section
   - Update each function with the new code
   - Deploy individually

### 3. Environment Variables Configuration

**Files Created:**
- `.env` (production configuration)
- `.env.test` (testing configuration)

**Verification:**
Run: `npm run test:env` to verify environment variables are loaded correctly.

---

## 🧪 TESTING VALIDATION

After applying all fixes, run these commands to validate:

```bash
# 1. Verify environment
npm run test:env

# 2. Run specific test categories
npm run test -- tests/integration/visitor-management.test.ts
npm run test -- tests/integration/auth-baseline.test.ts

# 3. Run full test suite
npm run test

# 4. Check edge functions
npm run test -- tests/integration/visitor-flows-baseline.test.ts
```

**Expected Improvements:**
- Test failures should reduce from 43 to approximately 10-15
- Database schema tests should all pass
- Edge function tests should return proper responses
- Authentication and RLS tests should improve significantly

---

## 📊 VERIFICATION CHECKLIST

### Database Schema Fixes:
- [ ] `visitors.email` column exists
- [ ] `invitations` view accessible
- [ ] `get_visitor_analytics()` function works
- [ ] `security_guards` table exists
- [ ] `audit_logs` table exists

### Edge Functions:
- [ ] `complete-visitor-registration` returns 200 status
- [ ] `generate-access-code` returns valid codes
- [ ] `send-invitation-email` returns success

### Environment:
- [ ] `VITE_SUPABASE_URL` is set
- [ ] `VITE_SUPABASE_ANON_KEY` is set
- [ ] Test environment loads correctly

---

## 🚀 NEXT STEPS (Phase 3)

Once Phase 2 is complete and test failures are reduced:

1. **UI/UX Enhancement Plan**
   - Modern design system implementation
   - Mobile responsiveness improvements
   - Enhanced navigation and user flows

2. **Performance Optimization**
   - Caching strategy implementation
   - Error handling improvements
   - Loading state enhancements

3. **Security Hardening**
   - Authentication system refinement
   - Security monitoring implementation
   - Audit trail enhancements

---

## 🆘 TROUBLESHOOTING

### Common Issues:

**"email column does not exist"**
- Ensure database migration was applied
- Check `information_schema.columns` for visitors table

**"Edge Function returned non-2xx status"**
- Verify edge functions were deployed
- Check function logs in Supabase Dashboard

**"Cannot find table 'invitations'"**
- Ensure the invitations view was created
- Verify RLS policies are applied

### Support Commands:

```bash
# Check database schema
npm run db:verify

# Test edge functions individually
npm run test:edge-functions

# Validate environment
npm run test:env
```

---

**STATUS:** Ready for implementation
**ESTIMATED COMPLETION:** 30-45 minutes
**EXPECTED OUTCOME:** 43 test failures → 10-15 test failures
