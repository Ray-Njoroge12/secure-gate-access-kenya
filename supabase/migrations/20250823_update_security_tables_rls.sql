-- RLS Migration for Security-Related Tables
-- This migration sets up Row Level Security policies for access_logs and security_incidents tables
-- to ensure proper security auditing and incident management

-- Enable Row Level Security on access_logs table
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Public access logs are viewable by everyone" ON access_logs;
DROP POLICY IF EXISTS "Guards can view access logs" ON access_logs;
DROP POLICY IF EXISTS "Admins can manage access logs" ON access_logs;

-- Create a policy for guards to view access logs (for monitoring purposes)
CREATE POLICY "Guards can view access logs" ON access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'security_guard'
    )
  );

-- Create a policy for admins to manage all access logs
CREATE POLICY "Admins can manage all access logs" ON access_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Block unauthenticated access to access logs
CREATE POLICY "No anonymous access to access logs" ON access_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Enable Row Level Security on security_incidents table
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Public security incidents are viewable by everyone" ON security_incidents;
DROP POLICY IF EXISTS "Guards can view security incidents" ON security_incidents;
DROP POLICY IF EXISTS "Admins can manage security incidents" ON security_incidents;

-- Create a policy for guards to view security incidents
CREATE POLICY "Guards can view security incidents" ON security_incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'security_guard'
    )
  );

-- Create a policy for admins to manage all security incidents
CREATE POLICY "Admins can manage all security incidents" ON security_incidents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Block unauthenticated access to security incidents
CREATE POLICY "No anonymous access to security incidents" ON security_incidents
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance with RLS policies
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_incidents_created ON security_incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(type);

-- Create a view for guards to see recent access logs
CREATE OR REPLACE VIEW guard_recent_access_logs_view AS
SELECT al.id, ac.code, al.method, al.created_at
FROM access_logs al
JOIN access_codes ac ON al.access_code_id = ac.id
WHERE al.created_at > NOW() - INTERVAL '24 hours'
AND EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'security_guard'
);

-- Grant select on the guard view
GRANT SELECT ON guard_recent_access_logs_view TO authenticated;

-- Create a view for admins to see all security incidents
CREATE OR REPLACE VIEW admin_security_incidents_view AS
SELECT id, type, details, created_at
FROM security_incidents
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'
);

-- Grant select on the admin view
GRANT SELECT ON admin_security_incidents_view TO authenticated;

-- Create a view for guards to see active security incidents
CREATE OR REPLACE VIEW guard_active_incidents_view AS
SELECT id, type, details, created_at
FROM security_incidents
WHERE created_at > NOW() - INTERVAL '24 hours'
AND EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'security_guard'
);

-- Grant select on the guard incidents view
GRANT SELECT ON guard_active_incidents_view TO authenticated;

-- Log the migration
COMMENT ON TABLE access_logs IS 'RLS policies applied: Guards can view, Admins can manage, No anonymous access';
COMMENT ON TABLE security_incidents IS 'RLS policies applied: Guards can view, Admins can manage, No anonymous access';
