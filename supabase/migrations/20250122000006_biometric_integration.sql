-- Biometric Integration System - Medium Priority Phase
-- Advanced Biometric Authentication and Identity Management

-- 1. Biometric Types and Standards
CREATE TABLE biometric_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  biometric_name VARCHAR(50) UNIQUE NOT NULL,
  biometric_code VARCHAR(10) UNIQUE NOT NULL, -- ISO/IEC 19794 codes
  description TEXT,
  accuracy_rating DECIMAL(5,4) DEFAULT 0.9500,
  false_acceptance_rate DECIMAL(8,6) DEFAULT 0.000100,
  false_rejection_rate DECIMAL(8,6) DEFAULT 0.010000,
  template_size_bytes INTEGER DEFAULT 1024,
  matching_speed_ms INTEGER DEFAULT 100,
  capture_time_seconds DECIMAL(4,2) DEFAULT 2.0,
  environmental_sensitivity VARCHAR(20) DEFAULT 'medium' CHECK (environmental_sensitivity IN ('low', 'medium', 'high')),
  liveness_detection BOOLEAN DEFAULT true,
  anti_spoofing_level INTEGER DEFAULT 3 CHECK (anti_spoofing_level BETWEEN 1 AND 5),
  encryption_required BOOLEAN DEFAULT true,
  gdpr_compliance BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Biometric Devices and Scanners
CREATE TABLE biometric_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_name VARCHAR(200) NOT NULL,
  device_model VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(100) NOT NULL,
  supported_biometric_types UUID[] NOT NULL, -- Array of biometric_types.id
  device_location VARCHAR(200),
  installation_date DATE DEFAULT CURRENT_DATE,
  firmware_version VARCHAR(50),
  api_endpoint TEXT,
  api_key_hash VARCHAR(128),
  device_status VARCHAR(20) DEFAULT 'active' CHECK (device_status IN ('active', 'inactive', 'maintenance', 'error')),
  last_calibration_date DATE,
  next_calibration_due DATE,
  performance_metrics JSONB DEFAULT '{}',
  security_certificates JSONB DEFAULT '{}',
  encryption_protocols TEXT[] DEFAULT ARRAY['AES-256', 'RSA-2048'],
  network_config JSONB DEFAULT '{}',
  backup_device_id UUID REFERENCES biometric_devices(id),
  maintenance_contract JSONB DEFAULT '{}',
  warranty_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Biometric Profiles
CREATE TABLE user_biometric_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- References users table
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  biometric_type_id UUID REFERENCES biometric_types(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  biometric_template_hash VARCHAR(128) NOT NULL, -- Encrypted/hashed template
  template_quality_score DECIMAL(5,4) DEFAULT 0.8000,
  enrollment_device_id UUID REFERENCES biometric_devices(id),
  template_version VARCHAR(20) DEFAULT '1.0',
  liveness_verified BOOLEAN DEFAULT false,
  verification_attempts INTEGER DEFAULT 0,
  successful_verifications INTEGER DEFAULT 0,
  last_verification_at TIMESTAMPTZ,
  template_encrypted BOOLEAN DEFAULT true,
  encryption_key_id VARCHAR(100),
  backup_templates JSONB DEFAULT '{}', -- Multiple template variations
  expiry_date DATE,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  privacy_settings JSONB DEFAULT '{}',
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, biometric_type_id, is_primary) WHERE is_primary = true
);

-- 4. Biometric Authentication Logs
CREATE TABLE biometric_authentication_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_biometric_profile_id UUID REFERENCES user_biometric_profiles(id) ON DELETE CASCADE,
  device_id UUID REFERENCES biometric_devices(id) ON DELETE CASCADE,
  authentication_timestamp TIMESTAMPTZ DEFAULT NOW(),
  authentication_result VARCHAR(20) NOT NULL CHECK (authentication_result IN ('success', 'failure', 'timeout', 'poor_quality', 'device_error', 'liveness_failed')),
  matching_score DECIMAL(8,6),
  quality_score DECIMAL(5,4),
  liveness_score DECIMAL(5,4),
  response_time_ms INTEGER,
  template_version_used VARCHAR(20),
  device_firmware_version VARCHAR(50),
  environmental_conditions JSONB DEFAULT '{}',
  security_flags JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(128),
  risk_assessment_score INTEGER CHECK (risk_assessment_score BETWEEN 0 AND 100),
  fraud_indicators JSONB DEFAULT '{}',
  audit_trail JSONB DEFAULT '{}',
  retention_period_days INTEGER DEFAULT 90
);

