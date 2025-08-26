-- RLS Migration for Remaining Tables
-- This migration sets up Row Level Security policies for webhook and twofa_setting tables

-- Enable Row Level Security on webhook table
ALTER TABLE webhook ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Public webhooks are viewable by everyone" ON webhook;
DROP POLICY IF EXISTS "Admins can manage all webhooks" ON webhook;
DROP POLICY IF EXISTS "No anonymous access to webhooks" ON webhook;

-- Create a policy for admins to manage all webhooks
CREATE POLICY "Admins can manage all webhooks" ON webhook
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Block all other access completely
CREATE POLICY "No access to webhooks except admins" ON webhook
  FOR ALL USING (false);

-- Enable Row Level Security on twofa_setting table
ALTER TABLE twofa_setting ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Public 2FA settings are viewable by everyone" ON twofa_setting;
DROP POLICY IF EXISTS "Users can manage their own 2FA settings" ON twofa_setting;
DROP POLICY IF EXISTS "Admins can manage all 2FA settings" ON twofa_setting;

-- Create a policy to allow users to manage their own 2FA settings
CREATE POLICY "Users can manage their own 2FA settings" ON twofa_setting
  FOR ALL USING (
    user_id = auth.uid()
  );

-- Create a policy for admins to manage all 2FA settings (for support purposes)
CREATE POLICY "Admins can manage all 2FA settings" ON twofa_setting
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Block unauthenticated access to 2FA settings
CREATE POLICY "No anonymous access to 2FA settings" ON twofa_setting
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance with RLS policies
CREATE INDEX IF NOT EXISTS idx_webhook_url ON webhook(url);
CREATE INDEX IF NOT EXISTS idx_webhook_active ON webhook(active);
CREATE INDEX IF NOT EXISTS idx_twofa_setting_user_id ON twofa_setting(user_id);
CREATE INDEX IF NOT EXISTS idx_twofa_setting_enabled ON twofa_setting(enabled);

-- Create a view for admins to see webhook configurations
CREATE OR REPLACE VIEW admin_webhooks_view AS
SELECT id, url, active, created_at
FROM webhook
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'
);

-- Grant select on the admin view
GRANT SELECT ON admin_webhooks_view TO authenticated;

-- Create a view for users to see their own 2FA status (without exposing the secret)
CREATE OR REPLACE VIEW user_twofa_status_view AS
SELECT enabled, created_at, updated_at
FROM twofa_setting
WHERE user_id = auth.uid();

-- Grant select on the user view
GRANT SELECT ON user_twofa_status_view TO authenticated;

-- Create a view for admins to see 2FA enrollment status across users
CREATE OR REPLACE VIEW admin_twofa_enrollment_view AS
SELECT ts.user_id, u.email, ts.enabled, ts.created_at, ts.updated_at
FROM twofa_setting ts
JOIN users u ON ts.user_id = u.id
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'
);

-- Grant select on the admin view
GRANT SELECT ON admin_twofa_enrollment_view TO authenticated;

-- Log the migration
COMMENT ON TABLE webhook IS 'RLS policies applied: Only admins can manage webhooks';
COMMENT ON TABLE twofa_setting IS 'RLS policies applied: Users can manage own, Admins can manage all';
