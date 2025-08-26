-- RLS Migration for API Keys Table
-- This migration sets up Row Level Security policies for the api_keys table
-- to protect sensitive API key data

-- Enable Row Level Security on api_keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Public API keys are viewable by everyone" ON api_keys;
DROP POLICY IF EXISTS "Admins can manage all API keys" ON api_keys;
DROP POLICY IF EXISTS "No anonymous access to API keys" ON api_keys;

-- Create a policy for admins to manage all API keys
CREATE POLICY "Admins can manage all API keys" ON api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Block all other access completely (including authenticated non-admins)
CREATE POLICY "No access to API keys except admins" ON api_keys
  FOR ALL USING (false); -- Completely block access by default

-- Override the block policy for admins (this is handled by the admin policy above)
-- The admin policy takes precedence due to more specific conditions

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_keys_name ON api_keys(name);
CREATE INDEX IF NOT EXISTS idx_api_keys_created ON api_keys(created_at);

-- Create a secure view for admins to see API keys (without exposing the full key)
CREATE OR REPLACE VIEW admin_api_keys_view AS
SELECT id, name, LEFT(key, 8) || '...' as key_preview, created_at
FROM api_keys
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'
);

-- Grant select on the admin view
GRANT SELECT ON admin_api_keys_view TO authenticated;

-- Log the migration
COMMENT ON TABLE api_keys IS 'RLS policies applied: Only admins can manage API keys, complete block for others';
