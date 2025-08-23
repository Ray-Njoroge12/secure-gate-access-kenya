-- Phase 9: IoT Integration & Smart Infrastructure Database Schema
-- Date: 2025-08-14
-- Description: Database schema for IoT devices, smart gates, cameras, and environmental monitoring

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- IoT Devices Table
CREATE TABLE IF NOT EXISTS iot_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('gate_controller', 'camera', 'sensor', 'access_reader', 'intercom', 'alarm')),
    device_name TEXT NOT NULL,
    device_model TEXT,
    serial_number TEXT UNIQUE,
    mac_address TEXT,
    ip_address INET,
    firmware_version TEXT,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance', 'error', 'updating')),
    capabilities JSONB DEFAULT '{}', -- Device-specific capabilities and settings
    configuration JSONB DEFAULT '{}', -- Device configuration parameters
    last_seen_at TIMESTAMPTZ,
    last_command_at TIMESTAMPTZ,
    health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
    location_description TEXT,
    installation_date DATE,
    warranty_expiry DATE,
    is_critical BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Device Events Table (for logging all device activities)
CREATE TABLE IF NOT EXISTS device_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('status_change', 'command_executed', 'error_occurred', 'maintenance', 'alert', 'heartbeat')),
    event_data JSONB DEFAULT '{}',
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    message TEXT,
    triggered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Smart Gate Operations Table
CREATE TABLE IF NOT EXISTS gate_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
    access_code_id UUID REFERENCES access_codes(id) ON DELETE SET NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('open', 'close', 'emergency_open', 'emergency_close', 'test')),
    trigger_method TEXT NOT NULL CHECK (trigger_method IN ('qr_code', 'pin', 'manual', 'automatic', 'emergency', 'remote')),
    operation_status TEXT NOT NULL DEFAULT 'pending' CHECK (operation_status IN ('pending', 'executing', 'completed', 'failed', 'cancelled')),
    initiated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    completion_time INTEGER, -- Time taken in milliseconds
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Camera Captures Table (for facial recognition and photo storage)
CREATE TABLE IF NOT EXISTS camera_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
    capture_type TEXT NOT NULL CHECK (capture_type IN ('entry', 'exit', 'security_scan', 'manual', 'motion_detected')),
    image_url TEXT,
    face_encoding BYTEA, -- Encoded facial features for recognition
    confidence_score DECIMAL(5,4), -- Facial recognition confidence (0.0000 to 1.0000)
    recognition_result TEXT CHECK (recognition_result IN ('match', 'no_match', 'unknown', 'processing')),
    metadata JSONB DEFAULT '{}', -- Camera settings, timestamp, etc.
    is_flagged BOOLEAN DEFAULT false,
    flagged_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Environmental Readings Table (for sensors)
CREATE TABLE IF NOT EXISTS environmental_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    reading_type TEXT NOT NULL CHECK (reading_type IN ('temperature', 'humidity', 'light_level', 'motion', 'sound_level', 'air_quality', 'door_status')),
    value DECIMAL(10,4),
    unit TEXT,
    threshold_min DECIMAL(10,4),
    threshold_max DECIMAL(10,4),
    is_alert BOOLEAN DEFAULT false,
    alert_level TEXT CHECK (alert_level IN ('normal', 'warning', 'critical')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Device Commands Table (for queuing and tracking commands)
CREATE TABLE IF NOT EXISTS device_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    command_type TEXT NOT NULL CHECK (command_type IN ('open_gate', 'close_gate', 'capture_photo', 'start_recording', 'stop_recording', 'reboot', 'update_firmware', 'configure')),
    command_data JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5), -- 1 = highest priority
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'executing', 'completed', 'failed', 'timeout')),
    response_data JSONB DEFAULT '{}',
    initiated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    timeout_at TIMESTAMPTZ DEFAULT (now() + interval '5 minutes'),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Device Maintenance Log Table
