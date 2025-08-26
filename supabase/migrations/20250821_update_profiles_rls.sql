-- RLS Migration for Profiles Table
-- This migration sets up Row Level Security policies for the profiles table
-- to enforce role-based access control in the PostgreSQL database

-- Enable Row Level Security on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON profiles;
DROP POLICY IF EXISTS "Guards can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Only admins can modify profiles" ON profiles;
DROP POLICY IF EXISTS "No anonymous access to profiles" ON profiles;

-- Create a policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create a policy for guards to view all profiles
CREATE POLICY "Guards can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'security_guard'
    )
  );

-- Create a policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Block all other operations by default - only admins can modify
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

-- Create indexes for better performance with RLS policies
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON profiles(id, role);

-- Create function to check user role (for use in RLS policies)
CREATE OR REPLACE FUNCTION public.check_user_role(required_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.check_user_role TO authenticated;

-- Create a view for admins to see all profiles with role information
CREATE OR REPLACE VIEW admin_profiles_view AS
SELECT id, email, full_name, unit_number, phone, role, created_at
FROM profiles
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'
);

-- Grant select on the admin view
GRANT SELECT ON admin_profiles_view TO authenticated;

-- Create a view for users to see only their own profile
CREATE OR REPLACE VIEW user_own_profile_view AS
SELECT id, email, full_name, unit_number, phone, role, created_at
FROM profiles
WHERE id = auth.uid();

-- Grant select on the user view
GRANT SELECT ON user_own_profile_view TO authenticated;

-- Log the migration
COMMENT ON TABLE profiles IS 'RLS policies applied: Users can view own profile, Guards/Admins can view all, Only admins can modify';
