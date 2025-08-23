-- Phase 7: AI & Automation Database Schema
-- Migration: 20250814100000_ai_automation_foundation.sql

-- Visitor Risk Profiles Table
CREATE TABLE IF NOT EXISTS visitor_risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL,
  risk_score INTEGER DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  total_visits INTEGER DEFAULT 0,
  successful_visits INTEGER DEFAULT 0,
  failed_attempts INTEGER DEFAULT 0,
  incident_count INTEGER DEFAULT 0,
  last_risk_calculation TIMESTAMPTZ DEFAULT NOW(),
  behavioral_flags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
);

-- Behavioral Patterns Table
CREATE TABLE IF NOT EXISTS behavioral_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL,
  pattern_type TEXT NOT NULL, -- 'visit_frequency', 'time_pattern', 'success_rate', etc.
  pattern_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  is_anomaly BOOLEAN DEFAULT FALSE,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
);

-- AI Recommendations Table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_type TEXT NOT NULL, -- 'risk_assessment', 'scheduling', 'access_control'
  entity_type TEXT NOT NULL, -- 'visitor', 'invitation', 'access_code'
  entity_id UUID NOT NULL,
  recommendation JSONB NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_by UUID, -- AI system or user who triggered the recommendation
  reviewed_by UUID, -- User who reviewed the recommendation
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ Knowledge Base Table
CREATE TABLE IF NOT EXISTS faq_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[], -- For search and matching
  usage_count INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.5,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduling Conflicts Table