CREATE TABLE IF NOT EXISTS device_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('scheduled', 'repair', 'upgrade', 'calibration', 'cleaning', 'inspection')),
    description TEXT NOT NULL,
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    scheduled_date DATE,
    completed_date DATE,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
    cost DECIMAL(10,2),
    notes TEXT,
    next_maintenance_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_iot_devices_tenant_location ON iot_devices(tenant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_type_status ON iot_devices(device_type, status);
CREATE INDEX IF NOT EXISTS idx_iot_devices_last_seen ON iot_devices(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_device_events_device_time ON device_events(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_events_type_severity ON device_events(event_type, severity);
CREATE INDEX IF NOT EXISTS idx_gate_operations_device_time ON gate_operations(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_camera_captures_device_time ON camera_captures(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_camera_captures_visitor ON camera_captures(visitor_id);
CREATE INDEX IF NOT EXISTS idx_environmental_readings_device_time ON environmental_readings(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_environmental_readings_alert ON environmental_readings(is_alert, alert_level);
CREATE INDEX IF NOT EXISTS idx_device_commands_device_status ON device_commands(device_id, status);
CREATE INDEX IF NOT EXISTS idx_device_commands_priority_time ON device_commands(priority, created_at);

-- Enable Row Level Security
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_maintenance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Tenant isolation for iot_devices" ON iot_devices
    USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Tenant isolation for device_events" ON device_events
    USING (EXISTS (
        SELECT 1 FROM iot_devices 
        WHERE iot_devices.id = device_events.device_id 
        AND iot_devices.tenant_id = auth.jwt() ->> 'tenant_id'::text
    ));

CREATE POLICY "Tenant isolation for gate_operations" ON gate_operations
    USING (EXISTS (
        SELECT 1 FROM iot_devices 
        WHERE iot_devices.id = gate_operations.device_id 
        AND iot_devices.tenant_id = auth.jwt() ->> 'tenant_id'::text
    ));

CREATE POLICY "Tenant isolation for camera_captures" ON camera_captures
    USING (EXISTS (
        SELECT 1 FROM iot_devices 
        WHERE iot_devices.id = camera_captures.device_id 
        AND iot_devices.tenant_id = auth.jwt() ->> 'tenant_id'::text
    ));

CREATE POLICY "Tenant isolation for environmental_readings" ON environmental_readings
    USING (EXISTS (
        SELECT 1 FROM iot_devices 
        WHERE iot_devices.id = environmental_readings.device_id 
        AND iot_devices.tenant_id = auth.jwt() ->> 'tenant_id'::text
    ));

CREATE POLICY "Tenant isolation for device_commands" ON device_commands
    USING (EXISTS (
        SELECT 1 FROM iot_devices 
        WHERE iot_devices.id = device_commands.device_id 
        AND iot_devices.tenant_id = auth.jwt() ->> 'tenant_id'::text
    ));

CREATE POLICY "Tenant isolation for device_maintenance" ON device_maintenance
    USING (EXISTS (
        SELECT 1 FROM iot_devices 
        WHERE iot_devices.id = device_maintenance.device_id 
        AND iot_devices.tenant_id = auth.jwt() ->> 'tenant_id'::text
    ));

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_iot_devices_updated_at BEFORE UPDATE ON iot_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_maintenance_updated_at BEFORE UPDATE ON device_maintenance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Utility functions for IoT management

-- Function to register a new IoT device
CREATE OR REPLACE FUNCTION register_iot_device(
    p_tenant_id UUID,
    p_location_id UUID,
    p_device_type TEXT,
    p_device_name TEXT,
    p_device_model TEXT DEFAULT NULL,
    p_serial_number TEXT DEFAULT NULL,
    p_mac_address TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_capabilities JSONB DEFAULT '{}',
    p_created_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_device_id UUID;
    result JSON;
BEGIN
    -- Insert the new device
    INSERT INTO iot_devices (
        tenant_id, location_id, device_type, device_name, device_model,
        serial_number, mac_address, ip_address, capabilities, created_by
    ) VALUES (
        p_tenant_id, p_location_id, p_device_type, p_device_name, p_device_model,
        p_serial_number, p_mac_address, p_ip_address, p_capabilities, p_created_by
    ) RETURNING id INTO v_device_id;

    -- Log device registration event
    INSERT INTO device_events (device_id, event_type, event_data, message, triggered_by)
    VALUES (
        v_device_id, 
        'status_change', 
        jsonb_build_object('previous_status', null, 'new_status', 'offline'),
        'Device registered and added to system',
        p_created_by
    );

    result := jsonb_build_object(
        'success', true,
        'device_id', v_device_id,
        'message', 'Device registered successfully'
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update device status
CREATE OR REPLACE FUNCTION update_device_status(
    p_device_id UUID,
    p_new_status TEXT,
    p_triggered_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_old_status TEXT;
    result JSON;
BEGIN
    -- Get current status
    SELECT status INTO v_old_status 
    FROM iot_devices 
    WHERE id = p_device_id;

    IF v_old_status IS NULL THEN
        result := jsonb_build_object(
            'success', false,
            'error', 'Device not found'
        );
        RETURN result;
    END IF;

    -- Update device status and last_seen_at
    UPDATE iot_devices 
    SET status = p_new_status, 
        last_seen_at = CASE WHEN p_new_status = 'online' THEN now() ELSE last_seen_at END
    WHERE id = p_device_id;

    -- Log status change event
    INSERT INTO device_events (device_id, event_type, event_data, message, triggered_by)
    VALUES (
        p_device_id, 
        'status_change', 
        jsonb_build_object('previous_status', v_old_status, 'new_status', p_new_status),
        format('Device status changed from %s to %s', v_old_status, p_new_status),
        p_triggered_by
    );

    result := jsonb_build_object(
        'success', true,
        'previous_status', v_old_status,
        'new_status', p_new_status
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send command to device
CREATE OR REPLACE FUNCTION send_device_command(
    p_device_id UUID,
    p_command_type TEXT,
    p_command_data JSONB DEFAULT '{}',
    p_priority INTEGER DEFAULT 1,
    p_initiated_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_command_id UUID;
    result JSON;
BEGIN
    -- Insert command
    INSERT INTO device_commands (
        device_id, command_type, command_data, priority, initiated_by
    ) VALUES (
        p_device_id, p_command_type, p_command_data, p_priority, p_initiated_by
    ) RETURNING id INTO v_command_id;

    -- Log command creation event
    INSERT INTO device_events (device_id, event_type, event_data, message, triggered_by)
    VALUES (
        p_device_id, 
        'command_executed', 
        jsonb_build_object('command_id', v_command_id, 'command_type', p_command_type),
        format('Command %s queued for execution', p_command_type),
        p_initiated_by
    );

    result := jsonb_build_object(
        'success', true,
        'command_id', v_command_id,
        'message', 'Command queued successfully'
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get device health summary
CREATE OR REPLACE FUNCTION get_device_health_summary(
    p_tenant_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    WITH device_stats AS (
        SELECT 
            device_type,
            status,
            COUNT(*) as count,
            AVG(health_score) as avg_health_score
        FROM iot_devices 
        WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        GROUP BY device_type, status
    ),
    recent_alerts AS (
        SELECT COUNT(*) as alert_count
        FROM device_events de
        JOIN iot_devices d ON d.id = de.device_id
        WHERE de.severity IN ('critical', 'high') 
        AND de.created_at > now() - interval '24 hours'
        AND (p_tenant_id IS NULL OR d.tenant_id = p_tenant_id)
    )
    SELECT jsonb_build_object(
        'device_stats', jsonb_agg(row_to_json(device_stats)),
        'recent_alerts', (SELECT alert_count FROM recent_alerts),
        'generated_at', now()
    ) INTO result
    FROM device_stats;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
