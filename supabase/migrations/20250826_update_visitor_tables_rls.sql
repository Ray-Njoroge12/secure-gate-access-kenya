-- RLS Migration for Visitor Management Tables
-- This migration sets up Row Level Security policies for invitation, visitor, and invitation_visit tables
-- to ensure proper access control for visitor management

-- Enable Row Level Security on invitation table
ALTER TABLE invitation ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Public invitations are viewable by everyone" ON invitation;
DROP POLICY IF EXISTS "Hosts can view their own invitations" ON invitation;
DROP POLICY IF EXISTS "Guards can view all invitations" ON invitation;
DROP POLICY IF EXISTS "Admins can manage all invitations" ON invitation;

-- Create a policy to allow hosts to view their own invitations
CREATE POLICY "Hosts can view their own invitations" ON invitation
  FOR SELECT USING (
    host_id = auth.uid()
  );

-- Create a policy for guards to view all invitations (for security monitoring)
CREATE POLICY "Guards can view all invitations" ON invitation
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'security_guard'
    )
  );

-- Create a policy for admins to manage all invitations
CREATE POLICY "Admins can manage all invitations" ON invitation
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Block unauthenticated access to invitations
CREATE POLICY "No anonymous access to invitations" ON invitation
  FOR ALL USING (auth.role() = 'authenticated');

-- Enable Row Level Security on visitor table
ALTER TABLE visitor ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Public visitors are viewable by everyone" ON visitor;
DROP POLICY IF EXISTS "Guards can view all visitors" ON visitor;
DROP POLICY IF EXISTS "Admins can manage all visitors" ON visitor;

-- Create a policy for guards to view all visitors
CREATE POLICY "Guards can view all visitors" ON visitor
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'security_guard'
    )
  );

-- Create a policy for admins to manage all visitors
CREATE POLICY "Admins can manage all visitors" ON visitor
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Block unauthenticated access to visitors
CREATE POLICY "No anonymous access to visitors" ON visitor
  FOR ALL USING (auth.role() = 'authenticated');

-- Enable Row Level Security on invitation_visit table
ALTER TABLE invitation_visit ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Public invitation visits are viewable by everyone" ON invitation_visit;
DROP POLICY IF EXISTS "Guards can view all invitation visits" ON invitation_visit;
DROP POLICY IF EXISTS "Admins can manage all invitation visits" ON invitation_visit;

-- Create a policy for guards to view all invitation visits
CREATE POLICY "Guards can view all invitation visits" ON invitation_visit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'security_guard'
    )
  );

-- Create a policy for admins to manage all invitation visits
CREATE POLICY "Admins can manage all invitation visits" ON invitation_visit
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Block unauthenticated access to invitation visits
CREATE POLICY "No anonymous access to invitation visits" ON invitation_visit
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance with RLS policies
CREATE INDEX IF NOT EXISTS idx_invitation_host_id ON invitation(host_id);
CREATE INDEX IF NOT EXISTS idx_invitation_status ON invitation(status);
CREATE INDEX IF NOT EXISTS idx_invitation_created ON invitation(created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_email ON visitor(email);
CREATE INDEX IF NOT EXISTS idx_invitation_visit_created ON invitation_visit(created_at);

-- Create a view for hosts to see their own invitations
CREATE OR REPLACE VIEW host_invitations_view AS
SELECT id, visitor_email, status, created_at
FROM invitation
WHERE host_id = auth.uid();

-- Grant select on the host view
GRANT SELECT ON host_invitations_view TO authenticated;

-- Create a view for guards to see active invitations
CREATE OR REPLACE VIEW guard_active_invitations_view AS
SELECT i.id, i.visitor_email, i.status, i.created_at, p.full_name as host_name
FROM invitation i
LEFT JOIN profiles p ON i.host_id = p.user_id
WHERE i.status = 'PENDING'
AND EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'security_guard'
);

-- Grant select on the guard view
GRANT SELECT ON guard_active_invitations_view TO authenticated;

-- Create a view for admins to see all visitor activity
CREATE OR REPLACE VIEW admin_visitor_activity_view AS
SELECT iv.id, v.email as visitor_email, i.visitor_email as invited_email, 
       i.status, iv.created_at as visit_time, p.full_name as host_name
FROM invitation_visit iv
JOIN invitation i ON iv.invitation_id = i.id
JOIN visitor v ON iv.visitor_id = v.id
LEFT JOIN profiles p ON i.host_id = p.user_id
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'
);

-- Grant select on the admin view
GRANT SELECT ON admin_visitor_activity_view TO authenticated;

-- Log the migration
COMMENT ON TABLE invitation IS 'RLS policies applied: Hosts can view own, Guards can view all, Admins can manage all';
COMMENT ON TABLE visitor IS 'RLS policies applied: Guards can view all, Admins can manage all';
COMMENT ON TABLE invitation_visit IS 'RLS policies applied: Guards can view all, Admins can manage all';
