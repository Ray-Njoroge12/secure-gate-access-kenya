-- Add offline access verification support
-- This enables guards to verify access codes when network is unavailable

-- Table to store cached access codes for offline verification
CREATE TABLE IF NOT EXISTS offline_access_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code TEXT NOT NULL,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  resident_id UUID REFERENCES profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_offline_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced')),
  
  -- Ensure no duplicate codes in cache
  UNIQUE(access_code)
);

-- Index for fast access code lookups
CREATE INDEX IF NOT EXISTS idx_offline_cache_code ON offline_access_cache(access_code);
CREATE INDEX IF NOT EXISTS idx_offline_cache_expires ON offline_access_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_offline_cache_sync ON offline_access_cache(sync_status);

-- RPC to populate offline cache with recent valid access codes
CREATE OR REPLACE FUNCTION populate_offline_cache()
RETURNS TABLE(cached_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cached_count INTEGER := 0;
BEGIN
  -- Clear expired cache entries first
  DELETE FROM offline_access_cache 
  WHERE expires_at < NOW();
  
  -- Insert active access codes that aren't already cached
  INSERT INTO offline_access_cache (
    access_code, 
    visitor_name, 
    visitor_phone, 
    resident_id, 
    expires_at
  )
  SELECT DISTINCT
    ac.code,
    COALESCE(v.name, vi.visitor_name) as visitor_name,
    COALESCE(v.phone, vi.visitor_phone) as visitor_phone,
    vi.resident_id,
    ac.expires_at
  FROM access_codes ac
  LEFT JOIN visit_invitations vi ON ac.invitation_id = vi.id
  LEFT JOIN visitors v ON vi.visitor_id = v.id
  WHERE ac.expires_at > NOW()
    AND ac.used_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM offline_access_cache oac 
      WHERE oac.access_code = ac.code
    )
  ON CONFLICT (access_code) DO NOTHING;
  
  GET DIAGNOSTICS cached_count = ROW_COUNT;
  
  RETURN QUERY SELECT cached_count;
END;
$$;

-- RPC to verify access code offline (when network is down)
CREATE OR REPLACE FUNCTION verify_access_offline(
  p_access_code TEXT,
  p_guard_id UUID DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  visitor_name TEXT,
  visitor_phone TEXT,
  resident_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cache_record offline_access_cache%ROWTYPE;
BEGIN
  -- Look up the access code in offline cache
  SELECT * INTO cache_record
  FROM offline_access_cache
  WHERE access_code = p_access_code
    AND expires_at > NOW()
    AND used_offline_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE,
      NULL::TEXT,
      NULL::TEXT,
      NULL::UUID,
      NULL::TIMESTAMP WITH TIME ZONE,
      'Access code not found or expired'::TEXT;
    RETURN;
  END IF;
  
  -- Mark as used offline
  UPDATE offline_access_cache
  SET used_offline_at = NOW(),
      sync_status = 'pending'
  WHERE id = cache_record.id;
  
  -- Log the offline usage (will be synced later)
  INSERT INTO access_logs (
    access_code,
    success,
    method,
    guard_id,
    visitor_name,
    created_at,
    offline_verification
  ) VALUES (
    p_access_code,
    TRUE,
    'offline_cache',
    p_guard_id,
    cache_record.visitor_name,
    NOW(),
    TRUE
  );
  
  RETURN QUERY SELECT 
    TRUE,
    cache_record.visitor_name,
    cache_record.visitor_phone,
    cache_record.resident_id,
    cache_record.expires_at,
    'Access granted (offline verification)'::TEXT;
END;
$$;

-- RPC to sync offline usage back when network is restored
CREATE OR REPLACE FUNCTION sync_offline_usage()
RETURNS TABLE(synced_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  synced_count INTEGER := 0;
  cache_record RECORD;
BEGIN
  -- Process pending offline verifications
  FOR cache_record IN 
    SELECT * FROM offline_access_cache 
    WHERE sync_status = 'pending' 
      AND used_offline_at IS NOT NULL
  LOOP
    -- Update the original access_codes table
    UPDATE access_codes 
    SET used_at = cache_record.used_offline_at
    WHERE code = cache_record.access_code
      AND used_at IS NULL;
    
    -- Mark as synced
    UPDATE offline_access_cache
    SET sync_status = 'synced'
    WHERE id = cache_record.id;
    
    synced_count := synced_count + 1;
  END LOOP;
  
  -- Clean up old synced entries
  DELETE FROM offline_access_cache
  WHERE sync_status = 'synced' 
    AND cached_at < NOW() - INTERVAL '7 days';
  
  RETURN QUERY SELECT synced_count;
END;
$$;

-- Grant permissions for the RPCs
GRANT EXECUTE ON FUNCTION populate_offline_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION verify_access_offline(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_usage() TO authenticated;

-- Create access_logs table if it doesn't exist (for offline usage tracking)
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  method TEXT NOT NULL, -- 'qr', 'pin', 'offline_cache'
  guard_id UUID REFERENCES profiles(id),
  visitor_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  offline_verification BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_access_logs_code ON access_logs(access_code);
CREATE INDEX IF NOT EXISTS idx_access_logs_guard ON access_logs(guard_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_offline ON access_logs(offline_verification);
