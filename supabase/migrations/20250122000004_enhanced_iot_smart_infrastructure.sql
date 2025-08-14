-- Enhanced IoT & Smart Infrastructure - Medium Priority Phase
-- Advanced IoT Device Management and Smart Building Integration

-- 1. Advanced IoT Device Categories and Specifications
CREATE TABLE iot_device_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name VARCHAR(100) UNIQUE NOT NULL,
  category_description TEXT,
  default_protocols TEXT[] DEFAULT ARRAY['mqtt', 'http'],
  power_requirements VARCHAR(50),
  connectivity_type VARCHAR(50) DEFAULT 'wifi' CHECK (connectivity_type IN ('wifi', 'ethernet', 'cellular', 'lora', 'zigbee', 'bluetooth')),
  security_level INTEGER DEFAULT 3 CHECK (security_level BETWEEN 1 AND 5),
  maintenance_interval_days INTEGER DEFAULT 30,
  expected_lifespan_years INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. IoT Device Firmware Management
CREATE TABLE iot_device_firmware (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_category_id UUID REFERENCES iot_device_categories(id) ON DELETE CASCADE,
  firmware_version VARCHAR(50) NOT NULL,
  firmware_url TEXT NOT NULL,
  firmware_hash VARCHAR(128) NOT NULL,
  release_notes TEXT,
  is_stable BOOLEAN DEFAULT false,
  is_security_update BOOLEAN DEFAULT false,
  min_device_version VARCHAR(50),
  compatibility_matrix JSONB DEFAULT '{}',
  download_size_mb DECIMAL(10,2),
  installation_time_minutes INTEGER DEFAULT 15,
  rollback_supported BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Smart Building Zones and Areas
CREATE TABLE smart_building_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  zone_name VARCHAR(100) NOT NULL,
  zone_type VARCHAR(50) DEFAULT 'general' CHECK (zone_type IN ('entrance', 'lobby', 'office', 'parking', 'security', 'utility', 'outdoor', 'general')),
  floor_level INTEGER DEFAULT 1,
  zone_coordinates JSONB, -- GeoJSON polygon for zone boundaries
  environmental_settings JSONB DEFAULT '{}', -- Temperature, humidity, lighting preferences
  access_restrictions JSONB DEFAULT '{}',
  emergency_protocols JSONB DEFAULT '{}',
  occupancy_limits INTEGER DEFAULT 50,
  is_monitored BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Advanced Device Health Monitoring
CREATE TABLE device_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES iot_devices(id) ON DELETE CASCADE,
  metric_timestamp TIMESTAMPTZ DEFAULT NOW(),
  cpu_usage_percent DECIMAL(5,2),
  memory_usage_percent DECIMAL(5,2),
  disk_usage_percent DECIMAL(5,2),
  network_latency_ms INTEGER,
  signal_strength_dbm INTEGER,
  temperature_celsius DECIMAL(5,2),
  voltage_level DECIMAL(6,3),
  battery_level_percent DECIMAL(5,2),
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  uptime_seconds BIGINT,
  firmware_version VARCHAR(50),
  last_maintenance_date DATE,
  health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
  prediction_confidence DECIMAL(3,2) DEFAULT 0.5,
  next_maintenance_prediction DATE
);

-- 5. IoT Device Automation Rules
CREATE TABLE device_automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  rule_name VARCHAR(200) NOT NULL,
  rule_description TEXT,
  trigger_conditions JSONB NOT NULL, -- Complex trigger logic
  target_devices UUID[] NOT NULL, -- Array of device IDs
  actions JSONB NOT NULL, -- Actions to execute
  schedule_expression VARCHAR(100), -- Cron-like schedule
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  cooldown_minutes INTEGER DEFAULT 5,
  max_executions_per_hour INTEGER DEFAULT 60,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Smart Gate Advanced Features
CREATE TABLE smart_gate_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gate_id UUID REFERENCES iot_devices(id) ON DELETE CASCADE,
  profile_name VARCHAR(100) NOT NULL,
  operating_hours JSONB DEFAULT '{"start": "06:00", "end": "22:00"}',
  access_modes JSONB DEFAULT '["card", "biometric", "mobile", "visitor_code"]',
  security_level INTEGER DEFAULT 3 CHECK (security_level BETWEEN 1 AND 5),
  auto_close_delay_seconds INTEGER DEFAULT 10,
  max_open_duration_seconds INTEGER DEFAULT 300,
  tailgating_detection BOOLEAN DEFAULT true,
  forced_entry_detection BOOLEAN DEFAULT true,
  emergency_protocols JSONB DEFAULT '{}',
  integration_settings JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Environmental Monitoring Sensors
