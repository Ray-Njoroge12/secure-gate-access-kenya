-- Phase 5: Advanced Analytics & Business Intelligence
-- Migration for analytics and business intelligence features

-- Analytics tracking table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  community_id UUID,
  session_id VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  INDEX idx_analytics_events_type (event_type),
  INDEX idx_analytics_events_timestamp (timestamp),
  INDEX idx_analytics_events_community (community_id)
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(12,4) NOT NULL,
  metric_unit VARCHAR(20),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  community_id UUID,
  INDEX idx_performance_metrics_type (metric_type),
  INDEX idx_performance_metrics_recorded (recorded_at),
  INDEX idx_performance_metrics_community (community_id)
);

-- Machine learning predictions table
CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_type VARCHAR(50) NOT NULL,
  prediction_category VARCHAR(50) NOT NULL,
  prediction_data JSONB NOT NULL,
  confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  model_version VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  community_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  INDEX idx_ml_predictions_type (prediction_type),
  INDEX idx_ml_predictions_created (created_at),
  INDEX idx_ml_predictions_valid (valid_until),
  INDEX idx_ml_predictions_community (community_id)
);

-- Business intelligence reports table
CREATE TABLE IF NOT EXISTS bi_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name VARCHAR(100) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  report_data JSONB NOT NULL,
  report_metadata JSONB,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  community_id UUID,
  status VARCHAR(20) DEFAULT 'completed',
  file_path TEXT,
  download_count INTEGER DEFAULT 0,
  INDEX idx_bi_reports_type (report_type),
  INDEX idx_bi_reports_generated (generated_at),
  INDEX idx_bi_reports_community (community_id),
  INDEX idx_bi_reports_period (period_start, period_end)
);

-- Analytics aggregations table (for faster queries)
CREATE TABLE IF NOT EXISTS analytics_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregation_type VARCHAR(50) NOT NULL,
  aggregation_period VARCHAR(20) NOT NULL, -- hourly, daily, weekly, monthly
  aggregation_date DATE NOT NULL,
  aggregation_data JSONB NOT NULL,
  community_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_analytics_agg_type_period (aggregation_type, aggregation_period),
  INDEX idx_analytics_agg_date (aggregation_date),
  INDEX idx_analytics_agg_community (community_id),
  UNIQUE(aggregation_type, aggregation_period, aggregation_date, community_id)
);

-- Dashboard configurations table
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  dashboard_type VARCHAR(50) NOT NULL,
  config_data JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_dashboard_configs_user (user_id),
  INDEX idx_dashboard_configs_type (dashboard_type)
);

-- RLS Policies for analytics tables
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view analytics for their community" ON analytics_events
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE community_id = analytics_events.community_id
      AND role IN ('admin', 'manager', 'security_guard')
    )
  );

CREATE POLICY "Admins can view all performance metrics" ON performance_metrics
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role IN ('admin', 'manager')
      AND (community_id = performance_metrics.community_id OR role = 'admin')
    )
  );

CREATE POLICY "Users can view ML predictions for their community" ON ml_predictions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE community_id = ml_predictions.community_id
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can view BI reports for their community" ON bi_reports
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE community_id = bi_reports.community_id
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can manage their own dashboard configs" ON dashboard_configs
  FOR ALL USING (auth.uid() = user_id);

-- Functions for analytics

