-- Fix deployment issues based on test failures
-- This migration addresses missing columns, tables, and functions

-- 1. Fix missing columns in visitors table
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS registration_status VARCHAR(50) DEFAULT 'pending';

-- Update existing columns to handle null values
UPDATE visitors SET 
  email = COALESCE(email, 'pending@example.com'),
  consent_given = COALESCE(consent_given, false),
  registration_status = COALESCE(registration_status, 'pending')
WHERE email IS NULL OR consent_given IS NULL OR registration_status IS NULL;

-- 2. Fix missing AI/ML tables for enterprise features
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    model_category VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    deployment_status VARCHAR(50) DEFAULT 'development',
    accuracy_score DECIMAL(5,4) DEFAULT 0.0,
    inference_latency_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_decision_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_category VARCHAR(100) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.5,
    is_active BOOLEAN DEFAULT true,
    success_rate DECIMAL(3,2) DEFAULT 0.0,
    rule_activation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_insights_engine (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type VARCHAR(100) NOT NULL,
    insight_title VARCHAR(255) NOT NULL,
    insight_description TEXT,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    impact_score DECIMAL(3,2) DEFAULT 0.0,
    urgency_score DECIMAL(3,2) DEFAULT 0.0,
    insight_status VARCHAR(50) DEFAULT 'new',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Fix missing enterprise tables
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL UNIQUE,
    permissions JSONB DEFAULT '{}',
    rate_limit_per_minute INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS api_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_payload JSONB,
    response_payload JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    events TEXT[] NOT NULL,
    secret_key VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    retry_attempts INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES webhooks(id),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    response_status_code INTEGER,
    response_body TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    timezone VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    location_id UUID REFERENCES locations(id),
    permission_level VARCHAR(50) NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, location_id)
);

-- 4. Add RLS policies for new tables
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decision_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_engine ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_permissions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined later)
CREATE POLICY "authenticated_users_can_read_ai_models" ON ai_models
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_can_read_locations" ON locations
    FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Insert sample data for testing
INSERT INTO ai_models (model_name, model_type, model_category, model_version, deployment_status, accuracy_score) VALUES
('Visitor Risk Assessment', 'classification', 'security', 'v1.0', 'production', 0.92),
('Access Pattern Analyzer', 'anomaly_detection', 'security', 'v1.1', 'production', 0.88),
('Sentiment Analysis', 'nlp', 'communication', 'v2.0', 'staging', 0.85)
ON CONFLICT DO NOTHING;

INSERT INTO ai_decision_rules (rule_name, rule_category, action_type, confidence_threshold, is_active) VALUES
('High Risk Visitor Block', 'security', 'block_access', 0.8, true),
('Automatic Approval', 'efficiency', 'auto_approve', 0.9, true),
('Schedule Optimization', 'scheduling', 'suggest_time', 0.7, true)
ON CONFLICT DO NOTHING;

INSERT INTO locations (name, address, city, country, timezone) VALUES
('Main Campus', '123 Business District', 'Nairobi', 'Kenya', 'Africa/Nairobi'),
('Branch Office', '456 Commercial Street', 'Mombasa', 'Kenya', 'Africa/Nairobi')
ON CONFLICT DO NOTHING;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);
CREATE INDEX IF NOT EXISTS idx_visitors_registration_status ON visitors(registration_status);
CREATE INDEX IF NOT EXISTS idx_ai_models_deployment_status ON ai_models(deployment_status);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON api_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);

-- 7. Update existing data to ensure consistency
UPDATE visit_invitations SET status = 'pending' WHERE status IS NULL;
UPDATE access_codes SET expires_at = created_at + INTERVAL '24 hours' WHERE expires_at IS NULL;

COMMENT ON TABLE ai_models IS 'AI/ML models registry for enterprise features';
COMMENT ON TABLE ai_decision_rules IS 'Automated decision rules configuration';
COMMENT ON TABLE locations IS 'Multi-location support for enterprise deployments';
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    is_multi_use BOOLEAN DEFAULT false,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Fix missing functions
CREATE OR REPLACE FUNCTION clean_old_invitations()
RETURNS void AS $$
BEGIN
    DELETE FROM invitations 
    WHERE valid_until < NOW() - INTERVAL '30 days'
    AND status = 'expired';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_visitor_analytics(start_date DATE, end_date DATE)
RETURNS TABLE (
    total_visitors BIGINT,
    total_checkins BIGINT,
    total_checkouts BIGINT,
    unique_visitors BIGINT,
    peak_hour INTEGER,
    average_duration_minutes NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT v.id) as total_visitors,
        COUNT(CASE WHEN v.check_in_time IS NOT NULL THEN 1 END) as total_checkins,
        COUNT(CASE WHEN v.check_out_time IS NOT NULL THEN 1 END) as total_checkouts,
        COUNT(DISTINCT v.email) as unique_visitors,
        EXTRACT(HOUR FROM v.check_in_time) as peak_hour,
        AVG(EXTRACT(EPOCH FROM (v.check_out_time - v.check_in_time))/60) as average_duration_minutes
    FROM visitors v
    WHERE v.created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- 4. Fix RLS policies
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS for visitors
CREATE POLICY "Users can view their own visitors" ON visitors
    FOR SELECT USING (
        auth.uid() = resident_id OR 
        auth.uid() IN (SELECT id FROM residents WHERE community_id = visitors.community_id)
    );

CREATE POLICY "Residents can create visitors" ON visitors
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM residents WHERE community_id = visitors.community_id)
    );

CREATE POLICY "Security guards can update visitor status" ON visitors
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM residents WHERE role = 'security_guard' AND community_id = visitors.community_id)
    );

-- RLS for invitations
CREATE POLICY "Residents can manage their own invitations" ON invitations
    FOR ALL USING (
        auth.uid() = resident_id OR
        auth.uid() IN (SELECT id FROM residents WHERE community_id = invitations.community_id)
    );

-- 5. Fix access codes table
CREATE TABLE IF NOT EXISTS access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID REFERENCES visitors(id),
    code VARCHAR(20) UNIQUE NOT NULL,
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    pin VARCHAR(10),
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for access codes
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Residents can view access codes" ON access_codes
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM residents WHERE community_id IN (
            SELECT community_id FROM visitors WHERE id = access_codes.visitor_id
        ))
    );

-- 6. Fix security guards table
CREATE TABLE IF NOT EXISTS security_guards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    community_id UUID NOT NULL REFERENCES communities(id),
    employee_id VARCHAR(50),
    shift_start TIME,
    shift_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);
CREATE INDEX IF NOT EXISTS idx_visitors_community ON visitors(community_id);
CREATE INDEX IF NOT EXISTS idx_invitations_resident ON invitations(resident_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(access_code);
CREATE INDEX IF NOT EXISTS idx_access_codes_visitor ON access_codes(visitor_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_qr ON access_codes(qr_token);