CREATE TABLE environmental_sensors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID REFERENCES smart_building_zones(id) ON DELETE CASCADE,
  sensor_type VARCHAR(50) NOT NULL CHECK (sensor_type IN ('temperature', 'humidity', 'air_quality', 'noise', 'light', 'motion', 'smoke', 'gas', 'vibration')),
  sensor_model VARCHAR(100),
  installation_date DATE DEFAULT CURRENT_DATE,
  calibration_date DATE,
  measurement_unit VARCHAR(20) NOT NULL,
  min_threshold DECIMAL(10,4),
  max_threshold DECIMAL(10,4),
  alert_threshold DECIMAL(10,4),
  accuracy_rating DECIMAL(3,2) DEFAULT 0.95,
  maintenance_schedule VARCHAR(50) DEFAULT 'monthly',
  is_critical BOOLEAN DEFAULT false,
  backup_sensor_id UUID REFERENCES environmental_sensors(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Real-time Environmental Data
CREATE TABLE environmental_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sensor_id UUID REFERENCES environmental_sensors(id) ON DELETE CASCADE,
  reading_timestamp TIMESTAMPTZ DEFAULT NOW(),
  raw_value DECIMAL(15,6) NOT NULL,
  processed_value DECIMAL(15,6),
  quality_score DECIMAL(3,2) DEFAULT 1.0,
  anomaly_detected BOOLEAN DEFAULT false,
  anomaly_confidence DECIMAL(3,2),
  calibration_offset DECIMAL(10,6) DEFAULT 0,
  data_source VARCHAR(50) DEFAULT 'sensor',
  transmission_delay_ms INTEGER,
  battery_level DECIMAL(5,2),
  signal_quality INTEGER CHECK (signal_quality BETWEEN 0 AND 100)
);

-- 9. Predictive Maintenance System
CREATE TABLE maintenance_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES iot_devices(id) ON DELETE CASCADE,
  prediction_type VARCHAR(50) NOT NULL CHECK (prediction_type IN ('failure', 'maintenance', 'calibration', 'replacement', 'upgrade')),
  predicted_date DATE NOT NULL,
  confidence_level DECIMAL(3,2) NOT NULL CHECK (confidence_level BETWEEN 0 AND 1),
  severity_level INTEGER DEFAULT 3 CHECK (severity_level BETWEEN 1 AND 5),
  estimated_cost DECIMAL(10,2),
  estimated_downtime_hours DECIMAL(6,2),
  recommended_action TEXT NOT NULL,
  data_points_used INTEGER,
  algorithm_version VARCHAR(20),
  prediction_accuracy DECIMAL(3,2),
  is_validated BOOLEAN DEFAULT false,
  actual_outcome VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Smart Building Energy Management
CREATE TABLE energy_consumption_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID REFERENCES smart_building_zones(id) ON DELETE CASCADE,
  device_id UUID REFERENCES iot_devices(id) ON DELETE CASCADE,
  measurement_timestamp TIMESTAMPTZ DEFAULT NOW(),
  power_consumption_watts DECIMAL(10,3),
  voltage_volts DECIMAL(8,3),
  current_amperes DECIMAL(8,3),
  power_factor DECIMAL(4,3),
  energy_cost_per_hour DECIMAL(8,4),
  carbon_footprint_kg DECIMAL(10,6),
  efficiency_rating DECIMAL(3,2),
  peak_demand_indicator BOOLEAN DEFAULT false,
  renewable_energy_percent DECIMAL(5,2) DEFAULT 0,
  grid_dependency_percent DECIMAL(5,2) DEFAULT 100
);

