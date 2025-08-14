-- Advanced Caching Strategy Database Schema
-- Phase 1: High Priority - Caching Infrastructure and Configuration

-- 1. Cache Configuration Table
CREATE TABLE cache_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  cache_type VARCHAR(50) NOT NULL CHECK (cache_type IN ('redis', 'browser', 'cdn', 'database')),
  ttl_seconds INTEGER DEFAULT 3600,
  max_size_mb INTEGER DEFAULT 100,
  compression_enabled BOOLEAN DEFAULT true,
  invalidation_strategy VARCHAR(50) DEFAULT 'time_based' CHECK (invalidation_strategy IN ('time_based', 'event_based', 'manual')),
  cache_tags TEXT[], -- Array of tags for grouped invalidation
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Cache Statistics Table
CREATE TABLE cache_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL,
  hit_count BIGINT DEFAULT 0,
  miss_count BIGINT DEFAULT 0,
  eviction_count BIGINT DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  avg_response_time_ms DECIMAL(10,2) DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  date_bucket DATE DEFAULT CURRENT_DATE
);

-- 3. Cache Invalidation Log
CREATE TABLE cache_invalidation_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_keys TEXT[] NOT NULL, -- Array of invalidated cache keys
  invalidation_reason VARCHAR(255),
  invalidation_type VARCHAR(50) DEFAULT 'manual' CHECK (invalidation_type IN ('manual', 'automatic', 'scheduled', 'event_triggered')),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Browser Cache Manifest
CREATE TABLE browser_cache_manifest (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_path VARCHAR(500) NOT NULL,
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('static', 'api', 'image', 'data')),
  cache_strategy VARCHAR(50) DEFAULT 'cache_first' CHECK (cache_strategy IN ('cache_first', 'network_first', 'cache_only', 'network_only', 'stale_while_revalidate')),
  max_age_seconds INTEGER DEFAULT 86400,
  version_hash VARCHAR(64),
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CDN Cache Configuration
CREATE TABLE cdn_cache_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  path_pattern VARCHAR(500) NOT NULL,
  cache_behavior VARCHAR(50) DEFAULT 'cache' CHECK (cache_behavior IN ('cache', 'no_cache', 'origin')),
  ttl_seconds INTEGER DEFAULT 86400,
  edge_locations TEXT[], -- Array of edge location codes
  compression_types TEXT[] DEFAULT ARRAY['gzip', 'brotli'],
  cache_key_parameters TEXT[], -- Query parameters to include in cache key
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes for Performance
CREATE INDEX idx_cache_config_type_active ON cache_config (cache_type, is_active);
CREATE INDEX idx_cache_statistics_key_date ON cache_statistics (cache_key, date_bucket);
CREATE INDEX idx_cache_invalidation_tenant_created ON cache_invalidation_log (tenant_id, created_at DESC);
CREATE INDEX idx_browser_cache_path_type ON browser_cache_manifest (resource_path, resource_type);
CREATE INDEX idx_cdn_cache_domain_pattern ON cdn_cache_config (domain, path_pattern);