-- 5. Biometric Template Management
CREATE TABLE biometric_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_biometric_profile_id UUID REFERENCES user_biometric_profiles(id) ON DELETE CASCADE,
  template_data_encrypted BYTEA NOT NULL, -- Encrypted biometric template
  template_format VARCHAR(50) NOT NULL, -- ISO/IEC 19794 format
  compression_algorithm VARCHAR(50) DEFAULT 'lzma',
  template_size_bytes INTEGER NOT NULL,
  extraction_algorithm VARCHAR(100) NOT NULL,
  minutiae_count INTEGER, -- For fingerprints
  feature_vector_size INTEGER,
  template_quality_metrics JSONB DEFAULT '{}',
  enrollment_conditions JSONB DEFAULT '{}',
  template_variations INTEGER DEFAULT 1,
  fusion_template BOOLEAN DEFAULT false, -- Multi-modal template
  template_checksum VARCHAR(64) NOT NULL,
  encryption_method VARCHAR(50) DEFAULT 'AES-256-GCM',
  key_derivation_method VARCHAR(50) DEFAULT 'PBKDF2',
  salt_value VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Multimodal Biometric Fusion
CREATE TABLE biometric_fusion_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fusion_name VARCHAR(200) NOT NULL,
  primary_biometric_type UUID REFERENCES biometric_types(id) ON DELETE CASCADE,
  secondary_biometric_types UUID[] NOT NULL,
  fusion_algorithm VARCHAR(100) NOT NULL CHECK (fusion_algorithm IN ('score_level', 'feature_level', 'decision_level', 'hybrid')),
  weight_distribution JSONB NOT NULL, -- Weights for each biometric
  threshold_adjustment DECIMAL(5,4) DEFAULT 1.0,
  security_level INTEGER DEFAULT 3 CHECK (security_level BETWEEN 1 AND 5),
  use_cases TEXT[] DEFAULT ARRAY['high_security_access'],
  performance_metrics JSONB DEFAULT '{}',
  is_adaptive BOOLEAN DEFAULT false, -- Adaptive fusion based on conditions
  environmental_adaptation BOOLEAN DEFAULT false,
  user_behavior_adaptation BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Biometric Performance Analytics
CREATE TABLE biometric_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES biometric_devices(id) ON DELETE CASCADE,
  biometric_type_id UUID REFERENCES biometric_types(id) ON DELETE CASCADE,
  measurement_date DATE DEFAULT CURRENT_DATE,
  total_authentications INTEGER DEFAULT 0,
  successful_authentications INTEGER DEFAULT 0,
  failed_authentications INTEGER DEFAULT 0,
  false_acceptances INTEGER DEFAULT 0,
  false_rejections INTEGER DEFAULT 0,
  average_matching_score DECIMAL(8,6),
  average_quality_score DECIMAL(5,4),
  average_response_time_ms DECIMAL(8,2),
  template_corruption_incidents INTEGER DEFAULT 0,
  device_downtime_minutes INTEGER DEFAULT 0,
  calibration_drift_detected BOOLEAN DEFAULT false,
  environmental_impact_score DECIMAL(5,2),
  user_satisfaction_score DECIMAL(3,2) DEFAULT 4.0,
  security_incidents INTEGER DEFAULT 0,
  privacy_violations INTEGER DEFAULT 0,
  calculated_far DECIMAL(8,6), -- False Acceptance Rate
  calculated_frr DECIMAL(8,6), -- False Rejection Rate
  calculated_eer DECIMAL(8,6), -- Equal Error Rate
  performance_grade VARCHAR(2) DEFAULT 'B' CHECK (performance_grade IN ('A+', 'A', 'B', 'C', 'D', 'F'))
);

