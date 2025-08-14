-- Phase 8: Enterprise Integration & Scalability - API Management Foundation
-- Migration: 20250814120000_enterprise_api_foundation.sql

-- API Keys Management Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    api_key_hash VARCHAR(255) NOT NULL UNIQUE,
    api_key_prefix VARCHAR(16) NOT NULL, -- For identification without exposing full key
    permissions JSONB NOT NULL DEFAULT '{}', -- Permissions: {"read": ["visitors", "analytics"], "write": ["visitors"]}
    rate_limit INTEGER NOT NULL DEFAULT 1000, -- Requests per hour
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- API Request Logs Table
CREATE TABLE IF NOT EXISTS api_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    request_size INTEGER DEFAULT 0,
    response_size INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    error_message TEXT,
    request_data JSONB,
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Webhooks Management Table
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2000) NOT NULL,
    events TEXT[] NOT NULL, -- Array of event types: ['visitor.created', 'access.granted', 'incident.reported']
    headers JSONB DEFAULT '{}', -- Custom headers for webhook requests
    secret VARCHAR(255), -- For webhook signature verification
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    retry_count INTEGER NOT NULL DEFAULT 3,
    timeout_seconds INTEGER NOT NULL DEFAULT 30,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Webhook Delivery Logs Table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'pending', 'success', 'failed', 'retrying'
    response_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- API Event Types Reference Table
CREATE TABLE IF NOT EXISTS api_event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    payload_schema JSONB, -- JSON schema for event payload
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Location Management Enhancement (Multi-location support)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    coordinates POINT, -- Geographic coordinates for location
    timezone VARCHAR(100) DEFAULT 'UTC',
    settings JSONB DEFAULT '{}', -- Location-specific settings
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Location Permissions (User access to specific locations)
CREATE TABLE IF NOT EXISTS location_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    permissions TEXT[] NOT NULL DEFAULT '{}', -- ['read', 'write', 'admin']
    granted_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, location_id)
);

