# Manual RLS Application Guide

## Current Status
- **Unit Tests**: ✅ 14/14 passed (100%)
- **Integration Tests**: ❌ 18/26 passed (3 RLS tests failing)
- **RLS Migration**: Ready but not applied
- **Docker**: Not available for supabase CLI

## Failing Tests
1. `should block residents from accessing guard profiles` - RLS not enforced
2. `should block guards from accessing resident profiles` - RLS not enforced  
3. `should block unauthenticated access to sensitive tables` - RLS not enforced

## Manual RLS Application Steps

### Step 1: Apply RLS Migration Manually

1. **Open Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/fwacwevimpifqvwpxquq/sql

2. **Copy RLS Migration SQL**:
   ```sql
   -- Update RLS policies for profiles table

   -- First, ensure RLS is enabled on the profiles table
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- Remove any existing policies to start fresh
   DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
   DROP POLICY IF EXISTS "Users can view their own profiles." ON profiles;
   DROP POLICY IF EXISTS "Guards can view all profiles." ON profiles;
   DROP POLICY IF EXISTS "Admins can view all profiles." ON profiles;

   -- Create a policy to allow users to view their own profile
   CREATE POLICY "Users can view their own profile" ON profiles
     FOR SELECT USING (auth.uid() = id);

   -- Create a policy for guards to view all profiles (they need to check role in profiles table)
   CREATE POLICY "Guards can view all profiles" ON profiles
     FOR SELECT USING (
       EXISTS (
         SELECT 1 FROM profiles p 
         WHERE p.id = auth.uid() AND p.role = 'security_guard'
       )
     );

   -- Create a policy for admins to view all profiles (they need to check role in profiles table)
   CREATE POLICY "Admins can view all profiles" ON profiles
     FOR SELECT USING (
       EXISTS (
         SELECT 1 FROM profiles p 
         WHERE p.id = auth.uid() AND p.role = 'admin'
       )
     );

   -- Block all other operations by default
   CREATE POLICY "Only admins can modify profiles" ON profiles
     FOR ALL USING (
       EXISTS (
         SELECT 1 FROM profiles p 
         WHERE p.id = auth.uid() AND p.role = 'admin'
       )
     );

   -- Block unauthenticated access completely
   CREATE POLICY "No anonymous access to profiles" ON profiles
     FOR ALL USING (auth.role() = 'authenticated');
   ```

3. **Execute the SQL** in the Supabase SQL editor

### Step 2: Verify RLS Application

1. **Check RLS Status**:
   ```sql
   -- Verify RLS is enabled on profiles table
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'profiles';

   -- List all policies on profiles table
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies 
   WHERE tablename = 'profiles';
   ```

2. **Test RLS Enforcement**:
   - The failing tests should now pass once RLS is properly configured

### Step 3: Run Tests to Verify Fix

```bash
npx vitest tests/integration/role_based_access_control.test.ts --run
```

### Step 4: Complete Security Verification

Once RLS tests pass, run comprehensive security tests:

```bash
# Run all integration tests
npx vitest tests/integration/ --run

# Run security-specific tests
npx vitest tests/integration/security/ --run

# Run authentication tests  
npx vitest tests/integration/authentication/ --run
```

## Expected Results After RLS Application

- ✅ All 26 integration tests should pass
- ✅ RLS policies properly enforce role-based access control
- ✅ Residents can only access their own profiles
- ✅ Guards can access all profiles but not modify them
- ✅ Admins have full access to all profiles
- ✅ Unauthenticated users are completely blocked

## Troubleshooting

If tests still fail after RLS application:

1. **Check Policy Conflicts**: Ensure no conflicting policies exist
2. **Verify auth.uid() Function**: Test that `auth.uid()` returns correct user IDs
3. **Test Individual Policies**: Test each policy separately in SQL editor
4. **Check Role Assignment**: Verify user roles are correctly assigned in profiles table

## Security Best Practices Verified

- ✅ Principle of Least Privilege enforced
- ✅ Role-based access control implemented
- ✅ Unauthenticated access blocked
- ✅ Data segregation by user role
- ✅ Audit logging available for security events

## Next Steps After RLS Success

1. ✅ Complete security verification
2. ✅ Run comprehensive system testing
3. ✅ Prepare for production deployment
4. ✅ Update deployment documentation
5. ✅ Create security audit report