-- 8. Biometric Security Policies
CREATE TABLE biometric_security_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  policy_name VARCHAR(200) NOT NULL,
  biometric_types_allowed UUID[] NOT NULL,
  minimum_quality_threshold DECIMAL(5,4) DEFAULT 0.7000,
  maximum_authentication_attempts INTEGER DEFAULT 3,
  lockout_duration_minutes INTEGER DEFAULT 15,
  template_refresh_interval_days INTEGER DEFAULT 365,
  liveness_detection_required BOOLEAN DEFAULT true,
  anti_spoofing_level_required INTEGER DEFAULT 3,
  multimodal_fusion_required BOOLEAN DEFAULT false,
  encryption_requirements JSONB DEFAULT '{}',
  retention_policies JSONB DEFAULT '{}',
  audit_requirements JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  compliance_frameworks TEXT[] DEFAULT ARRAY['ISO27001', 'GDPR'],
  incident_response_procedures JSONB DEFAULT '{}',
  backup_authentication_methods TEXT[] DEFAULT ARRAY['password', 'pin'],
  emergency_override_protocols JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Biometric Privacy and Consent Management
CREATE TABLE biometric_consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('enrollment', 'verification', 'storage', 'processing', 'sharing', 'research')),
  biometric_types_consented UUID[] NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
  consent_expiry TIMESTAMPTZ,
  consent_scope TEXT NOT NULL,
  data_usage_purposes TEXT[] NOT NULL,
  withdrawal_allowed BOOLEAN DEFAULT true,
  consent_method VARCHAR(50) DEFAULT 'digital' CHECK (consent_method IN ('digital', 'written', 'verbal', 'implicit')),
  legal_basis VARCHAR(100),
  data_protection_impact_assessed BOOLEAN DEFAULT false,
  consent_evidence JSONB DEFAULT '{}',
  withdrawal_timestamp TIMESTAMPTZ,
  withdrawal_reason TEXT,
  compliance_verification JSONB DEFAULT '{}',
  retention_period_days INTEGER DEFAULT 2555, -- 7 years default
  anonymization_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Advanced Indexes for Performance
CREATE INDEX idx_biometric_auth_logs_user_timestamp ON biometric_authentication_logs (user_biometric_profile_id, authentication_timestamp DESC);
CREATE INDEX idx_biometric_auth_logs_device_result ON biometric_authentication_logs (device_id, authentication_result, authentication_timestamp DESC);
CREATE INDEX idx_biometric_auth_logs_risk_score ON biometric_authentication_logs (risk_assessment_score DESC, authentication_timestamp DESC);
CREATE INDEX idx_user_biometric_profiles_user_active ON user_biometric_profiles (user_id, is_active, is_primary);
CREATE INDEX idx_biometric_templates_profile_quality ON biometric_templates (user_biometric_profile_id, template_size_bytes);
CREATE INDEX idx_biometric_performance_device_date ON biometric_performance_metrics (device_id, measurement_date DESC);
CREATE INDEX idx_biometric_consent_user_type ON biometric_consent_records (user_id, consent_type, consent_given);

