-- Predictive Analytics Suite - Medium Priority Phase
-- Advanced Analytics, Machine Learning, and Predictive Insights

-- 1. Analytics Models and Algorithms
CREATE TABLE analytics_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name VARCHAR(200) UNIQUE NOT NULL,
  model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('classification', 'regression', 'clustering', 'anomaly_detection', 'time_series', 'recommendation')),
  model_category VARCHAR(50) NOT NULL CHECK (model_category IN ('visitor_behavior', 'security', 'maintenance', 'energy', 'occupancy', 'traffic')),
  algorithm VARCHAR(100) NOT NULL,
  model_version VARCHAR(20) NOT NULL,
  training_data_source TEXT,
  feature_columns TEXT[] NOT NULL,
  target_column VARCHAR(100),
  model_parameters JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  accuracy_score DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall_score DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  is_production_ready BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  training_start_date TIMESTAMPTZ,
  training_end_date TIMESTAMPTZ,
  last_trained_at TIMESTAMPTZ,
  next_training_scheduled TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Prediction Results and Insights
CREATE TABLE prediction_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES analytics_models(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  prediction_type VARCHAR(100) NOT NULL,
  input_data JSONB NOT NULL,
  prediction_output JSONB NOT NULL,
  confidence_score DECIMAL(5,4) NOT NULL,
  prediction_date TIMESTAMPTZ DEFAULT NOW(),
  prediction_horizon INTEGER, -- Hours/days into future
  actual_outcome JSONB,
  outcome_recorded_at TIMESTAMPTZ,
  prediction_accuracy DECIMAL(5,4),
  is_validated BOOLEAN DEFAULT false,
  feedback_score INTEGER CHECK (feedback_score BETWEEN 1 AND 5),
  business_impact_score DECIMAL(8,2),
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Visitor Behavior Analytics
CREATE TABLE visitor_behavior_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  pattern_name VARCHAR(200) NOT NULL,
  pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('arrival_time', 'visit_duration', 'frequency', 'route', 'interaction', 'seasonal')),
  time_period VARCHAR(50) DEFAULT 'daily' CHECK (time_period IN ('hourly', 'daily', 'weekly', 'monthly', 'seasonal', 'yearly')),
  pattern_data JSONB NOT NULL,
  statistical_significance DECIMAL(5,4),
  sample_size INTEGER,
  correlation_strength DECIMAL(5,4),
  trend_direction VARCHAR(20) CHECK (trend_direction IN ('increasing', 'decreasing', 'stable', 'cyclical')),
  seasonality_detected BOOLEAN DEFAULT false,
  anomaly_threshold DECIMAL(8,4),
  business_insights TEXT,
  recommendations TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Security Risk Scoring
CREATE TABLE security_risk_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('visitor', 'device', 'access_pattern', 'system', 'overall')),
  entity_id UUID, -- Could reference visitors, devices, etc.
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  risk_level VARCHAR(20) CHECK (risk_level IN ('very_low', 'low', 'medium', 'high', 'critical')),
  risk_factors JSONB NOT NULL,
  contributing_factors TEXT[],
  mitigation_suggestions TEXT[],
  automated_actions_taken JSONB DEFAULT '{}',
  manual_review_required BOOLEAN DEFAULT false,
  assessment_confidence DECIMAL(5,4),
  false_positive_likelihood DECIMAL(5,4),
  historical_context JSONB DEFAULT '{}',
  assessment_timestamp TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Occupancy and Traffic Analytics
