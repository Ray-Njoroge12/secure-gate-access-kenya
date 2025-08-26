-- RLS Migration for Access Codes Table
-- This migration sets up Row Level Security policies for the access_codes table
-- to enforce proper access control for gate entry codes

-- Enable Row Level Security on access_codes table
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Public access codes are viewable by everyone" ON access_codes;
DROP POLICY IF EXISTS "Residents can view their access codes" ON access_codes;
DROP POLICY IF EXISTS "Guards can view all access codes" ON access_codes;
DROP POLICY IF EXISTS "Admins can manage all access codes" ON access_codes;

-- Create a policy to allow residents to view their own access codes
-- (Assuming access codes are linked to user profiles through some mechanism)
CREATE POLICY "Residents can view their access codes" ON access_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'resident'
    )
    -- This would need to be adjusted based on how access codes are linked to users
    -- For now, this is a placeholder policy
  );

-- Create a policy for guards to view all access codes (for verification purposes)
CREATE POLICY "Guards can view all access codes" ON access_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'security_guard'
    )
  );

-- Create a policy for admins to manage all access codes
CREATE POLICY "Admins can manage all access codes" ON access_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Block unauthenticated access completely
CREATE POLICY "No anonymous access to access codes" ON access_codes
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance with RLS policies
CREATE INDEX IF NOT EXISTS idx_access_codes_used ON access_codes(used);
CREATE INDEX IF NOT EXISTS idx_access_codes_expires ON access_codes(expires_at);

-- Create a view for guards to see active access codes
CREATE OR REPLACE VIEW guard_active_access_codes_view AS
SELECT id, code, used, expires_at, created_at
FROM access_codes
WHERE used = false AND expires_at > NOW()
AND EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'security_guard'
);

-- Grant select on the guard view
GRANT SELECT ON guard_active_access_codes_view TO authenticated;

-- Create a view for admins to see all access codes with details
CREATE OR REPLACE VIEW admin_access_codes_view AS
SELECT id, code, used, expires_at, created_at
FROM access_codes
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'
);

-- Grant select on the admin view
GRANT SELECT ON admin_access_codes_view TO authenticated;

-- Log the migration
COMMENT ON TABLE access_codes IS 'RLS policies applied: Guards can view all, Admins can manage all, No anonymous access';