-- Add location_id to existing tables for multi-location support
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_active ON api_keys(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_api_key_created ON api_request_logs(api_key_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_tenant_created ON api_request_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_active ON webhooks(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_status ON webhook_deliveries(webhook_id, status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_locations_tenant_active ON locations(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_location_permissions_user ON location_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_location_permissions_location ON location_permissions(location_id);

-- RPC Functions for API Management

-- Generate API Key Function
CREATE OR REPLACE FUNCTION generate_api_key(
    p_tenant_id UUID,
    p_name VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_permissions JSONB DEFAULT '{}',
    p_rate_limit INTEGER DEFAULT 1000,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS TABLE(
    api_key_id UUID,
    api_key TEXT,
    success BOOLEAN,
    error TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_api_key TEXT;
    v_api_key_hash TEXT;
    v_api_key_prefix TEXT;
    v_api_key_id UUID;
BEGIN
    -- Generate a secure API key (32 random bytes in hex)
    v_api_key := 'sgk_' || encode(gen_random_bytes(32), 'hex');
    v_api_key_prefix := LEFT(v_api_key, 16);
    v_api_key_hash := encode(digest(v_api_key, 'sha256'), 'hex');
    
    -- Insert the API key
    INSERT INTO api_keys (
        tenant_id, name, description, api_key_hash, api_key_prefix,
        permissions, rate_limit, expires_at, created_by
    ) VALUES (
        p_tenant_id, p_name, p_description, v_api_key_hash, v_api_key_prefix,
        p_permissions, p_rate_limit, p_expires_at, p_created_by
    ) RETURNING id INTO v_api_key_id;
    
    RETURN QUERY SELECT v_api_key_id, v_api_key, TRUE, NULL::TEXT;
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE, SQLERRM;
END;
$$;

-- Validate API Key Function
CREATE OR REPLACE FUNCTION validate_api_key(
    p_api_key TEXT
)
RETURNS TABLE(
    api_key_id UUID,
    tenant_id UUID,
    permissions JSONB,
    rate_limit INTEGER,
    is_valid BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_api_key_hash TEXT;
    v_key_record RECORD;
BEGIN
    -- Hash the provided API key
    v_api_key_hash := encode(digest(p_api_key, 'sha256'), 'hex');
    
    -- Find the API key record
    SELECT ak.id, ak.tenant_id, ak.permissions, ak.rate_limit, ak.is_active, ak.expires_at
    INTO v_key_record
    FROM api_keys ak
    WHERE ak.api_key_hash = v_api_key_hash;
    
    -- Check if key was found
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::JSONB, NULL::INTEGER, FALSE, 'Invalid API key'::TEXT;
        RETURN;
    END IF;
    
    -- Check if key is active
    IF NOT v_key_record.is_active THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::JSONB, NULL::INTEGER, FALSE, 'API key is inactive'::TEXT;
        RETURN;
    END IF;
    
    -- Check if key has expired
    IF v_key_record.expires_at IS NOT NULL AND v_key_record.expires_at < NOW() THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::JSONB, NULL::INTEGER, FALSE, 'API key has expired'::TEXT;
        RETURN;
    END IF;
    
    -- Update last used timestamp
    UPDATE api_keys SET last_used_at = NOW() WHERE id = v_key_record.id;
    
    -- Return valid key information
    RETURN QUERY SELECT 
        v_key_record.id, 
        v_key_record.tenant_id, 
        v_key_record.permissions, 
        v_key_record.rate_limit, 
        TRUE, 
        NULL::TEXT;
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::JSONB, NULL::INTEGER, FALSE, SQLERRM;
END;
$$;

-- Log API Request Function
CREATE OR REPLACE FUNCTION log_api_request(
    p_api_key_id UUID,
    p_tenant_id UUID,
    p_endpoint VARCHAR(255),
    p_method VARCHAR(10),
    p_status_code INTEGER,
    p_request_size INTEGER DEFAULT 0,
    p_response_size INTEGER DEFAULT 0,
    p_response_time_ms INTEGER DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_request_data JSONB DEFAULT NULL,
    p_response_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO api_request_logs (
        api_key_id, tenant_id, endpoint, method, status_code,
        request_size, response_size, response_time_ms, ip_address,
        user_agent, error_message, request_data, response_data
    ) VALUES (
        p_api_key_id, p_tenant_id, p_endpoint, p_method, p_status_code,
        p_request_size, p_response_size, p_response_time_ms, p_ip_address,
        p_user_agent, p_error_message, p_request_data, p_response_data
    );
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Create Webhook Function
CREATE OR REPLACE FUNCTION create_webhook(
    p_tenant_id UUID,
    p_name VARCHAR(255),
    p_url VARCHAR(2000),
    p_events TEXT[],
    p_headers JSONB DEFAULT '{}',
    p_secret VARCHAR(255) DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS TABLE(
    webhook_id UUID,
    success BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_webhook_id UUID;
BEGIN
    INSERT INTO webhooks (
        tenant_id, name, url, events, headers, secret, created_by
    ) VALUES (
        p_tenant_id, p_name, p_url, p_events, p_headers, p_secret, p_created_by
    ) RETURNING id INTO v_webhook_id;
    
    RETURN QUERY SELECT v_webhook_id, TRUE, NULL::TEXT;
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, SQLERRM;
END;
$$;

-- Insert default event types
INSERT INTO api_event_types (event_type, description, payload_schema) VALUES
('visitor.created', 'Fired when a new visitor is registered', '{"type": "object", "properties": {"visitor_id": {"type": "string"}, "name": {"type": "string"}}}'),
('visitor.updated', 'Fired when visitor information is updated', '{"type": "object", "properties": {"visitor_id": {"type": "string"}, "changes": {"type": "object"}}}'),
('invitation.created', 'Fired when a new invitation is sent', '{"type": "object", "properties": {"invitation_id": {"type": "string"}, "visitor_id": {"type": "string"}}}'),
('invitation.accepted', 'Fired when an invitation is accepted', '{"type": "object", "properties": {"invitation_id": {"type": "string"}, "access_code": {"type": "string"}}}'),
('access.granted', 'Fired when visitor access is granted', '{"type": "object", "properties": {"visitor_id": {"type": "string"}, "access_method": {"type": "string"}}}'),
('access.denied', 'Fired when visitor access is denied', '{"type": "object", "properties": {"visitor_id": {"type": "string"}, "reason": {"type": "string"}}}'),
('incident.reported', 'Fired when a security incident is reported', '{"type": "object", "properties": {"incident_id": {"type": "string"}, "severity": {"type": "string"}}}'),
('analytics.daily', 'Fired daily with analytics summary', '{"type": "object", "properties": {"date": {"type": "string"}, "stats": {"type": "object"}}}')
ON CONFLICT (event_type) DO NOTHING;

-- Create default location for existing tenants
INSERT INTO locations (tenant_id, name, address, created_by)
SELECT 
    t.id,
    'Main Location',
    'Default location for ' || COALESCE(t.name, 'tenant'),
    NULL
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM locations l WHERE l.tenant_id = t.id)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON api_keys TO authenticated;
GRANT ALL ON api_request_logs TO authenticated;
GRANT ALL ON webhooks TO authenticated;
GRANT ALL ON webhook_deliveries TO authenticated;
GRANT ALL ON api_event_types TO authenticated;
GRANT ALL ON locations TO authenticated;
GRANT ALL ON location_permissions TO authenticated;

-- Row Level Security Policies

-- API Keys RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_tenant_isolation" ON api_keys
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- API Request Logs RLS
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_request_logs_tenant_isolation" ON api_request_logs
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Webhooks RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks_tenant_isolation" ON webhooks
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Webhook Deliveries RLS
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_deliveries_tenant_isolation" ON webhook_deliveries
    FOR ALL USING (
        webhook_id IN (
            SELECT w.id FROM webhooks w
            JOIN profiles p ON p.tenant_id = w.tenant_id
            WHERE p.id = auth.uid()
        )
    );

-- Locations RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations_tenant_isolation" ON locations
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Location Permissions RLS
ALTER TABLE location_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "location_permissions_user_access" ON location_permissions
    FOR ALL USING (
        user_id = auth.uid() OR
        location_id IN (
            SELECT l.id FROM locations l
            JOIN profiles p ON p.tenant_id = l.tenant_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

COMMENT ON TABLE api_keys IS 'API keys for external system integration';
COMMENT ON TABLE api_request_logs IS 'Comprehensive logging of all API requests';
COMMENT ON TABLE webhooks IS 'Webhook configurations for real-time notifications';
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery logs and status tracking';
COMMENT ON TABLE locations IS 'Physical locations for multi-site support';
COMMENT ON TABLE location_permissions IS 'User permissions for specific locations';
