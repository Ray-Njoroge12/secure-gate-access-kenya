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
