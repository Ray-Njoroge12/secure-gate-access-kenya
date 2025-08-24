# Troubleshooting Guide for Test Failures

## Common Issues and Solutions

### 1. Missing Environment Variables

**Symptoms:**
- Tests fail with connection errors
- "Missing Supabase environment variables" errors
- Authentication failures

**Solution:**
1. Create or update your `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   VITE_APP_URL=http://localhost:5173
   ```

3. Verify environment setup:
   ```bash
   npm run verify:env
   ```

### 2. Database Connection Issues

**Symptoms:**
- "Connection refused" errors
- Database timeout errors
- RLS (Row Level Security) permission errors

**Solution:**
1. Ensure your Supabase instance is running
2. Check database migrations:
   ```bash
   npm run db:migrate
   ```

3. Reset test database (if needed):
   ```bash
   npm run db:setup:test
   ```

### 3. Edge Function Deployment Issues

**Symptoms:**
- Edge function tests failing
- "Function not found" errors
- 404 responses from edge functions

**Solution:**
1. Deploy edge functions:
   ```bash
   supabase functions deploy
   ```

2. Verify function URLs are accessible
3. Check function environment variables

### 4. Authentication Flow Issues

**Symptoms:**
- User creation failures
- Session management errors
- Role-based access failures

**Solution:**
1. Test authentication helpers:
   ```bash
   npm run test:integration -- tests/integration/auth-baseline.test.ts
   ```

2. Check user roles in database
3. Verify RLS policies

## Step-by-Step Test Recovery

### Quick Start
1. **Set up environment:**
   ```bash
   npm run verify:env
   ```

2. **Run database setup:**
   ```bash
   npm run db:setup:test
   npm run db:migrate
   ```

3. **Run individual test suites:**
   ```bash
   # Test authentication
   npm run test:integration -- tests/integration/auth-baseline.test.ts
   
   # Test visitor management
   npm run test:integration -- tests/integration/visitor-management.test.ts
   
   # Test edge functions
   npm run test:integration -- tests/integration/edge-functions.test.ts
   ```

4. **Run all integration tests:**
   ```bash
   npm run test:integration
   ```

## Debugging Tips

### Enable Debug Mode
```bash
DEBUG_TESTS=1 npm run test:integration
```

### Check Environment Variables
```bash
# List all environment variables
node -e "console.log(process.env)"
```

### Test Supabase Connection Manually
```bash
node scripts/verify-test-environment.js
```

## Common Error Messages

### "Permission denied for table"
- **Cause**: RLS policies blocking access
- **Fix**: Use service role key for admin operations

### "Network error"
- **Cause**: Incorrect Supabase URL or network issues
- **Fix**: Verify VITE_SUPABASE_URL is correct

### "Invalid API key"
- **Cause**: Wrong Supabase key
- **Fix**: Check VITE_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY

## Support Resources

- Check the BUILD_GUIDE.md for setup instructions
- Review test logs for specific error details
- Verify Supabase project settings in dashboard
- Check network connectivity to Supabase

## Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy:
   - Project URL (VITE_SUPABASE_URL)
   - anon/public key (VITE_SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)

Remember: Never commit actual credentials to version control. Use `.env.local` for local development and set environment variables in your deployment platform.