CREATE TABLE IF NOT EXISTS scheduling_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL,
  conflict_type TEXT NOT NULL, -- 'time_overlap', 'capacity_exceeded', 'resource_conflict'
  conflicting_invitation_id UUID,
  conflict_details JSONB NOT NULL,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  resolution_status TEXT DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'resolved', 'ignored')),
  resolution_action JSONB,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (invitation_id) REFERENCES visit_invitations(id) ON DELETE CASCADE,
  FOREIGN KEY (conflicting_invitation_id) REFERENCES visit_invitations(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visitor_risk_profiles_visitor_id ON visitor_risk_profiles(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_risk_profiles_risk_level ON visitor_risk_profiles(risk_level);
CREATE INDEX IF NOT EXISTS idx_visitor_risk_profiles_risk_score ON visitor_risk_profiles(risk_score);

CREATE INDEX IF NOT EXISTS idx_behavioral_patterns_visitor_id ON behavioral_patterns(visitor_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_patterns_type ON behavioral_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_behavioral_patterns_anomaly ON behavioral_patterns(is_anomaly);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_entity ON ai_recommendations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON ai_recommendations(status);

CREATE INDEX IF NOT EXISTS idx_faq_knowledge_base_category ON faq_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_faq_knowledge_base_keywords ON faq_knowledge_base USING GIN(keywords);

CREATE INDEX IF NOT EXISTS idx_scheduling_conflicts_invitation ON scheduling_conflicts(invitation_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_conflicts_type ON scheduling_conflicts(conflict_type);

-- RPC Functions for AI Operations

-- Calculate Risk Score for a Visitor
CREATE OR REPLACE FUNCTION calculate_visitor_risk_score(p_visitor_id UUID)
RETURNS TABLE(
  risk_score INTEGER,
  risk_level TEXT,
  factors JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_visits INTEGER := 0;
  v_successful_visits INTEGER := 0;
  v_failed_attempts INTEGER := 0;
  v_incident_count INTEGER := 0;
  v_recent_activity_score INTEGER := 50;
  v_time_pattern_score INTEGER := 50;
  v_success_rate DECIMAL;
  v_calculated_score INTEGER;
  v_risk_level TEXT;
  v_factors JSONB;
BEGIN
  -- Get visit statistics
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN ac.used_at IS NOT NULL THEN 1 END) as successful,
    COUNT(CASE WHEN ac.used_at IS NULL AND ac.expires_at < NOW() THEN 1 END) as failed
  INTO v_total_visits, v_successful_visits, v_failed_attempts
  FROM access_codes ac
  JOIN visit_invitations vi ON ac.invitation_id = vi.id
  WHERE vi.visitor_id = p_visitor_id;

  -- Get incident count from audit logs
  SELECT COUNT(*)
  INTO v_incident_count
  FROM audit_logs al
  WHERE al.event_type = 'security_incident' 
    AND al.details->>'visitor_id' = p_visitor_id::text;

  -- Calculate success rate
  IF v_total_visits > 0 THEN
    v_success_rate := v_successful_visits::DECIMAL / v_total_visits;
  ELSE
    v_success_rate := 1.0; -- No history = neutral
  END IF;

  -- Calculate recent activity pattern (last 30 days)
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 50 -- No recent activity = neutral
      WHEN COUNT(*) BETWEEN 1 AND 5 THEN 60 -- Normal activity = slightly positive
      WHEN COUNT(*) BETWEEN 6 AND 15 THEN 70 -- Regular visitor = positive
      WHEN COUNT(*) > 15 THEN 40 -- Very frequent = slightly concerning
      ELSE 50
    END
  INTO v_recent_activity_score
  FROM access_codes ac
  JOIN visit_invitations vi ON ac.invitation_id = vi.id
  WHERE vi.visitor_id = p_visitor_id 
    AND ac.created_at > NOW() - INTERVAL '30 days';

  -- Calculate time pattern consistency (visits during normal hours)
  SELECT
    CASE 
      WHEN COUNT(*) = 0 THEN 50
      WHEN AVG(CASE WHEN EXTRACT(HOUR FROM ac.created_at) BETWEEN 6 AND 22 THEN 1 ELSE 0 END) > 0.8 THEN 70
      WHEN AVG(CASE WHEN EXTRACT(HOUR FROM ac.created_at) BETWEEN 6 AND 22 THEN 1 ELSE 0 END) > 0.5 THEN 60
      ELSE 30 -- Mostly unusual hours = concerning
    END
  INTO v_time_pattern_score
  FROM access_codes ac
  JOIN visit_invitations vi ON ac.invitation_id = vi.id
  WHERE vi.visitor_id = p_visitor_id;

  -- Calculate composite risk score (0-100, lower = higher risk)
  v_calculated_score := (
    (v_success_rate * 40) + -- 40% weight on success rate
    (v_recent_activity_score * 0.3) + -- 30% weight on activity pattern
    (v_time_pattern_score * 0.2) + -- 20% weight on time patterns
    (GREATEST(0, 50 - (v_incident_count * 10)) * 0.1) -- 10% penalty for incidents
  )::INTEGER;

  -- Ensure score is within bounds
  v_calculated_score := GREATEST(0, LEAST(100, v_calculated_score));

  -- Determine risk level
  v_risk_level := CASE
    WHEN v_calculated_score >= 80 THEN 'low'
    WHEN v_calculated_score >= 60 THEN 'medium'
    WHEN v_calculated_score >= 30 THEN 'high'
    ELSE 'critical'
  END;

  -- Build factors JSON
  v_factors := jsonb_build_object(
    'total_visits', v_total_visits,
    'successful_visits', v_successful_visits,
    'failed_attempts', v_failed_attempts,
    'incident_count', v_incident_count,
    'success_rate', v_success_rate,
    'recent_activity_score', v_recent_activity_score,
    'time_pattern_score', v_time_pattern_score,
    'calculation_date', NOW()
  );

  RETURN QUERY SELECT v_calculated_score, v_risk_level, v_factors;
END;
$$;

-- Update or Create Risk Profile
CREATE OR REPLACE FUNCTION update_visitor_risk_profile(p_visitor_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_risk_data RECORD;
BEGIN
  -- Calculate new risk score
  SELECT * INTO v_risk_data
  FROM calculate_visitor_risk_score(p_visitor_id);

  -- Update or insert risk profile
  INSERT INTO visitor_risk_profiles (
    visitor_id,
    risk_score,
    risk_level,
    total_visits,
    successful_visits,
    failed_attempts,
    incident_count,
    behavioral_flags,
    last_risk_calculation
  )
  VALUES (
    p_visitor_id,
    v_risk_data.risk_score,
    v_risk_data.risk_level,
    (v_risk_data.factors->>'total_visits')::INTEGER,
    (v_risk_data.factors->>'successful_visits')::INTEGER,
    (v_risk_data.factors->>'failed_attempts')::INTEGER,
    (v_risk_data.factors->>'incident_count')::INTEGER,
    v_risk_data.factors,
    NOW()
  )
  ON CONFLICT (visitor_id) DO UPDATE SET
    risk_score = EXCLUDED.risk_score,
    risk_level = EXCLUDED.risk_level,
    total_visits = EXCLUDED.total_visits,
    successful_visits = EXCLUDED.successful_visits,
    failed_attempts = EXCLUDED.failed_attempts,
    incident_count = EXCLUDED.incident_count,
    behavioral_flags = EXCLUDED.behavioral_flags,
    last_risk_calculation = EXCLUDED.last_risk_calculation,
    updated_at = NOW();
END;
$$;

-- Detect Behavioral Anomalies
CREATE OR REPLACE FUNCTION detect_behavioral_anomalies(p_visitor_id UUID DEFAULT NULL)
RETURNS TABLE(
  visitor_id UUID,
  anomaly_type TEXT,
  anomaly_details JSONB,
  severity TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visitor_record RECORD;
BEGIN
  -- Loop through visitors (specific visitor or all)
  FOR v_visitor_record IN 
    SELECT v.id, v.full_name
    FROM visitors v
    WHERE (p_visitor_id IS NULL OR v.id = p_visitor_id)
  LOOP
    -- Check for unusual time patterns
    IF EXISTS (
      SELECT 1 FROM access_codes ac
      JOIN visit_invitations vi ON ac.invitation_id = vi.id
      WHERE vi.visitor_id = v_visitor_record.id
        AND ac.created_at > NOW() - INTERVAL '7 days'
        AND EXTRACT(HOUR FROM ac.created_at) NOT BETWEEN 6 AND 22
      GROUP BY DATE(ac.created_at)
      HAVING COUNT(*) > 2
    ) THEN
      RETURN QUERY SELECT 
        v_visitor_record.id,
        'unusual_time_pattern'::TEXT,
        jsonb_build_object(
          'description', 'Multiple visits during unusual hours',
          'detected_at', NOW(),
          'visitor_name', v_visitor_record.full_name
        ),
        'medium'::TEXT;
    END IF;

    -- Check for rapid successive visits
    IF EXISTS (
      SELECT 1 FROM access_codes ac1
      JOIN visit_invitations vi1 ON ac1.invitation_id = vi1.id
      JOIN access_codes ac2 ON ac2.id != ac1.id
      JOIN visit_invitations vi2 ON ac2.invitation_id = vi2.id
      WHERE vi1.visitor_id = v_visitor_record.id
        AND vi2.visitor_id = v_visitor_record.id
        AND ABS(EXTRACT(EPOCH FROM (ac2.created_at - ac1.created_at))) < 3600 -- Within 1 hour
        AND ac1.created_at > NOW() - INTERVAL '24 hours'
    ) THEN
      RETURN QUERY SELECT 
        v_visitor_record.id,
        'rapid_successive_visits'::TEXT,
        jsonb_build_object(
          'description', 'Multiple visits within short time frame',
          'detected_at', NOW(),
          'visitor_name', v_visitor_record.full_name
        ),
        'high'::TEXT;
    END IF;

    -- Check for high failure rate
    WITH visit_stats AS (
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN ac.used_at IS NOT NULL THEN 1 END) as successful,
        COUNT(CASE WHEN ac.used_at IS NULL AND ac.expires_at < NOW() THEN 1 END) as failed
      FROM access_codes ac
      JOIN visit_invitations vi ON ac.invitation_id = vi.id
      WHERE vi.visitor_id = v_visitor_record.id
        AND ac.created_at > NOW() - INTERVAL '30 days'
    )
    SELECT * FROM visit_stats WHERE total_attempts >= 5 AND (failed::DECIMAL / total_attempts) > 0.4
    INTO STRICT v_visitor_record; -- Will raise exception if not found, which is fine

    IF FOUND THEN
      RETURN QUERY SELECT 
        v_visitor_record.id,
        'high_failure_rate'::TEXT,
        jsonb_build_object(
          'description', 'High percentage of failed access attempts',
          'detected_at', NOW(),
          'visitor_name', v_visitor_record.full_name
        ),
        'high'::TEXT;
    END IF;
  END LOOP;

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    -- This is expected when checking failure rates, continue processing
    NULL;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON visitor_risk_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON behavioral_patterns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON faq_knowledge_base TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduling_conflicts TO authenticated;

GRANT EXECUTE ON FUNCTION calculate_visitor_risk_score TO authenticated;
GRANT EXECUTE ON FUNCTION update_visitor_risk_profile TO authenticated;
GRANT EXECUTE ON FUNCTION detect_behavioral_anomalies TO authenticated;
