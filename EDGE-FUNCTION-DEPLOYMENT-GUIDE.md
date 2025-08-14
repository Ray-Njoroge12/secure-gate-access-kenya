# Edge Function Deployment Guide

## Manual Deployment Required

The automated edge function deployment is experiencing issues. Please deploy manually via Supabase Dashboard:

### 1. Generate Access Code Function

**File**: `supabase/functions/generate-access-code/index.ts`

1. Go to Supabase Dashboard → Edge Functions
2. Create/Update function: `generate-access-code`
3. Copy the content from `supabase/functions/generate-access-code/index.ts`
4. Deploy the function

### 2. Send Invitation Email Function

**File**: `supabase/functions/send-invitation-email/index.ts`

1. Go to Supabase Dashboard → Edge Functions  
2. Create/Update function: `send-invitation-email`
3. Copy the content from `supabase/functions/send-invitation-email/index.ts`
4. Deploy the function

### Expected Impact

After deployment, this should resolve 2 failing tests:
- ✅ Edge Functions > should generate access code via edge function
- ✅ Edge Functions > should send invitation email via edge function

This will improve our test pass rate from 31% (4/13) to 46% (6/13).

### Verification

Run the integration tests after deployment:
```bash
npm run test -- tests/integration/visitor-management.test.ts --reporter=basic
```

The edge function tests should now pass, showing 200 status codes instead of 400/500 errors.