CREATE TABLE occupancy_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID REFERENCES smart_building_zones(id) ON DELETE CASCADE,
  measurement_timestamp TIMESTAMPTZ DEFAULT NOW(),
  current_occupancy INTEGER DEFAULT 0,
  max_capacity INTEGER NOT NULL,
  occupancy_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN max_capacity > 0 THEN (current_occupancy::decimal / max_capacity) * 100 ELSE 0 END
  ) STORED,
  predicted_peak_time TIME,
  predicted_peak_occupancy INTEGER,
  average_dwell_time_minutes DECIMAL(8,2),
  turnover_rate DECIMAL(6,4),
  congestion_level VARCHAR(20) DEFAULT 'normal' CHECK (congestion_level IN ('low', 'normal', 'high', 'critical')),
  environmental_impact_score DECIMAL(5,2),
  energy_consumption_correlation DECIMAL(5,4),
  weather_correlation DECIMAL(5,4),
  event_correlation JSONB DEFAULT '{}',
  optimization_suggestions TEXT[]
);

-- 6. Energy Consumption Predictions
CREATE TABLE energy_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES smart_building_zones(id) ON DELETE CASCADE,
  prediction_timestamp TIMESTAMPTZ DEFAULT NOW(),
  prediction_period VARCHAR(20) DEFAULT 'daily' CHECK (prediction_period IN ('hourly', 'daily', 'weekly', 'monthly')),
  predicted_consumption_kwh DECIMAL(10,4) NOT NULL,
  predicted_cost DECIMAL(10,2),
  confidence_interval_lower DECIMAL(10,4),
  confidence_interval_upper DECIMAL(10,4),
  weather_factors JSONB DEFAULT '{}',
  occupancy_factors JSONB DEFAULT '{}',
  equipment_factors JSONB DEFAULT '{}',
  seasonal_adjustments DECIMAL(6,4) DEFAULT 1.0,
  optimization_potential_percent DECIMAL(5,2),
  recommended_actions TEXT[],
  carbon_footprint_kg DECIMAL(10,6),
  renewable_energy_potential DECIMAL(5,2),
  peak_demand_prediction TIMESTAMPTZ,
  load_balancing_suggestions JSONB DEFAULT '{}'
);

-- 7. Maintenance Optimization Analytics
CREATE TABLE maintenance_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES iot_devices(id) ON DELETE CASCADE,
  analysis_timestamp TIMESTAMPTZ DEFAULT NOW(),
  failure_probability DECIMAL(5,4) NOT NULL,
  time_to_failure_days INTEGER,
  maintenance_urgency VARCHAR(20) DEFAULT 'normal' CHECK (maintenance_urgency IN ('immediate', 'urgent', 'normal', 'scheduled', 'deferred')),
  cost_of_delay DECIMAL(10,2),
  optimal_maintenance_window JSONB DEFAULT '{}',
  resource_requirements JSONB DEFAULT '{}',
  downtime_impact_score DECIMAL(5,2),
  parts_availability JSONB DEFAULT '{}',
  technician_skill_required VARCHAR(50),
  maintenance_complexity INTEGER CHECK (maintenance_complexity BETWEEN 1 AND 5),
  historical_mtbf_days INTEGER, -- Mean Time Between Failures
  wear_pattern_analysis JSONB DEFAULT '{}',
  environmental_impact_factors JSONB DEFAULT '{}',
  warranty_considerations JSONB DEFAULT '{}'
);

-- 8. Business Intelligence Dashboards
CREATE TABLE analytics_dashboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  dashboard_name VARCHAR(200) NOT NULL,
  dashboard_type VARCHAR(50) NOT NULL CHECK (dashboard_type IN ('executive', 'operational', 'technical', 'compliance', 'custom')),
  target_audience VARCHAR(100),
  widget_configuration JSONB NOT NULL,
  data_sources TEXT[] NOT NULL,
  refresh_interval_minutes INTEGER DEFAULT 15,
  real_time_updates BOOLEAN DEFAULT false,
  access_permissions JSONB DEFAULT '{}',
  sharing_settings JSONB DEFAULT '{}',
  export_formats TEXT[] DEFAULT ARRAY['pdf', 'excel', 'csv'],
  automated_reports JSONB DEFAULT '{}',
  alert_thresholds JSONB DEFAULT '{}',
  custom_kpis JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Predictive Alerts and Notifications
