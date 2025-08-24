# Comprehensive Testing Plan for Authentication and Visitor Management

## Issue Analysis
The integration tests are failing due to missing Supabase environment variables. The tests require:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)

## Plan

### 1. Environment Setup Verification
- [ ] Check if environment variables are properly set
- [ ] Create a test script to verify Supabase connection
- [ ] Ensure Supabase instance is running and accessible

### 2. Test Configuration
- [ ] Review test setup in `vitest.setup.ts`
- [ ] Check if test environment variables are loaded correctly
- [ ] Verify that the Supabase client can connect

### 3. Edge Function Testing
- [ ] Test edge functions individually to isolate issues
- [ ] Verify edge function deployment status
- [ ] Check edge function environment variables

### 4. Database Setup
- [ ] Ensure database migrations are applied
- [ ] Verify that test data can be created
- [ ] Check Row Level Security (RLS) policies

### 5. Authentication Flow Testing
- [ ] Test user sign-up and sign-in flows
- [ ] Verify role-based access control
- [ ] Test session management

## Required Environment Variables
Based on the BUILD_GUIDE.md, the following environment variables are required:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
VITE_APP_URL=http://localhost:5173
```

## Steps to Resolve

1. **Set up environment variables** in `.env.local`:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

2. **Verify Supabase connection**:
   ```bash
   npm run test:env
   ```

3. **Run database setup**:
   ```bash
   npm run db:setup:test
   npm run db:migrate
   ```

4. **Run individual tests** to isolate issues:
   ```bash
   npm run test:integration -- tests/integration/auth-baseline.test.ts
   npm run test:integration -- tests/integration/visitor-management.test.ts
   ```

## Expected Test Behavior
- Authentication tests should create users and validate sessions
- Visitor management tests should create visitors and test check-in/check-out flows
- Edge function tests should return successful responses
- RLS tests should validate proper access control

## Follow-up Actions
- Document any additional environment variables needed
- Create troubleshooting guide for common test failures
- Set up automated test environment validation
