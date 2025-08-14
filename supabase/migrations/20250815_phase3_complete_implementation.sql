-- Phase 3: Security Guard Enhancement - Complete Implementation
-- SecureGate Kenya Systematic Implementation

-- Phase 3: Security Guard Enhancement - Complete Implementation
-- SecureGate Kenya Systematic Implementation

-- Step 1: Critical Database Fixes
-- Fix missing status field and validation constraints
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'registered';
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS last_access_attempt TIMESTAMP WITH TIME ZONE;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS access_attempt_count INTEGER DEFAULT 0;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS photo_verification_url TEXT;

-- Add proper validation constraints
ALTER TABLE visitors ADD CONSTRAINT IF NOT EXISTS valid_email 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE visitors ADD CONSTRAINT IF NOT EXISTS valid_phone 
CHECK (phone_number ~* '^\+254[0-9]{9}$');

-- Step 2: Create Phase 3 Tables
-- Access logs for real-time tracking
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID REFERENCES visitors(id),
    access_method VARCHAR(20) CHECK (access_method IN ('qr_code', 'pin', 'manual')),
    access_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    guard_id UUID REFERENCES auth.users(id),
    success BOOLEAN NOT NULL,
    reason TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident reports for security guard interface
CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES auth.users(id),
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    photos TEXT[],
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Guard activity tracking
CREATE TABLE IF NOT EXISTS guard_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guard_id UUID REFERENCES auth.users(id),
    activity_type VARCHAR(50) NOT NULL,
    details JSONB,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create Enhanced Functions
-- Real-time dashboard function
CREATE OR REPLACE FUNCTION get_real_time_dashboard()
RETURNS TABLE(
    total_visitors INTEGER,
    current_visitors INTEGER,
    access_attempts_today INTEGER,
    incidents_today INTEGER,
    last_access_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE v.created_at >= CURRENT_DATE) as total_visitors_today,
        COUNT(*) FILTER (WHERE v.status = 'active') as current_active_visitors,
        COUNT(*) FILTER (WHERE a.created_at >= CURRENT_DATE) as total_access_attempts,
        COUNT(*) FILTER (WHERE i.created_at >= CURRENT_DATE AND i.status = 'open') as open_incidents,
        MAX(a.created_at) as last_access_time
    FROM visitors v
    LEFT JOIN access_logs a ON v.id = a.visitor_id
    LEFT JOIN incident_reports i ON i.created_at >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Access code generation with real-time verification
CREATE OR REPLACE FUNCTION generate_access_code_with_verification(
    visitor_id UUID,
    guard_id UUID
) RETURNS TABLE(
    access_code VARCHAR,
    qr_code TEXT,
    visitor_name TEXT,
    visitor_photo TEXT,
    is_valid BOOLEAN,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vi.invitation_token,
        encode(sha256((vi.invitation_token || visitor_id || now())::bytea), 'hex') as qr_code,
        vi.visitor_full_name,
        v.photo_url,
        CASE 
            WHEN vi.token_expires_at > now() AND vi.status = 'registered' THEN true
            ELSE false
        END as is_valid,
        vi.token_expires_at
    FROM visit_invitations vi
    JOIN visitors v ON vi.visitor_email = v.email
    WHERE v.id = visitor_id
    AND vi.status = 'registered';
END;
$$ LANGUAGE plpgsql;

-- Log access attempt function
CREATE OR REPLACE FUNCTION log_access_attempt(
    p_visitor_id UUID,
    p_guard_id UUID,
    p_access_method VARCHAR(20),
    p_success BOOLEAN,
    p_reason TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO access_logs (visitor_id, guard_id, access_method, success, reason)
    VALUES (p_visitor_id, p_guard_id, p_access_method, p_success, p_reason);
    
    UPDATE visitors 
    SET last_access_attempt = NOW(),
        access_attempt_count = access_attempt_count + 1
    WHERE id = p_visitor_id;
END;
$$ LANGUAGE plpgsql;

-- Log incident report function
CREATE OR REPLACE FUNCTION log_incident_report(
    p_guard_id UUID,
    p_incident_type VARCHAR(50),
    p_description TEXT,
    p_severity VARCHAR(20),
    p_location VARCHAR(255)
) RETURNS UUID AS $$
DECLARE
    incident_id UUID;
BEGIN
    INSERT INTO incident_reports (reporter_id, incident_type, description, severity, location)
    VALUES (p_guard_id, p_incident_type, p_description, p_severity, p_location)
    RETURNING id INTO incident_id;
    
    RETURN incident_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create Views for Dashboard
CREATE OR REPLACE VIEW guard_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM visitors WHERE created_at >= CURRENT_DATE) as total_visitors_today,
    (SELECT COUNT(*) FROM visitors WHERE status = 'active') as current_active_visitors,
    (SELECT COUNT(*) FROM access_logs WHERE created_at >= CURRENT_DATE) as total_access_attempts,
    (SELECT COUNT(*) FROM access_logs WHERE created_at >= CURRENT_DATE AND success = true) as successful_accesses,
    (SELECT COUNT(*) FROM access_logs WHERE created_at >= CURRENT_DATE AND success = false) as failed_accesses,
    (SELECT COUNT(*) FROM incident_reports WHERE created_at >= CURRENT_DATE) as total_incidents,
    (SELECT COUNT(*) FROM incident_reports WHERE created_at >= CURRENT_DATE AND status = 'open') as open_incidents,
    (SELECT MAX(access_time) FROM access_logs) as last_access_time;

-- Step 5: Create Security Analytics
CREATE OR REPLACE VIEW security_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_access_attempts,
    COUNT(*) FILTER (WHERE success = true) as successful_accesses,
    COUNT(*) FILTER (WHERE success = false) as failed_accesses,
    ROUND(COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*), 2) as success_rate,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(DISTINCT guard_id) as active_guards
FROM access_logs
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Step 6: Create Emergency Procedures
CREATE OR REPLACE FUNCTION trigger_emergency_alert(
    p_guard_id UUID,
    p_emergency_type VARCHAR(50),
    p_location VARCHAR(255),
    p_description TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO incident_reports (reporter_id, incident_type, severity, description, location, status)
    VALUES (p_guard_id, p_emergency_type, 'critical', p_description, p_location, 'open');
    
    -- Here you would add notification logic for administrators
    -- This could include SMS, email, or push notifications
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create Performance Monitoring
CREATE OR REPLACE FUNCTION get_guard_performance(
    p_guard_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE(
    total_access_attempts INTEGER,
    successful_accesses INTEGER,
    failed_accesses INTEGER,
    success_rate DECIMAL,
    incidents_reported INTEGER,
    average_response_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_access_attempts,
        COUNT(*) FILTER (WHERE success = true) as successful_accesses,
        COUNT(*) FILTER (WHERE success = false) as failed_accesses,
        ROUND(COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*), 2) as success_rate,
        COUNT(*) FILTER (WHERE reporter_id = p_guard_id) as incidents_reported,
        INTERVAL '0 seconds' as average_response_time
    FROM access_logs
    WHERE guard_id = p_guard_id
    AND created_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_incident_report(UUID, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_offline_data(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_emergency_alert(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guard_performance(UUID, DATE, DATE) TO authenticated;

-- Grant necessary permissions
GRANT SELECT, INSERT ON access_logs TO authenticated;
GRANT SELECT, INSERT ON incident_reports TO authenticated;
GRANT SELECT, INSERT ON guard_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_access_code_with_verification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_access_attempt(UUID, UUID, VARCHAR, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log