CREATE TABLE predictive_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('maintenance', 'security', 'capacity', 'energy', 'anomaly', 'performance')),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 5),
  alert_title VARCHAR(200) NOT NULL,
  alert_description TEXT NOT NULL,
  prediction_confidence DECIMAL(5,4),
  time_to_event_hours INTEGER,
  potential_impact TEXT,
  recommended_actions TEXT[],
  automated_response JSONB DEFAULT '{}',
  escalation_rules JSONB DEFAULT '{}',
  acknowledgment_required BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolution_status VARCHAR(20) DEFAULT 'open' CHECK (resolution_status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'false_positive')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Advanced Analytics Indexes
CREATE INDEX idx_prediction_results_model_date ON prediction_results (model_id, prediction_date DESC);
CREATE INDEX idx_prediction_results_tenant_type ON prediction_results (tenant_id, prediction_type, prediction_date DESC);
CREATE INDEX idx_visitor_behavior_tenant_type ON visitor_behavior_patterns (tenant_id, pattern_type, last_updated DESC);
CREATE INDEX idx_security_risk_tenant_level ON security_risk_assessments (tenant_id, risk_level, assessment_timestamp DESC);
CREATE INDEX idx_occupancy_analytics_zone_timestamp ON occupancy_analytics (zone_id, measurement_timestamp DESC);
CREATE INDEX idx_energy_predictions_zone_period ON energy_predictions (zone_id, prediction_period, prediction_timestamp DESC);
CREATE INDEX idx_maintenance_analytics_device_probability ON maintenance_analytics (device_id, failure_probability DESC);
CREATE INDEX idx_predictive_alerts_severity_status ON predictive_alerts (severity_level DESC, resolution_status, created_at DESC);

-- 11. Analytics Calculation Functions
CREATE OR REPLACE FUNCTION calculate_visitor_behavior_score(
  p_tenant_id UUID,
  p_visitor_id UUID
)
RETURNS JSONB AS $$
DECLARE
  behavior_score JSONB;
  visit_frequency INTEGER;
  avg_visit_duration DECIMAL(8,2);
  punctuality_score DECIMAL(5,2);
  compliance_score DECIMAL(5,2);
BEGIN
  -- Calculate visit frequency (last 90 days)
  SELECT COUNT(*) INTO visit_frequency
  FROM visitors
  WHERE id = p_visitor_id
    AND created_at > NOW() - INTERVAL '90 days';

  -- Calculate average visit duration
  SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(checked_out_at, NOW()) - checked_in_at)) / 3600)
  INTO avg_visit_duration
  FROM visitors
  WHERE id = p_visitor_id
    AND checked_in_at IS NOT NULL;

  -- Calculate punctuality score (based on scheduled vs actual arrival)
  SELECT AVG(
    CASE 
      WHEN ABS(EXTRACT(EPOCH FROM (checked_in_at - created_at)) / 60) <= 15 THEN 100
      WHEN ABS(EXTRACT(EPOCH FROM (checked_in_at - created_at)) / 60) <= 30 THEN 80
      WHEN ABS(EXTRACT(EPOCH FROM (checked_in_at - created_at)) / 60) <= 60 THEN 60
      ELSE 40
    END
  ) INTO punctuality_score
  FROM visitors
  WHERE id = p_visitor_id
    AND checked_in_at IS NOT NULL;

  -- Calculate compliance score (security violations, etc.)
  compliance_score := 100; -- Default high score, reduce based on violations

  behavior_score := jsonb_build_object(
    'visit_frequency', COALESCE(visit_frequency, 0),
    'avg_visit_duration_hours', COALESCE(avg_visit_duration, 0),
    'punctuality_score', COALESCE(punctuality_score, 0),
    'compliance_score', compliance_score,
    'overall_score', ROUND(
      (COALESCE(punctuality_score, 0) + compliance_score) / 2, 2
    ),
    'calculated_at', NOW()
  );

  RETURN behavior_score;
END;
$$ LANGUAGE plpgsql;