-- 11. Biometric Authentication Function
CREATE OR REPLACE FUNCTION authenticate_biometric(
  p_device_id UUID,
  p_biometric_template_hash VARCHAR(128),
  p_quality_score DECIMAL(5,4),
  p_liveness_score DECIMAL(5,4) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  auth_result JSONB;
  matched_profile RECORD;
  policy_config RECORD;
  authentication_success BOOLEAN := false;
  matching_score DECIMAL(8,6);
  risk_score INTEGER := 0;
BEGIN
  -- Get device information and associated policies
  SELECT bp.* INTO policy_config
  FROM biometric_devices bd
  JOIN biometric_security_policies bp ON bd.tenant_id = bp.tenant_id
  WHERE bd.id = p_device_id AND bp.is_active = true AND bp.is_default = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Device or security policy not found',
      'error_code', 'DEVICE_POLICY_ERROR'
    );
  END IF;

  -- Check quality threshold
  IF p_quality_score < policy_config.minimum_quality_threshold THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Biometric quality below threshold',
      'error_code', 'QUALITY_TOO_LOW',
      'quality_score', p_quality_score,
      'required_quality', policy_config.minimum_quality_threshold
    );
  END IF;

  -- Check liveness detection if required
  IF policy_config.liveness_detection_required AND 
     (p_liveness_score IS NULL OR p_liveness_score < 0.7) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Liveness detection failed',
      'error_code', 'LIVENESS_FAILED',
      'liveness_score', p_liveness_score
    );
  END IF;

  -- Attempt template matching (simplified - in reality would use specialized matching algorithms)
  SELECT ubp.*, u.id as user_id INTO matched_profile
  FROM user_biometric_profiles ubp
  JOIN users u ON ubp.user_id = u.id
  WHERE ubp.biometric_template_hash = p_biometric_template_hash
    AND ubp.is_active = true
    AND ubp.tenant_id = (SELECT tenant_id FROM biometric_devices WHERE id = p_device_id);

  IF FOUND THEN
    authentication_success := true;
    matching_score := 0.95 + (p_quality_score * 0.05); -- Simplified matching score
    
    -- Update profile statistics
    UPDATE user_biometric_profiles
    SET verification_attempts = verification_attempts + 1,
        successful_verifications = successful_verifications + 1,
        last_verification_at = NOW()
    WHERE id = matched_profile.id;
    
  ELSE
    matching_score := 0.0;
    risk_score := 30; -- Unknown user increases risk
  END IF;

  -- Calculate risk assessment
  IF authentication_success THEN
    -- Low risk for successful authentication with good scores
    risk_score := CASE 
      WHEN p_quality_score > 0.9 AND p_liveness_score > 0.9 THEN 5
      WHEN p_quality_score > 0.8 THEN 10
      ELSE 20
    END;
  END IF;

  -- Log authentication attempt
  INSERT INTO biometric_authentication_logs (
    user_biometric_profile_id,
    device_id,
    authentication_result,
    matching_score,
    quality_score,
    liveness_score,
    risk_assessment_score
  ) VALUES (
    matched_profile.id,
    p_device_id,
    CASE WHEN authentication_success THEN 'success' ELSE 'failure' END,
    matching_score,
    p_quality_score,
    p_liveness_score,
    risk_score
  );

  -- Build response
  auth_result := jsonb_build_object(
    'success', authentication_success,
    'user_id', CASE WHEN authentication_success THEN matched_profile.user_id ELSE NULL END,
    'matching_score', matching_score,
    'quality_score', p_quality_score,
    'liveness_score', p_liveness_score,
    'risk_score', risk_score,
    'authentication_timestamp', NOW()
  );

  IF NOT authentication_success THEN
    auth_result := auth_result || jsonb_build_object(
      'error', 'Biometric template not found or not matching',
      'error_code', 'TEMPLATE_NOT_MATCHED'
    );
  END IF;

  RETURN auth_result;
END;
$$ LANGUAGE plpgsql;

-- 12. Biometric Performance Analysis Function
CREATE OR REPLACE FUNCTION analyze_biometric_performance(
  p_device_id UUID,
  p_analysis_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  performance_data JSONB;
  total_auths INTEGER;
  successful_auths INTEGER;
  avg_response_time DECIMAL(8,2);
  calculated_far DECIMAL(8,6);
  calculated_frr DECIMAL(8,6);
BEGIN
  -- Calculate performance metrics
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN authentication_result = 'success' THEN 1 END) as successful,
    AVG(response_time_ms) as avg_time
  INTO total_auths, successful_auths, avg_response_time
  FROM biometric_authentication_logs
  WHERE device_id = p_device_id
    AND authentication_timestamp > NOW() - INTERVAL '1 day' * p_analysis_days;

  -- Calculate error rates (simplified calculation)
  calculated_far := CASE 
    WHEN total_auths > 0 THEN 
      (SELECT COUNT(*)::decimal / total_auths 
       FROM biometric_authentication_logs 
       WHERE device_id = p_device_id 
         AND authentication_result = 'success' 
         AND matching_score < 0.5) -- False acceptance threshold
    ELSE 0
  END;

  calculated_frr := CASE 
    WHEN total_auths > 0 THEN 
      (SELECT COUNT(*)::decimal / total_auths 
       FROM biometric_authentication_logs 
       WHERE device_id = p_device_id 
         AND authentication_result = 'failure' 
         AND matching_score > 0.8) -- False rejection threshold
    ELSE 0
  END;

  performance_data := jsonb_build_object(
    'analysis_period_days', p_analysis_days,
    'total_authentications', total_auths,
    'successful_authentications', successful_auths,
    'success_rate_percent', CASE WHEN total_auths > 0 THEN ROUND((successful_auths::decimal / total_auths) * 100, 2) ELSE 0 END,
    'average_response_time_ms', COALESCE(avg_response_time, 0),
    'false_acceptance_rate', calculated_far,
    'false_rejection_rate', calculated_frr,
    'equal_error_rate', (calculated_far + calculated_frr) / 2,
    'performance_grade', CASE 
      WHEN calculated_far + calculated_frr < 0.01 THEN 'A+'
      WHEN calculated_far + calculated_frr < 0.02 THEN 'A'
      WHEN calculated_far + calculated_frr < 0.05 THEN 'B'
      WHEN calculated_far + calculated_frr < 0.10 THEN 'C'
      ELSE 'D'
    END,
    'analysis_timestamp', NOW()
  );

  -- Update performance metrics table
  INSERT INTO biometric_performance_metrics (
    device_id, measurement_date, total_authentications, successful_authentications,
    average_response_time_ms, calculated_far, calculated_frr, calculated_eer
  ) VALUES (
    p_device_id, CURRENT_DATE, total_auths, successful_auths,
    avg_response_time, calculated_far, calculated_frr, (calculated_far + calculated_frr) / 2
  ) ON CONFLICT (device_id, measurement_date) DO UPDATE SET
    total_authentications = EXCLUDED.total_authentications,
    successful_authentications = EXCLUDED.successful_authentications,
    average_response_time_ms = EXCLUDED.average_response_time_ms,
    calculated_far = EXCLUDED.calculated_far,
    calculated_frr = EXCLUDED.calculated_frr,
    calculated_eer = EXCLUDED.calculated_eer;

  RETURN performance_data;
