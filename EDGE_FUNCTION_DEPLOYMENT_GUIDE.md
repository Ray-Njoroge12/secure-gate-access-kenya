# Edge Function Manual Deployment Guide

## Issue
The MCP deployment for edge functions is failing with 400/500 errors. Manual deployment through Supabase Dashboard is required.

## Steps to Deploy Edge Functions

### 1. Access Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Navigate to your project: `fwacwevimpifqvwpxquq`
- Go to: Edge Functions section

### 2. Deploy generate-access-code Function
1. Click "New Function" or find existing `generate-access-code`
2. Copy the content from: `supabase/functions/generate-access-code/index.ts`
3. Paste into the editor
4. Click "Deploy"

### 3. Deploy send-invitation-email Function  
1. Click "New Function" or find existing `send-invitation-email`
2. Copy the content from: `supabase/functions/send-invitation-email/index.ts`
3. Paste into the editor
4. Click "Deploy"

### 4. Test Functions
After deployment, test the functions:
- generate-access-code: Should return 200 with access code data
- send-invitation-email: Should return 200 with success message

### Expected Results
- Both functions should return 2xx status codes instead of 400/500
- Tests should pass: "should generate access code via edge function" and "should send invitation email via edge function"
- Overall test pass rate should improve from 38% to ~54% (7/13 tests passing)

## Current Test Status
- **Before Edge Function Fix**: 5/13 tests passing (38%)
- **After Edge Function Fix**: Expected 7/13 tests passing (54%)
- **Remaining Issues**: 6 tests related to invitation flow and user permissions

## Next Steps After Manual Deployment
1. Run test validation to confirm improved pass rate
2. Address remaining invitation flow issues
3. Proceed with Phase 4 Security Hardening
