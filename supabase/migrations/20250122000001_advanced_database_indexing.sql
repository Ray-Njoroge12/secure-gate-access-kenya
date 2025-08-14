-- Advanced Database Indexing and Optimization
-- Phase 1: High Priority Database Performance Enhancements

-- 1. Performance-Critical Indexes for Visitor Management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visitors_status_created 
ON visitors (status, created_at DESC) 
WHERE status IN ('checked_in', 'pending', 'approved');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visitors_host_status 
ON visitors (host_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visitors_phone_email 
ON visitors (phone_number, email) 
WHERE phone_number IS NOT NULL OR email IS NOT NULL;

-- 2. Invitation System Optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitations_host_status_date 
ON invitations (host_id, status, created_at DESC, valid_until);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitations_code_active 
ON invitations (access_code) 
WHERE status = 'active' AND valid_until > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitations_visitor_lookup 
ON invitations (visitor_name, visitor_email, visitor_phone);

-- 3. Access Control Optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_access_logs_visitor_time 
ON access_logs (visitor_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_access_logs_gate_time 
ON access_logs (gate_id, created_at DESC) 
WHERE action_type IN ('entry', 'exit');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_access_logs_security_events 
ON access_logs (action_type, created_at DESC) 
WHERE action_type IN ('denied', 'emergency', 'override');

-- 4. Enterprise Features Indexing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_domain_lookup 
ON tenants (domain, status) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_users_role_status 
ON tenant_users (tenant_id, role, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_active 
ON user_sessions (user_id, expires_at) 
WHERE expires_at > NOW();

-- 5. IoT Device Management Indexing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iot_devices_tenant_status 
ON iot_devices (tenant_id, device_status, last_seen DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iot_devices_type_location 
ON iot_devices (device_type, location_id) 
WHERE device_status = 'online';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_device_telemetry_recent 
ON device_telemetry (device_id, timestamp DESC) 
WHERE timestamp > NOW() - INTERVAL '24 hours';

-- 6. Audit and Compliance Indexing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_time 
ON audit_logs (tenant_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action 
ON audit_logs (user_id, action_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_reports_tenant_period 
ON compliance_reports (tenant_id, report_period, status);

-- 7. Notification System Indexing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON notifications (user_id, read_at, created_at DESC) 
WHERE read_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type_priority 
ON notifications (notification_type, priority, created_at DESC);

-- 8. Analytics and Reporting Indexing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visitor_analytics_date_tenant 
ON visitor_analytics (date, tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_device_analytics_date_device 
ON device_analytics (date, device_id);

-- 9. Composite Indexes for Complex Queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visitors_complex_search 
ON visitors (tenant_id, status, created_at DESC, host_id) 
INCLUDE (name, phone_number, email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitations_lookup_composite 
ON invitations (tenant_id, status, valid_until) 
INCLUDE (access_code, visitor_name, host_id);

-- 10. Full-Text Search Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visitors_fulltext 
ON visitors USING gin(to_tsvector('english', 
  COALESCE(name, '') || ' ' || 
  COALESCE(email, '') || ' ' || 
  COALESCE(phone_number, '') || ' ' || 
  COALESCE(company, '')
));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitations_fulltext 
ON invitations USING gin(to_tsvector('english', 
  COALESCE(visitor_name, '') || ' ' || 
  COALESCE(visitor_email, '') || ' ' || 
  COALESCE(purpose, '') || ' ' || 
  COALESCE(notes, '')
));

-- 11. Table Partitioning Setup (for large datasets)
-- Partition access_logs by date for better performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'access_logs_y2025m01'
  ) THEN
    -- Create monthly partitions for access logs
    CREATE TABLE access_logs_y2025m01 PARTITION OF access_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
    
    CREATE TABLE access_logs_y2025m02 PARTITION OF access_logs
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
    
    CREATE TABLE access_logs_y2025m03 PARTITION OF access_logs
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
  END IF;
END $$;

-- 12. Statistics and Query Optimization
-- Update table statistics for better query planning
ANALYZE visitors;
ANALYZE invitations;
ANALYZE access_logs;
ANALYZE iot_devices;
ANALYZE device_telemetry;
ANALYZE audit_logs;

-- 13. Index Maintenance Views
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  CASE 
    WHEN idx_scan = 0 THEN 'Unused'
    WHEN idx_scan < 100 THEN 'Low Usage'
    WHEN idx_scan < 1000 THEN 'Medium Usage'
    ELSE 'High Usage'
  END as usage_category
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 14. Performance Monitoring Functions
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
  query TEXT,
  calls BIGINT,
  total_time DOUBLE PRECISION,
  mean_time DOUBLE PRECISION,
  rows BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_stat_statements.query,
    pg_stat_statements.calls,
    pg_stat_statements.total_exec_time,
    pg_stat_statements.mean_exec_time,
    pg_stat_statements.rows
  FROM pg_stat_statements
  WHERE pg_stat_statements.mean_exec_time > 100
  ORDER BY pg_stat_statements.mean_exec_time DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 15. Database Maintenance Procedures
CREATE OR REPLACE FUNCTION optimize_database_maintenance()
RETURNS void AS $$
BEGIN
  -- Update statistics
  ANALYZE;
  
  -- Log maintenance activity
  INSERT INTO audit_logs (action_type, details, created_at)
  VALUES ('database_maintenance', 'Automated database optimization completed', NOW());
END;
$$ LANGUAGE plpgsql;

-- Schedule regular maintenance (requires pg_cron extension)
-- SELECT cron.schedule('db-maintenance', '0 2 * * *', 'SELECT optimize_database_maintenance();');

COMMENT ON INDEX idx_visitors_status_created IS 'Optimizes visitor status queries with time ordering';
COMMENT ON INDEX idx_invitations_code_active IS 'Fast lookup for active invitation codes';
COMMENT ON INDEX idx_access_logs_security_events IS 'Security incident monitoring and reporting';
COMMENT ON INDEX idx_iot_devices_tenant_status IS 'IoT device management and monitoring';
COMMENT ON INDEX idx_visitors_fulltext IS 'Full-text search across visitor information';