-- Function to log analytics events
CREATE OR REPLACE FUNCTION log_analytics_event(
  p_event_type VARCHAR(50),
  p_event_data JSONB,
  p_community_id UUID DEFAULT NULL,
  p_session_id VARCHAR(255) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO analytics_events (
    event_type,
    event_data,
    user_id,
    community_id,
    session_id
  ) VALUES (
    p_event_type,
    p_event_data,
    auth.uid(),
    p_community_id,
    p_session_id
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record performance metrics
CREATE OR REPLACE FUNCTION record_performance_metric(
  p_metric_type VARCHAR(50),
  p_metric_name VARCHAR(100),
  p_metric_value DECIMAL(12,4),
  p_metric_unit VARCHAR(20) DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_community_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  metric_id UUID;
BEGIN
  INSERT INTO performance_metrics (
    metric_type,
    metric_name,
    metric_value,
    metric_unit,
    metadata,
    community_id
  ) VALUES (
    p_metric_type,
    p_metric_name,
    p_metric_value,
    p_metric_unit,
    p_metadata,
    p_community_id
  ) RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get visitor analytics
CREATE OR REPLACE FUNCTION get_visitor_analytics(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_community_id UUID DEFAULT NULL
) RETURNS TABLE (
  total_visitors BIGINT,
  total_visits BIGINT,
  unique_visitors BIGINT,
  average_visit_duration INTERVAL,
  peak_hour INTEGER,
  trends JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH visitor_stats AS (
    SELECT 
      COUNT(DISTINCT v.id) as unique_visitors_count,
      COUNT(vi.id) as total_visits_count,
      COUNT(v.id) as total_visitors_count,
      AVG(EXTRACT(EPOCH FROM (ac.used_at - ac.created_at))) as avg_duration_seconds
    FROM visitors v
    LEFT JOIN visit_invitations vi ON v.id = vi.visitor_id
    LEFT JOIN access_codes ac ON vi.id = ac.invitation_id
    WHERE DATE(v.created_at) BETWEEN p_start_date AND p_end_date
    AND (p_community_id IS NULL OR v.community_id = p_community_id)
  ),
  peak_hour_stats AS (
    SELECT EXTRACT(HOUR FROM ac.used_at) as hour
    FROM access_codes ac
    JOIN visit_invitations vi ON ac.invitation_id = vi.id
    JOIN visitors v ON vi.visitor_id = v.id
    WHERE DATE(ac.used_at) BETWEEN p_start_date AND p_end_date
    AND (p_community_id IS NULL OR v.community_id = p_community_id)
    GROUP BY EXTRACT(HOUR FROM ac.used_at)
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ),
  daily_trends AS (
    SELECT 
      DATE(v.created_at) as visit_date,
      COUNT(*) as daily_count
    FROM visitors v
    WHERE DATE(v.created_at) BETWEEN p_start_date AND p_end_date
    AND (p_community_id IS NULL OR v.community_id = p_community_id)
    GROUP BY DATE(v.created_at)
    ORDER BY visit_date
  )
  SELECT 
    vs.total_visitors_count,
    vs.total_visits_count,
    vs.unique_visitors_count,
    INTERVAL '1 second' * vs.avg_duration_seconds,
    COALESCE(phs.hour::INTEGER, 9),
    jsonb_build_object(
      'daily_trends', 
      COALESCE(
        (SELECT jsonb_agg(jsonb_build_object('date', visit_date, 'count', daily_count)) 
         FROM daily_trends), 
        '[]'::jsonb
      )
    )
  FROM visitor_stats vs
  LEFT JOIN peak_hour_stats phs ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get security analytics
CREATE OR REPLACE FUNCTION get_security_analytics(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_community_id UUID DEFAULT NULL
) RETURNS TABLE (
  total_access_attempts BIGINT,
  successful_access BIGINT,
  failed_access BIGINT,
  security_incidents BIGINT,
  threat_level VARCHAR(20),
  recent_alerts JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH access_stats AS (
    SELECT 
      COUNT(*) as total_attempts,
      COUNT(CASE WHEN success = true THEN 1 END) as successful,
      COUNT(CASE WHEN success = false THEN 1 END) as failed
    FROM access_logs al
    WHERE DATE(al.timestamp) BETWEEN p_start_date AND p_end_date
    AND (p_community_id IS NULL OR al.community_id = p_community_id)
  ),
  incident_stats AS (
    SELECT COUNT(*) as incident_count
    FROM audit_logs au
    WHERE au.event_type = 'security_incident'
    AND DATE(au.timestamp) BETWEEN p_start_date AND p_end_date
    AND (p_community_id IS NULL OR au.community_id = p_community_id)
  ),
  recent_alerts_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', event_type,
        'timestamp', timestamp,
        'details', details
      )
    ) as alerts
    FROM audit_logs
    WHERE event_type IN ('security_alert', 'access_denied', 'suspicious_activity')
    AND DATE(timestamp) BETWEEN p_start_date AND p_end_date
    AND (p_community_id IS NULL OR community_id = p_community_id)
    ORDER BY timestamp DESC
    LIMIT 10
  )
  SELECT 
    acs.total_attempts,
    acs.successful,
    acs.failed,
    COALESCE(ins.incident_count, 0),
    CASE 
      WHEN COALESCE(ins.incident_count, 0) > 5 THEN 'HIGH'
      WHEN COALESCE(ins.incident_count, 0) > 2 THEN 'MEDIUM'
      ELSE 'LOW'
    END as threat_level,
    COALESCE(rad.alerts, '[]'::jsonb)
  FROM access_stats acs
  LEFT JOIN incident_stats ins ON true
  LEFT JOIN recent_alerts_data rad ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create daily aggregations (to be run by cron job)
CREATE OR REPLACE FUNCTION create_daily_aggregations(
  p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day'
) RETURNS VOID AS $$
BEGIN
  -- Visitor aggregations
  INSERT INTO analytics_aggregations (
    aggregation_type,
    aggregation_period,
    aggregation_date,
    aggregation_data,
    community_id
  )
  SELECT 
    'visitor_stats',
    'daily',
    p_date,
    jsonb_build_object(
      'total_visitors', COUNT(DISTINCT v.id),
      'total_visits', COUNT(vi.id),
      'average_duration', AVG(EXTRACT(EPOCH FROM (ac.used_at - ac.created_at))),
      'peak_hour', mode() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM ac.used_at))
    ),
    v.community_id
  FROM visitors v
  LEFT JOIN visit_invitations vi ON v.id = vi.visitor_id
  LEFT JOIN access_codes ac ON vi.id = ac.invitation_id
  WHERE DATE(v.created_at) = p_date
  GROUP BY v.community_id
  ON CONFLICT (aggregation_type, aggregation_period, aggregation_date, community_id)
  DO UPDATE SET 
    aggregation_data = EXCLUDED.aggregation_data,
    updated_at = NOW();

  -- Security aggregations
  INSERT INTO analytics_aggregations (
    aggregation_type,
    aggregation_period,
    aggregation_date,
    aggregation_data,
    community_id
  )
  SELECT 
    'security_stats',
    'daily',
    p_date,
    jsonb_build_object(
      'total_access_attempts', COUNT(*),
      'successful_access', COUNT(CASE WHEN success = true THEN 1 END),
      'failed_access', COUNT(CASE WHEN success = false THEN 1 END),
      'security_incidents', COUNT(CASE WHEN reason LIKE '%security%' THEN 1 END)
    ),
    al.community_id
  FROM access_logs al
  WHERE DATE(al.timestamp) = p_date
  GROUP BY al.community_id
  ON CONFLICT (aggregation_type, aggregation_period, aggregation_date, community_id)
  DO UPDATE SET 
    aggregation_data = EXCLUDED.aggregation_data,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_visitors_created_date ON visitors(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp_date ON access_logs(DATE(timestamp));
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_date ON audit_logs(DATE(timestamp));

-- Comments for documentation
COMMENT ON TABLE analytics_events IS 'Stores all analytics events for tracking user behavior and system usage';
COMMENT ON TABLE performance_metrics IS 'Stores system performance metrics for monitoring and optimization';
COMMENT ON TABLE ml_predictions IS 'Stores machine learning predictions and forecasts';
COMMENT ON TABLE bi_reports IS 'Stores generated business intelligence reports';
COMMENT ON TABLE analytics_aggregations IS 'Stores pre-calculated analytics data for faster querying';
COMMENT ON TABLE dashboard_configs IS 'Stores user dashboard configurations and preferences';

COMMENT ON FUNCTION log_analytics_event IS 'Logs analytics events with user context and community association';
COMMENT ON FUNCTION record_performance_metric IS 'Records system performance metrics for monitoring';
COMMENT ON FUNCTION get_visitor_analytics IS 'Returns comprehensive visitor analytics for a date range';
COMMENT ON FUNCTION get_security_analytics IS 'Returns security analytics and threat assessment data';
COMMENT ON FUNCTION create_daily_aggregations IS 'Creates daily aggregated analytics data for improved query performance';