-- 7. Cache Management Functions
CREATE OR REPLACE FUNCTION invalidate_cache_by_tags(
  p_tags TEXT[],
  p_reason VARCHAR(255) DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  invalidated_keys TEXT[];
  cache_key_count INTEGER;
BEGIN
  -- Find all cache keys with matching tags
  SELECT ARRAY_AGG(cache_key) 
  INTO invalidated_keys
  FROM cache_config 
  WHERE cache_tags && p_tags AND is_active = true;
  
  -- Log the invalidation
  INSERT INTO cache_invalidation_log (cache_keys, invalidation_reason, invalidation_type, tenant_id)
  VALUES (invalidated_keys, p_reason, 'event_triggered', p_tenant_id);
  
  cache_key_count := array_length(invalidated_keys, 1);
  
  RETURN COALESCE(cache_key_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 8. Cache Hit Rate Calculation Function
CREATE OR REPLACE FUNCTION calculate_cache_hit_rate(
  p_cache_key VARCHAR(255) DEFAULT NULL,
  p_date_from DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  p_date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  cache_key VARCHAR(255),
  hit_rate DECIMAL(5,2),
  total_requests BIGINT,
  hit_count BIGINT,
  miss_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.cache_key,
    CASE 
      WHEN (cs.hit_count + cs.miss_count) > 0 
      THEN ROUND((cs.hit_count::decimal / (cs.hit_count + cs.miss_count)) * 100, 2)
      ELSE 0 
    END as hit_rate,
    (cs.hit_count + cs.miss_count) as total_requests,
    cs.hit_count,
    cs.miss_count
  FROM cache_statistics cs
  WHERE (p_cache_key IS NULL OR cs.cache_key = p_cache_key)
    AND cs.date_bucket BETWEEN p_date_from AND p_date_to
  GROUP BY cs.cache_key, cs.hit_count, cs.miss_count
  ORDER BY hit_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. Cache Size Monitoring Function
CREATE OR REPLACE FUNCTION monitor_cache_sizes()
RETURNS TABLE (
  cache_type VARCHAR(50),
  total_size_mb DECIMAL(10,2),
  cache_count INTEGER,
  avg_size_mb DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.cache_type,
    ROUND(SUM(cs.total_size_bytes) / 1024.0 / 1024.0, 2) as total_size_mb,
    COUNT(DISTINCT cc.cache_key)::integer as cache_count,
    ROUND(AVG(cs.total_size_bytes) / 1024.0 / 1024.0, 2) as avg_size_mb
  FROM cache_config cc
  LEFT JOIN cache_statistics cs ON cc.cache_key = cs.cache_key
  WHERE cc.is_active = true
  GROUP BY cc.cache_type
  ORDER BY total_size_mb DESC;
END;
$$ LANGUAGE plpgsql;

-- 10. Automatic Cache Cleanup Function
CREATE OR REPLACE FUNCTION cleanup_expired_cache_stats(
  p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cache_statistics
  WHERE date_bucket < CURRENT_DATE - INTERVAL '1 day' * p_retention_days;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO cache_invalidation_log (cache_keys, invalidation_reason, invalidation_type)
  VALUES (ARRAY['cleanup'], 'Automatic cleanup of old cache statistics', 'automatic');
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 11. Insert Default Cache Configurations
INSERT INTO cache_config (cache_key, cache_type, ttl_seconds, cache_tags, invalidation_strategy) VALUES
-- API Response Caching
('api_visitors_list', 'redis', 300, ARRAY['visitors', 'api'], 'event_based'),
('api_invitations_list', 'redis', 300, ARRAY['invitations', 'api'], 'event_based'),
('api_access_logs', 'redis', 60, ARRAY['access_logs', 'api'], 'event_based'),
('api_iot_devices', 'redis', 120, ARRAY['iot', 'devices', 'api'], 'event_based'),
('api_analytics_dashboard', 'redis', 600, ARRAY['analytics', 'dashboard'], 'time_based'),

-- Database Query Caching
('db_tenant_settings', 'database', 3600, ARRAY['tenants', 'settings'], 'event_based'),
('db_user_permissions', 'database', 1800, ARRAY['users', 'permissions'], 'event_based'),
('db_device_configurations', 'database', 7200, ARRAY['devices', 'config'], 'event_based'),
('db_visitor_statistics', 'database', 900, ARRAY['visitors', 'stats'], 'time_based'),

-- Browser Caching
('browser_static_assets', 'browser', 86400, ARRAY['static', 'assets'], 'manual'),
('browser_api_responses', 'browser', 300, ARRAY['api', 'responses'], 'event_based'),
('browser_user_preferences', 'browser', 3600, ARRAY['user', 'preferences'], 'event_based'),

-- CDN Caching
('cdn_images', 'cdn', 604800, ARRAY['images', 'static'], 'manual'),
('cdn_documents', 'cdn', 86400, ARRAY['documents', 'files'], 'manual'),
('cdn_api_public', 'cdn', 300, ARRAY['api', 'public'], 'time_based');

-- 12. Insert Browser Cache Manifest
INSERT INTO browser_cache_manifest (resource_path, resource_type, cache_strategy, max_age_seconds, is_critical) VALUES
-- Critical Application Files
('/static/js/main.*.js', 'static', 'cache_first', 86400, true),
('/static/css/main.*.css', 'static', 'cache_first', 86400, true),
('/manifest.json', 'static', 'network_first', 3600, true),

-- API Endpoints
('/api/visitors', 'api', 'stale_while_revalidate', 300, false),
('/api/invitations', 'api', 'stale_while_revalidate', 300, false),
('/api/analytics/*', 'api', 'cache_first', 600, false),

-- Images and Media
('/images/*', 'image', 'cache_first', 604800, false),
('/uploads/*', 'image', 'cache_first', 86400, false),

-- Data Files
('/api/reports/*', 'data', 'cache_first', 3600, false);

-- 13. Insert CDN Cache Configuration
INSERT INTO cdn_cache_config (domain, path_pattern, cache_behavior, ttl_seconds, compression_types, cache_key_parameters) VALUES
('*.example.com', '/static/*', 'cache', 604800, ARRAY['gzip', 'brotli'], ARRAY[]),
('*.example.com', '/images/*', 'cache', 604800, ARRAY['gzip', 'brotli'], ARRAY[]),
('api.example.com', '/api/public/*', 'cache', 300, ARRAY['gzip', 'brotli'], ARRAY['version']),
('api.example.com', '/api/analytics/*', 'cache', 600, ARRAY['gzip', 'brotli'], ARRAY['tenant_id', 'date']),
('*.example.com', '/uploads/*', 'cache', 86400, ARRAY['gzip'], ARRAY[]);

-- 14. Cache Performance Views
CREATE OR REPLACE VIEW cache_performance_summary AS
SELECT 
  cc.cache_type,
  COUNT(DISTINCT cc.cache_key) as cache_count,
  ROUND(AVG(
    CASE 
      WHEN (cs.hit_count + cs.miss_count) > 0 
      THEN (cs.hit_count::decimal / (cs.hit_count + cs.miss_count)) * 100
      ELSE 0 
    END
  ), 2) as avg_hit_rate,
  SUM(cs.hit_count) as total_hits,
  SUM(cs.miss_count) as total_misses,
  ROUND(SUM(cs.total_size_bytes) / 1024.0 / 1024.0, 2) as total_size_mb
FROM cache_config cc
LEFT JOIN cache_statistics cs ON cc.cache_key = cs.cache_key
WHERE cc.is_active = true
  AND cs.date_bucket >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY cc.cache_type
ORDER BY avg_hit_rate DESC;

CREATE OR REPLACE VIEW cache_efficiency_report AS
SELECT 
  cs.cache_key,
  cc.cache_type,
  CASE 
    WHEN (cs.hit_count + cs.miss_count) > 0 
    THEN ROUND((cs.hit_count::decimal / (cs.hit_count + cs.miss_count)) * 100, 2)
    ELSE 0 
  END as hit_rate,
  cs.hit_count + cs.miss_count as total_requests,
  ROUND(cs.total_size_bytes / 1024.0 / 1024.0, 2) as size_mb,
  ROUND(cs.avg_response_time_ms, 2) as avg_response_time_ms,
  cs.last_accessed
FROM cache_statistics cs
JOIN cache_config cc ON cs.cache_key = cc.cache_key
WHERE cc.is_active = true
  AND cs.date_bucket >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY hit_rate DESC, total_requests DESC;

-- 15. Cache Maintenance Triggers
CREATE OR REPLACE FUNCTION update_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cache_config_updated_at
  BEFORE UPDATE ON cache_config
  FOR EACH ROW EXECUTE FUNCTION update_cache_timestamp();

CREATE TRIGGER trigger_browser_cache_manifest_updated_at
  BEFORE UPDATE ON browser_cache_manifest
  FOR EACH ROW EXECUTE FUNCTION update_cache_timestamp();

CREATE TRIGGER trigger_cdn_cache_config_updated_at
  BEFORE UPDATE ON cdn_cache_config
  FOR EACH ROW EXECUTE FUNCTION update_cache_timestamp();

-- 16. RLS for Cache Management
ALTER TABLE cache_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_invalidation_log ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all cache configurations
CREATE POLICY cache_service_role ON cache_config
  USING (auth.role() = 'service_role');

CREATE POLICY cache_stats_service_role ON cache_statistics
  USING (auth.role() = 'service_role');

CREATE POLICY cache_invalidation_tenant_isolation ON cache_invalidation_log
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text OR auth.role() = 'service_role');

COMMENT ON TABLE cache_config IS 'Configuration for multi-layer caching strategy';
COMMENT ON TABLE cache_statistics IS 'Performance metrics and statistics for cache layers';
COMMENT ON TABLE cache_invalidation_log IS 'Audit log of cache invalidation events';
COMMENT ON TABLE browser_cache_manifest IS 'Service worker cache manifest for browser caching';
COMMENT ON TABLE cdn_cache_config IS 'CDN cache configuration and rules';