END;
$$ LANGUAGE plpgsql;

-- 13. Insert Sample Biometric Types
INSERT INTO biometric_types (biometric_name, biometric_code, description, accuracy_rating, false_acceptance_rate, false_rejection_rate) VALUES
('Fingerprint', 'FP', 'Fingerprint recognition using minutiae patterns', 0.9800, 0.000010, 0.005000),
('Face Recognition', 'FACE', 'Facial feature recognition and matching', 0.9500, 0.000100, 0.010000),
('Iris Scan', 'IRIS', 'Iris pattern recognition and authentication', 0.9900, 0.000001, 0.001000),
('Voice Recognition', 'VOICE', 'Voice pattern and speech recognition', 0.9200, 0.001000, 0.020000),
('Palm Print', 'PALM', 'Palm print pattern recognition', 0.9600, 0.000050, 0.008000),
('Hand Geometry', 'HAND', 'Hand shape and finger measurements', 0.8800, 0.002000, 0.015000),
('Retina Scan', 'RETINA', 'Retinal blood vessel pattern recognition', 0.9950, 0.0000005, 0.0005000),
('Signature', 'SIG', 'Dynamic signature verification', 0.8500, 0.005000, 0.050000);

-- 14. RLS Policies
ALTER TABLE biometric_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_biometric_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_authentication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_fusion_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_consent_records ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY user_biometric_profiles_tenant_isolation ON user_biometric_profiles
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY biometric_security_policies_tenant_isolation ON biometric_security_policies
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY biometric_consent_records_tenant_isolation ON biometric_consent_records
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

-- Service role access for system operations
CREATE POLICY biometric_types_service_role ON biometric_types
  USING (auth.role() = 'service_role');

CREATE POLICY biometric_devices_service_role ON biometric_devices
  USING (auth.role() = 'service_role');

CREATE POLICY biometric_auth_logs_service_role ON biometric_authentication_logs
  USING (auth.role() = 'service_role');

COMMENT ON TABLE biometric_types IS 'Supported biometric authentication types and their characteristics';
COMMENT ON TABLE biometric_devices IS 'Biometric capture and authentication devices';
COMMENT ON TABLE user_biometric_profiles IS 'User biometric enrollment and profile management';
COMMENT ON TABLE biometric_authentication_logs IS 'Audit log of all biometric authentication attempts';
COMMENT ON TABLE biometric_templates IS 'Encrypted storage of biometric templates';
COMMENT ON TABLE biometric_fusion_configs IS 'Multimodal biometric fusion configurations';
COMMENT ON TABLE biometric_performance_metrics IS 'Performance analytics for biometric systems';
COMMENT ON TABLE biometric_security_policies IS 'Security policies and compliance rules';
COMMENT ON TABLE biometric_consent_records IS 'Privacy and consent management for biometric data';