-- 11. Advanced Indexes for Performance
CREATE INDEX idx_device_health_device_timestamp ON device_health_metrics (device_id, metric_timestamp DESC);
CREATE INDEX idx_environmental_readings_sensor_timestamp ON environmental_readings (sensor_id, reading_timestamp DESC);
CREATE INDEX idx_environmental_readings_anomaly ON environmental_readings (anomaly_detected, reading_timestamp DESC) WHERE anomaly_detected = true;
CREATE INDEX idx_automation_rules_active_priority ON device_automation_rules (is_active, priority DESC) WHERE is_active = true;
CREATE INDEX idx_maintenance_predictions_date_confidence ON maintenance_predictions (predicted_date, confidence_level DESC);
CREATE INDEX idx_energy_consumption_zone_timestamp ON energy_consumption_tracking (zone_id, measurement_timestamp DESC);

-- 12. IoT Device Management Functions
CREATE OR REPLACE FUNCTION update_device_health_score(p_device_id UUID)
RETURNS INTEGER AS $$
DECLARE
  health_score INTEGER;
  latest_metrics RECORD;
BEGIN
  -- Get latest health metrics
  SELECT * INTO latest_metrics
  FROM device_health_metrics
  WHERE device_id = p_device_id
  ORDER BY metric_timestamp DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calculate health score based on multiple factors
  health_score := 100;
  
  -- CPU usage impact
  IF latest_metrics.cpu_usage_percent > 90 THEN
    health_score := health_score - 20;
  ELSIF latest_metrics.cpu_usage_percent > 70 THEN
    health_score := health_score - 10;
  END IF;

  -- Memory usage impact
  IF latest_metrics.memory_usage_percent > 85 THEN
    health_score := health_score - 15;
  ELSIF latest_metrics.memory_usage_percent > 70 THEN
    health_score := health_score - 5;
  END IF;

  -- Error count impact
  health_score := health_score - (latest_metrics.error_count * 2);
  health_score := health_score - latest_metrics.warning_count;

  -- Battery level impact (if applicable)
  IF latest_metrics.battery_level_percent IS NOT NULL THEN
    IF latest_metrics.battery_level_percent < 20 THEN
      health_score := health_score - 25;
    ELSIF latest_metrics.battery_level_percent < 50 THEN
      health_score := health_score - 10;
    END IF;
  END IF;

  -- Ensure score is within bounds
  health_score := GREATEST(0, LEAST(100, health_score));

  -- Update the health score
  UPDATE device_health_metrics
  SET health_score = health_score
  WHERE device_id = p_device_id
    AND metric_timestamp = latest_metrics.metric_timestamp;

  RETURN health_score;
END;
$$ LANGUAGE plpgsql;

-- 13. Environmental Anomaly Detection Function
CREATE OR REPLACE FUNCTION detect_environmental_anomalies(
  p_sensor_id UUID,
  p_hours_lookback INTEGER DEFAULT 24
)
RETURNS TABLE (
  reading_id UUID,
  anomaly_type VARCHAR(50),
  severity INTEGER,
  deviation_percentage DECIMAL(5,2)
) AS $$
DECLARE
  avg_value DECIMAL(15,6);
  std_dev DECIMAL(15,6);
  threshold_multiplier DECIMAL(3,1) := 2.5;
BEGIN
  -- Calculate baseline statistics
  SELECT AVG(processed_value), STDDEV(processed_value)
  INTO avg_value, std_dev
  FROM environmental_readings
  WHERE sensor_id = p_sensor_id
    AND reading_timestamp > NOW() - INTERVAL '1 hour' * p_hours_lookback
    AND anomaly_detected = false;

  -- Return anomalous readings
  RETURN QUERY
  SELECT 
    er.id,
    CASE 
      WHEN er.processed_value > avg_value + (std_dev * threshold_multiplier) THEN 'high_value'
      WHEN er.processed_value < avg_value - (std_dev * threshold_multiplier) THEN 'low_value'
      WHEN er.quality_score < 0.8 THEN 'poor_quality'
      ELSE 'unknown'
    END as anomaly_type,
    CASE 
      WHEN ABS(er.processed_value - avg_value) > (std_dev * 3) THEN 5
      WHEN ABS(er.processed_value - avg_value) > (std_dev * 2.5) THEN 4
      WHEN ABS(er.processed_value - avg_value) > (std_dev * 2) THEN 3
      WHEN er.quality_score < 0.5 THEN 4
      WHEN er.quality_score < 0.8 THEN 2
      ELSE 1
    END as severity,
    ROUND(
      ABS(er.processed_value - avg_value) / NULLIF(avg_value, 0) * 100, 2
    ) as deviation_percentage
  FROM environmental_readings er
  WHERE er.sensor_id = p_sensor_id
    AND er.reading_timestamp > NOW() - INTERVAL '1 hour'
    AND (
      er.processed_value > avg_value + (std_dev * threshold_multiplier) OR
      er.processed_value < avg_value - (std_dev * threshold_multiplier) OR
      er.quality_score < 0.8
    );
