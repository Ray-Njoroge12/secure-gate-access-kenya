-- RLS Migration for Users Table
-- This migration sets up Row Level Security policies for the users table
-- to protect sensitive authentication data

-- Enable Row Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can view their own account" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "No anonymous access to users" ON users;

-- Create a policy to allow users to view their own account (limited fields)
CREATE POLICY "Users can view their own account" ON users
  FOR SELECT USING (
    id = auth.uid()
  );

-- Create a policy for admins to manage all users
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Block unauthenticated access completely
CREATE POLICY "No anonymous access to users" ON users
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance with RLS policies
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

-- Create a secure view for users to see only their own basic info
CREATE OR REPLACE VIEW user_own_account_view AS
SELECT id, email, created_at
FROM users
WHERE id = auth.uid();

-- Grant select on the user view
GRANT SELECT ON user_own_account_view TO authenticated;

-- Create a view for admins to see all users (without sensitive password data)
CREATE OR REPLACE VIEW admin_users_view AS
SELECT u.id, u.email, u.created_at, p.full_name, p.role
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'
);

-- Grant select on the admin view
GRANT SELECT ON admin_users_view TO authenticated;

-- Log the migration
COMMENT ON TABLE users IS 'RLS policies applied: Users can view own account, Admins can manage all, No anonymous access';