-- 12. Security Risk Calculation Function
CREATE OR REPLACE FUNCTION calculate_security_risk_score(
  p_entity_type VARCHAR(50),
  p_entity_id UUID,
  p_tenant_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  risk_score INTEGER := 0;
  base_score INTEGER := 20; -- Default low risk
  risk_factors JSONB := '{}';
BEGIN
  -- Calculate risk based on entity type
  CASE p_entity_type
    WHEN 'visitor' THEN
      -- Visitor-specific risk factors
      SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN 40 -- First-time visitor
          WHEN COUNT(*) BETWEEN 1 AND 5 THEN 25 -- Occasional visitor
          WHEN COUNT(*) BETWEEN 6 AND 20 THEN 15 -- Regular visitor
          ELSE 10 -- Frequent visitor
        END INTO base_score
      FROM visitors
      WHERE id = p_entity_id;

      -- Add risk factors for failed access attempts
      SELECT base_score + (COUNT(*) * 10) INTO risk_score
      FROM access_logs
      WHERE visitor_id = p_entity_id
        AND action_type = 'denied'
        AND created_at > NOW() - INTERVAL '30 days';

    WHEN 'device' THEN
      -- Device-specific risk factors
      SELECT 
        CASE 
          WHEN device_status = 'offline' THEN 60
          WHEN device_status = 'error' THEN 80
          WHEN last_seen < NOW() - INTERVAL '1 hour' THEN 40
          ELSE 15
        END INTO base_score
      FROM iot_devices
      WHERE id = p_entity_id;

      risk_score := base_score;

    ELSE
      risk_score := base_score;
  END CASE;

  -- Ensure score is within bounds
  risk_score := GREATEST(0, LEAST(100, risk_score));

  -- Insert risk assessment
  INSERT INTO security_risk_assessments (
    tenant_id, assessment_type, entity_id, risk_score,
    risk_level, risk_factors, assessment_confidence
  ) VALUES (
    p_tenant_id, p_entity_type, p_entity_id, risk_score,
    CASE 
      WHEN risk_score >= 80 THEN 'critical'
      WHEN risk_score >= 60 THEN 'high'
      WHEN risk_score >= 40 THEN 'medium'
      WHEN risk_score >= 20 THEN 'low'
      ELSE 'very_low'
    END,
    jsonb_build_object('calculated_factors', 'automated_assessment'),
    0.85
  );

  RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- 13. Occupancy Prediction Function
CREATE OR REPLACE FUNCTION predict_occupancy(
  p_zone_id UUID,
  p_prediction_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  hour_offset INTEGER,
  predicted_occupancy INTEGER,
  confidence_level DECIMAL(5,4)
) AS $$
DECLARE
  historical_data RECORD;
  seasonal_factor DECIMAL(5,4);
  trend_factor DECIMAL(5,4);
BEGIN
  -- Get historical patterns for same time periods
  FOR hour_offset IN 1..p_prediction_hours LOOP
    -- Calculate seasonal and trend factors
    SELECT 
      AVG(current_occupancy) as avg_occupancy,
      STDDEV(current_occupancy) as std_dev
    INTO historical_data
    FROM occupancy_analytics
    WHERE zone_id = p_zone_id
      AND EXTRACT(HOUR FROM measurement_timestamp) = 
          EXTRACT(HOUR FROM NOW() + INTERVAL '1 hour' * hour_offset)
      AND measurement_timestamp > NOW() - INTERVAL '30 days';

    -- Apply trend and seasonal adjustments
    seasonal_factor := 1.0; -- Simplified - would use more complex seasonality
    trend_factor := 1.0; -- Simplified - would analyze historical trends

    predicted_occupancy := COALESCE(
      ROUND(historical_data.avg_occupancy * seasonal_factor * trend_factor),
      0
    );

    confidence_level := CASE 
      WHEN historical_data.std_dev IS NULL THEN 0.3
      WHEN historical_data.std_dev > historical_data.avg_occupancy * 0.5 THEN 0.5
      ELSE 0.8
    END;

    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 14. Energy Optimization Recommendations
CREATE OR REPLACE FUNCTION generate_energy_optimization_recommendations(
  p_tenant_id UUID
)
RETURNS TABLE (
  recommendation_type VARCHAR(50),
  description TEXT,
  estimated_savings_percent DECIMAL(5,2),
  implementation_effort VARCHAR(20),
  payback_period_months INTEGER
) AS $$
BEGIN
  -- Lighting optimization
  RETURN QUERY
  SELECT 
    'lighting_automation'::varchar,
    'Implement smart lighting schedules based on occupancy patterns'::text,
    15.00::decimal,
    'medium'::varchar,
    8::integer;

  -- HVAC optimization
  RETURN QUERY
  SELECT 
    'hvac_scheduling'::varchar,
    'Optimize HVAC operation based on predicted occupancy and weather'::text,
    25.00::decimal,
    'high'::varchar,
    12::integer;

  -- Equipment scheduling
  RETURN QUERY
  SELECT 
    'equipment_scheduling'::varchar,
    'Schedule non-critical equipment during off-peak hours'::text,
    10.00::decimal,
    'low'::varchar,
    4::integer;

  -- Renewable energy
  RETURN QUERY
  SELECT 
    'renewable_integration'::varchar,
    'Install solar panels and battery storage system'::text,
    40.00::decimal,
    'high'::varchar,
    36::integer;
END;
$$ LANGUAGE plpgsql;

-- 15. Insert Sample Analytics Models
INSERT INTO analytics_models (model_name, model_type, model_category, algorithm, model_version, feature_columns, target_column, accuracy_score) VALUES
('Visitor Arrival Prediction', 'time_series', 'visitor_behavior', 'ARIMA', '1.0', ARRAY['hour_of_day', 'day_of_week', 'weather', 'historical_arrivals'], 'visitor_count', 0.8500),
('Security Anomaly Detection', 'anomaly_detection', 'security', 'Isolation Forest', '1.2', ARRAY['access_patterns', 'device_status', 'user_behavior'], 'anomaly_score', 0.9200),
('Equipment Failure Prediction', 'classification', 'maintenance', 'Random Forest', '2.1', ARRAY['vibration', 'temperature', 'usage_hours', 'last_maintenance'], 'failure_probability', 0.8800),
('Energy Consumption Forecast', 'regression', 'energy', 'Gradient Boosting', '1.5', ARRAY['occupancy', 'weather', 'equipment_status', 'historical_usage'], 'energy_consumption', 0.9100),
('Occupancy Optimization', 'regression', 'occupancy', 'Neural Network', '1.0', ARRAY['time_patterns', 'events', 'weather', 'capacity'], 'optimal_occupancy', 0.8700);

-- 16. RLS Policies
ALTER TABLE analytics_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupancy_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_alerts ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY prediction_results_tenant_isolation ON prediction_results
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY visitor_behavior_tenant_isolation ON visitor_behavior_patterns
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY security_risk_tenant_isolation ON security_risk_assessments
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY analytics_dashboards_tenant_isolation ON analytics_dashboards
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY predictive_alerts_tenant_isolation ON predictive_alerts
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

-- Service role access
CREATE POLICY analytics_models_service_role ON analytics_models
  USING (auth.role() = 'service_role');

COMMENT ON TABLE analytics_models IS 'Machine learning models for predictive analytics';
COMMENT ON TABLE prediction_results IS 'Results and validation of predictive model outputs';
COMMENT ON TABLE visitor_behavior_patterns IS 'Analysis of visitor behavior patterns and trends';
COMMENT ON TABLE security_risk_assessments IS 'Automated security risk scoring and assessment';
COMMENT ON TABLE occupancy_analytics IS 'Occupancy analysis and optimization insights';
COMMENT ON TABLE energy_predictions IS 'Energy consumption predictions and optimization';
COMMENT ON TABLE predictive_alerts IS 'AI-powered predictive alerts and notifications';