END;
$$ LANGUAGE plpgsql;

-- 14. Smart Gate Automation Function
CREATE OR REPLACE FUNCTION execute_automation_rule(p_rule_id UUID)
RETURNS JSONB AS $$
DECLARE
  rule_data RECORD;
  execution_result JSONB := '{}';
  device_count INTEGER := 0;
BEGIN
  -- Get rule details
  SELECT * INTO rule_data
  FROM device_automation_rules
  WHERE id = p_rule_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rule not found or inactive');
  END IF;

  -- Check cooldown period
  IF rule_data.last_executed_at IS NOT NULL AND 
     rule_data.last_executed_at > NOW() - INTERVAL '1 minute' * rule_data.cooldown_minutes THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rule in cooldown period');
  END IF;

  -- Execute actions on target devices
  SELECT COUNT(*) INTO device_count
  FROM iot_devices
  WHERE id = ANY(rule_data.target_devices)
    AND device_status = 'online';

  -- Update execution tracking
  UPDATE device_automation_rules
  SET execution_count = execution_count + 1,
      last_executed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_rule_id;

  -- Log the execution
  INSERT INTO audit_logs (action_type, details, created_at)
  VALUES (
    'automation_rule_executed',
    jsonb_build_object(
      'rule_id', p_rule_id,
      'rule_name', rule_data.rule_name,
      'affected_devices', device_count,
      'actions', rule_data.actions
    ),
    NOW()
  );

  execution_result := jsonb_build_object(
    'success', true,
    'rule_name', rule_data.rule_name,
    'devices_affected', device_count,
    'execution_time', NOW()
  );

  RETURN execution_result;
END;
$$ LANGUAGE plpgsql;

-- 15. Insert Sample Data
INSERT INTO iot_device_categories (category_name, category_description, default_protocols, connectivity_type, security_level) VALUES
('Smart Gate Controller', 'Automated gate access control system', ARRAY['mqtt', 'http', 'websocket'], 'ethernet', 5),
('Environmental Sensor', 'Multi-parameter environmental monitoring', ARRAY['mqtt', 'lora'], 'wifi', 4),
('Security Camera', 'High-definition surveillance camera with AI', ARRAY['rtsp', 'http'], 'ethernet', 5),
('Access Card Reader', 'RFID/NFC card reader for access control', ARRAY['wiegand', 'tcp'], 'ethernet', 4),
('Motion Detector', 'PIR motion detection sensor', ARRAY['mqtt', 'zigbee'], 'zigbee', 3),
('Smart Lock', 'Electronic door lock with multiple access methods', ARRAY['bluetooth', 'wifi'], 'wifi', 5),
('Lighting Controller', 'Smart lighting management system', ARRAY['mqtt', 'dmx'], 'wifi', 2),
('Intercom System', 'Two-way communication system', ARRAY['sip', 'http'], 'ethernet', 4);

-- 16. RLS Policies
ALTER TABLE iot_device_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_building_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_consumption_tracking ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY smart_building_zones_tenant_isolation ON smart_building_zones
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY device_automation_rules_tenant_isolation ON device_automation_rules
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

-- Service role access
CREATE POLICY iot_categories_service_role ON iot_device_categories
  USING (auth.role() = 'service_role');

CREATE POLICY device_health_service_role ON device_health_metrics
  USING (auth.role() = 'service_role');

COMMENT ON TABLE iot_device_categories IS 'Comprehensive IoT device categorization and specifications';
COMMENT ON TABLE smart_building_zones IS 'Smart building zone management with environmental controls';
COMMENT ON TABLE device_health_metrics IS 'Advanced device health monitoring and predictive analytics';
COMMENT ON TABLE device_automation_rules IS 'Complex automation rules for IoT device coordination';
COMMENT ON TABLE environmental_sensors IS 'Environmental monitoring sensor network';
COMMENT ON TABLE maintenance_predictions IS 'AI-powered predictive maintenance system';
