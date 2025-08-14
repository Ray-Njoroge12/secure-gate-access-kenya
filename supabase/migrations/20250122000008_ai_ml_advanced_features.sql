-- AI/ML Advanced Features - Low Priority Phase
-- Advanced Machine Learning Models and AI-Powered Automation

-- 1. AI Model Registry and Management
CREATE TABLE ai_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name VARCHAR(200) NOT NULL,
  model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('classification', 'regression', 'clustering', 'anomaly_detection', 'nlp', 'computer_vision', 'reinforcement_learning')),
  model_category VARCHAR(50) NOT NULL CHECK (model_category IN ('security', 'analytics', 'prediction', 'automation', 'optimization', 'recommendation', 'detection')),
  model_version VARCHAR(20) NOT NULL,
  model_framework VARCHAR(50) DEFAULT 'tensorflow' CHECK (model_framework IN ('tensorflow', 'pytorch', 'scikit_learn', 'xgboost', 'keras', 'huggingface', 'custom')),
  model_description TEXT,
  training_data_sources TEXT[],
  feature_columns JSONB DEFAULT '[]',
  target_columns JSONB DEFAULT '[]',
  model_parameters JSONB DEFAULT '{}',
  hyperparameters JSONB DEFAULT '{}',
  training_metrics JSONB DEFAULT '{}',
  validation_metrics JSONB DEFAULT '{}',
  test_metrics JSONB DEFAULT '{}',
  model_file_path TEXT NOT NULL,
  model_file_size_bytes BIGINT,
  model_checksum VARCHAR(128),
  deployment_status VARCHAR(20) DEFAULT 'development' CHECK (deployment_status IN ('development', 'testing', 'staging', 'production', 'deprecated')),
  performance_requirements JSONB DEFAULT '{}',
  resource_requirements JSONB DEFAULT '{}',
  api_endpoint TEXT,
  inference_latency_ms DECIMAL(8,2),
  throughput_requests_per_second DECIMAL(8,2),
  accuracy_score DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall_score DECIMAL(5,4),
  auc_score DECIMAL(5,4),
  training_start_date TIMESTAMPTZ,
  training_end_date TIMESTAMPTZ,
  last_retrained_date TIMESTAMPTZ,
  retraining_frequency_days INTEGER DEFAULT 30,
  model_drift_threshold DECIMAL(5,4) DEFAULT 0.05,
  monitoring_enabled BOOLEAN DEFAULT true,
  explainability_enabled BOOLEAN DEFAULT false,
  bias_monitoring_enabled BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AI Training Jobs and Pipelines
CREATE TABLE ai_training_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name VARCHAR(200) NOT NULL,
  model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('initial_training', 'retraining', 'fine_tuning', 'transfer_learning', 'hyperparameter_tuning', 'model_validation')),
  job_status VARCHAR(20) DEFAULT 'pending' CHECK (job_status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'paused')),
  training_config JSONB NOT NULL,
  dataset_config JSONB NOT NULL,
  compute_resources JSONB DEFAULT '{}',
  job_priority INTEGER DEFAULT 5 CHECK (job_priority BETWEEN 1 AND 10),
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  progress_percentage DECIMAL(5,2) DEFAULT 0.0,
  current_epoch INTEGER DEFAULT 0,
  total_epochs INTEGER,
  training_loss DECIMAL(10,6),
  validation_loss DECIMAL(10,6),
  learning_rate DECIMAL(10,8),
  batch_size INTEGER,
  gpu_utilization_percent DECIMAL(5,2),
  memory_usage_gb DECIMAL(8,2),
  cpu_utilization_percent DECIMAL(5,2),
  logs_file_path TEXT,
  error_message TEXT,
  artifacts_path TEXT,
  model_artifacts JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  resource_costs JSONB DEFAULT '{}',
  early_stopping_triggered BOOLEAN DEFAULT false,
  checkpoint_frequency_minutes INTEGER DEFAULT 10,
  auto_resume_enabled BOOLEAN DEFAULT true,
  notification_settings JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI Inference Sessions and Results
CREATE TABLE ai_inference_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name VARCHAR(200),
  model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
  inference_type VARCHAR(50) NOT NULL CHECK (inference_type IN ('batch', 'real_time', 'streaming', 'scheduled')),
  input_data JSONB NOT NULL,
  input_data_hash VARCHAR(128),
  output_data JSONB,
  confidence_scores JSONB DEFAULT '{}',
  prediction_probabilities JSONB DEFAULT '{}',
  feature_importance JSONB DEFAULT '{}',
  explanation_data JSONB DEFAULT '{}',
  inference_start_time TIMESTAMPTZ DEFAULT NOW(),
  inference_end_time TIMESTAMPTZ,
  processing_time_ms DECIMAL(10,2),
  model_version_used VARCHAR(20),
  api_endpoint_used TEXT,
  request_id VARCHAR(100),
  user_id UUID,
  session_context JSONB DEFAULT '{}',
  business_impact JSONB DEFAULT '{}',
  feedback_provided BOOLEAN DEFAULT false,
  feedback_score INTEGER CHECK (feedback_score BETWEEN 1 AND 5),
  feedback_comments TEXT,
  was_prediction_correct BOOLEAN,
  actual_outcome JSONB,
  model_drift_detected BOOLEAN DEFAULT false,
  anomaly_detected BOOLEAN DEFAULT false,
  bias_score DECIMAL(5,4),
  fairness_metrics JSONB DEFAULT '{}',
  privacy_compliance JSONB DEFAULT '{}',
  audit_trail JSONB DEFAULT '{}',
  cost_attribution JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI-Powered Automated Decision Engine
CREATE TABLE ai_decision_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name VARCHAR(200) NOT NULL,
  rule_category VARCHAR(50) NOT NULL CHECK (rule_category IN ('security', 'access_control', 'risk_assessment', 'optimization', 'alerting', 'automation')),
  trigger_conditions JSONB NOT NULL,
  ai_models_used UUID[] NOT NULL,
  decision_logic JSONB NOT NULL,
  confidence_threshold DECIMAL(5,4) DEFAULT 0.8,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('allow', 'deny', 'alert', 'escalate', 'auto_approve', 'request_review', 'trigger_workflow')),
  automated_actions JSONB DEFAULT '{}',
  human_review_required BOOLEAN DEFAULT false,
  escalation_rules JSONB DEFAULT '{}',
  risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  compliance_requirements TEXT[],
  business_rules JSONB DEFAULT '{}',
  override_permissions JSONB DEFAULT '{}',
  audit_requirements JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  success_rate DECIMAL(5,4),
  false_positive_rate DECIMAL(5,4),
  false_negative_rate DECIMAL(5,4),
  processing_time_avg_ms DECIMAL(8,2),
  rule_activation_count INTEGER DEFAULT 0,
  last_triggered TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  testing_mode BOOLEAN DEFAULT false,
  rollback_strategy JSONB DEFAULT '{}',
  monitoring_dashboard_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AI Decision Executions and Outcomes
CREATE TABLE ai_decision_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_rule_id UUID REFERENCES ai_decision_rules(id) ON DELETE CASCADE,
  execution_context JSONB NOT NULL,
  input_data JSONB NOT NULL,
  ai_predictions JSONB NOT NULL,
  confidence_scores JSONB NOT NULL,
  decision_outcome VARCHAR(50) NOT NULL,
  actions_taken JSONB DEFAULT '{}',
  execution_time_ms DECIMAL(8,2),
  models_performance JSONB DEFAULT '{}',
  human_review_required BOOLEAN DEFAULT false,
  human_reviewer_id UUID,
  human_review_outcome VARCHAR(50),
  human_review_notes TEXT,
  override_applied BOOLEAN DEFAULT false,
  override_reason TEXT,
  business_impact_score DECIMAL(5,2),
  risk_mitigation_actions JSONB DEFAULT '{}',
  compliance_validation JSONB DEFAULT '{}',
  audit_trail JSONB DEFAULT '{}',
  feedback_collected BOOLEAN DEFAULT false,
  outcome_validation JSONB DEFAULT '{}',
  model_explanations JSONB DEFAULT '{}',
  bias_assessment JSONB DEFAULT '{}',
  fairness_validation JSONB DEFAULT '{}',
  error_handling JSONB DEFAULT '{}',
  rollback_actions JSONB DEFAULT '{}',
  notification_sent BOOLEAN DEFAULT false,
  dashboard_updated BOOLEAN DEFAULT false,
  execution_timestamp TIMESTAMPTZ DEFAULT NOW(),
  validation_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Natural Language Processing and Text Analytics
CREATE TABLE nlp_text_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text_source VARCHAR(100) NOT NULL,
  original_text TEXT NOT NULL,
  text_hash VARCHAR(128) NOT NULL,
  language_detected VARCHAR(10),
  language_confidence DECIMAL(5,4),
  sentiment_analysis JSONB DEFAULT '{}', -- positive, negative, neutral scores
  emotion_analysis JSONB DEFAULT '{}', -- joy, anger, fear, etc.
  topic_classification JSONB DEFAULT '{}',
  named_entities JSONB DEFAULT '{}', -- persons, organizations, locations
  key_phrases JSONB DEFAULT '{}',
  intent_analysis JSONB DEFAULT '{}',
  urgency_score DECIMAL(5,4),
  toxicity_score DECIMAL(5,4),
  spam_score DECIMAL(5,4),
  readability_score DECIMAL(5,4),
  complexity_score DECIMAL(5,4),
  summarization_available BOOLEAN DEFAULT false,
  text_summary TEXT,
  keywords_extracted TEXT[],
  tags_auto_generated TEXT[],
  content_moderation JSONB DEFAULT '{}',
  privacy_entities_detected JSONB DEFAULT '{}',
  compliance_flags TEXT[],
  translation_available BOOLEAN DEFAULT false,
  translated_text JSONB DEFAULT '{}', -- language -> translated text
  processing_models_used TEXT[],
  processing_time_ms DECIMAL(8,2),
  confidence_overall DECIMAL(5,4),
  quality_score DECIMAL(5,4),
  analysis_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Computer Vision and Image Analysis
CREATE TABLE cv_image_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_source VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  image_hash VARCHAR(128) NOT NULL,
  image_format VARCHAR(20),
  image_size_bytes BIGINT,
  image_dimensions JSONB DEFAULT '{}', -- width, height
  image_quality_score DECIMAL(5,4),
  object_detection JSONB DEFAULT '{}', -- detected objects with bounding boxes
  face_detection JSONB DEFAULT '{}', -- faces with landmarks
  person_detection JSONB DEFAULT '{}', -- person count and attributes
  vehicle_detection JSONB DEFAULT '{}', -- vehicles and license plates
  scene_classification JSONB DEFAULT '{}', -- indoor/outdoor, scene type
  activity_recognition JSONB DEFAULT '{}', -- activities detected
  anomaly_detection JSONB DEFAULT '{}', -- unusual patterns
  safety_compliance JSONB DEFAULT '{}', -- safety equipment, violations
  security_threats JSONB DEFAULT '{}', -- weapons, suspicious activities
  crowd_analysis JSONB DEFAULT '{}', -- crowd density, behavior
  accessibility_features JSONB DEFAULT '{}', -- wheelchair access, ramps
  text_extraction JSONB DEFAULT '{}', -- OCR results
  barcode_qr_detection JSONB DEFAULT '{}', -- codes detected
  landmark_recognition JSONB DEFAULT '{}', -- known locations
  brand_logo_detection JSONB DEFAULT '{}', -- company logos
  content_moderation JSONB DEFAULT '{}', -- inappropriate content
  privacy_protection JSONB DEFAULT '{}', -- face blurring, anonymization
  image_enhancement JSONB DEFAULT '{}', -- enhancement options
  metadata_extraction JSONB DEFAULT '{}', -- EXIF data
  gps_coordinates JSONB DEFAULT '{}', -- location if available
  processing_models_used TEXT[],
  processing_time_ms DECIMAL(8,2),
  confidence_overall DECIMAL(5,4),
  analysis_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI Model Performance Monitoring
CREATE TABLE ai_model_monitoring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
  monitoring_date DATE DEFAULT CURRENT_DATE,
  prediction_count INTEGER DEFAULT 0,
  accuracy_score DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall_score DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  auc_score DECIMAL(5,4),
  model_drift_score DECIMAL(5,4),
  data_drift_score DECIMAL(5,4),
  concept_drift_score DECIMAL(5,4),
  feature_importance_changes JSONB DEFAULT '{}',
  performance_degradation BOOLEAN DEFAULT false,
  anomaly_predictions_count INTEGER DEFAULT 0,
  false_positive_count INTEGER DEFAULT 0,
  false_negative_count INTEGER DEFAULT 0,
  bias_metrics JSONB DEFAULT '{}',
  fairness_metrics JSONB DEFAULT '{}',
  inference_latency_avg_ms DECIMAL(8,2),
  inference_latency_p95_ms DECIMAL(8,2),
  throughput_requests_per_second DECIMAL(8,2),
  error_rate DECIMAL(5,4),
  resource_utilization JSONB DEFAULT '{}',
  cost_metrics JSONB DEFAULT '{}',
  user_feedback_summary JSONB DEFAULT '{}',
  business_impact_metrics JSONB DEFAULT '{}',
  compliance_status JSONB DEFAULT '{}',
  alerts_triggered INTEGER DEFAULT 0,
  recommendations JSONB DEFAULT '{}',
  retraining_recommended BOOLEAN DEFAULT false,
  model_health_score DECIMAL(5,4),
  monitoring_alerts JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Automated Workflow Engine
CREATE TABLE ai_automated_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name VARCHAR(200) NOT NULL,
  workflow_description TEXT,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('event', 'schedule', 'api_call', 'model_prediction', 'threshold_breach', 'manual')),
  trigger_conditions JSONB NOT NULL,
  workflow_steps JSONB NOT NULL, -- Array of steps with AI models and actions
  ai_models_integrated UUID[] DEFAULT ARRAY[]::UUID[],
  decision_points JSONB DEFAULT '{}',
  approval_gates JSONB DEFAULT '{}',
  escalation_rules JSONB DEFAULT '{}',
  error_handling JSONB DEFAULT '{}',
  rollback_procedures JSONB DEFAULT '{}',
  timeout_settings JSONB DEFAULT '{}',
  retry_policies JSONB DEFAULT '{}',
  notification_rules JSONB DEFAULT '{}',
  audit_requirements JSONB DEFAULT '{}',
  compliance_checks JSONB DEFAULT '{}',
  performance_sla JSONB DEFAULT '{}',
  resource_limits JSONB DEFAULT '{}',
  cost_controls JSONB DEFAULT '{}',
  testing_configuration JSONB DEFAULT '{}',
  monitoring_dashboard JSONB DEFAULT '{}',
  success_criteria JSONB DEFAULT '{}',
  business_rules JSONB DEFAULT '{}',
  data_governance JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  execution_history_retention_days INTEGER DEFAULT 90,
  is_active BOOLEAN DEFAULT true,
  version_number VARCHAR(20) DEFAULT '1.0',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Advanced Analytics and Insights Engine
CREATE TABLE ai_insights_engine (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('pattern_detection', 'anomaly_discovery', 'trend_analysis', 'predictive_forecast', 'optimization_opportunity', 'risk_assessment')),
  insight_category VARCHAR(50) NOT NULL,
  insight_title VARCHAR(200) NOT NULL,
  insight_description TEXT NOT NULL,
  insight_data JSONB NOT NULL,
  confidence_score DECIMAL(5,4) NOT NULL,
  impact_score DECIMAL(5,4) NOT NULL,
  urgency_score DECIMAL(5,4) NOT NULL,
  data_sources TEXT[] NOT NULL,
  ai_models_used UUID[] NOT NULL,
  analysis_time_range JSONB NOT NULL,
  statistical_significance DECIMAL(5,4),
  correlation_factors JSONB DEFAULT '{}',
  causal_relationships JSONB DEFAULT '{}',
  predictive_accuracy DECIMAL(5,4),
  recommendation_actions JSONB DEFAULT '{}',
  business_value_estimate DECIMAL(12,2),
  implementation_complexity VARCHAR(20) DEFAULT 'medium' CHECK (implementation_complexity IN ('low', 'medium', 'high')),
  resource_requirements JSONB DEFAULT '{}',
  timeline_estimate JSONB DEFAULT '{}',
  risk_factors JSONB DEFAULT '{}',
  success_metrics JSONB DEFAULT '{}',
  validation_methods JSONB DEFAULT '{}',
  stakeholder_impact JSONB DEFAULT '{}',
  compliance_considerations JSONB DEFAULT '{}',
  visualization_data JSONB DEFAULT '{}',
  export_formats TEXT[] DEFAULT ARRAY['json', 'pdf', 'excel'],
  sharing_permissions JSONB DEFAULT '{}',
  follow_up_actions JSONB DEFAULT '{}',
  insight_status VARCHAR(20) DEFAULT 'new' CHECK (insight_status IN ('new', 'reviewed', 'approved', 'implemented', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advanced Indexes for AI Performance
CREATE INDEX idx_ai_models_type_status ON ai_models (model_type, deployment_status);
CREATE INDEX idx_ai_models_performance ON ai_models (accuracy_score DESC, inference_latency_ms ASC);
CREATE INDEX idx_ai_training_jobs_status_priority ON ai_training_jobs (job_status, job_priority DESC, created_at DESC);
CREATE INDEX idx_ai_inference_sessions_model_time ON ai_inference_sessions (model_id, inference_start_time DESC);
CREATE INDEX idx_ai_decision_executions_rule_time ON ai_decision_executions (decision_rule_id, execution_timestamp DESC);
CREATE INDEX idx_nlp_analysis_source_time ON nlp_text_analysis (text_source, analysis_timestamp DESC);
CREATE INDEX idx_cv_analysis_source_time ON cv_image_analysis (image_source, analysis_timestamp DESC);
CREATE INDEX idx_ai_monitoring_model_date ON ai_model_monitoring (model_id, monitoring_date DESC);
CREATE INDEX idx_ai_insights_type_urgency ON ai_insights_engine (insight_type, urgency_score DESC, generated_at DESC);

-- AI Model Deployment Function
CREATE OR REPLACE FUNCTION deploy_ai_model(
  p_model_id UUID,
  p_target_environment VARCHAR(20),
  p_resource_config JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  model_info RECORD;
  deployment_result JSONB;
  endpoint_url TEXT;
BEGIN
  -- Get model information
  SELECT * INTO model_info
  FROM ai_models
  WHERE id = p_model_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Model not found');
  END IF;

  -- Generate endpoint URL
  endpoint_url := 'https://api.secure-gate.com/ai/models/' || p_model_id::text || '/predict';

  -- Update model deployment status
  UPDATE ai_models
  SET 
    deployment_status = p_target_environment,
    api_endpoint = endpoint_url,
    updated_at = NOW()
  WHERE id = p_model_id;

  -- Create deployment record
  deployment_result := jsonb_build_object(
    'success', true,
    'model_id', p_model_id,
    'environment', p_target_environment,
    'endpoint_url', endpoint_url,
    'deployment_time', NOW(),
    'resource_config', p_resource_config,
    'estimated_latency_ms', model_info.inference_latency_ms,
    'expected_throughput', model_info.throughput_requests_per_second
  );

  RETURN deployment_result;
END;
$$ LANGUAGE plpgsql;

-- AI Performance Analysis Function
CREATE OR REPLACE FUNCTION analyze_ai_model_performance(
  p_model_id UUID,
  p_analysis_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  performance_data JSONB;
  recent_predictions INTEGER;
  avg_accuracy DECIMAL(5,4);
  avg_latency DECIMAL(8,2);
  drift_detected BOOLEAN;
  recommendations TEXT[];
BEGIN
  -- Get recent prediction count
  SELECT COUNT(*) INTO recent_predictions
  FROM ai_inference_sessions
  WHERE model_id = p_model_id
    AND inference_start_time > NOW() - INTERVAL '1 day' * p_analysis_days;

  -- Calculate average accuracy from monitoring data
  SELECT AVG(accuracy_score) INTO avg_accuracy
  FROM ai_model_monitoring
  WHERE model_id = p_model_id
    AND monitoring_date > CURRENT_DATE - INTERVAL '1 day' * p_analysis_days;

  -- Calculate average inference latency
  SELECT AVG(processing_time_ms) INTO avg_latency
  FROM ai_inference_sessions
  WHERE model_id = p_model_id
    AND inference_start_time > NOW() - INTERVAL '1 day' * p_analysis_days;

  -- Check for model drift
  SELECT EXISTS (
    SELECT 1 FROM ai_model_monitoring
    WHERE model_id = p_model_id
      AND monitoring_date > CURRENT_DATE - INTERVAL '7 days'
      AND model_drift_score > 0.1
  ) INTO drift_detected;

  -- Generate recommendations
  recommendations := ARRAY[]::TEXT[];
  
  IF avg_accuracy < 0.8 THEN
    recommendations := array_append(recommendations, 'Model accuracy below threshold - consider retraining');
  END IF;
  
  IF avg_latency > 1000 THEN
    recommendations := array_append(recommendations, 'High inference latency - optimize model or infrastructure');
  END IF;
  
  IF drift_detected THEN
    recommendations := array_append(recommendations, 'Model drift detected - schedule retraining');
  END IF;
  
  IF recent_predictions < 100 THEN
    recommendations := array_append(recommendations, 'Low prediction volume - monitor model usage');
  END IF;

  performance_data := jsonb_build_object(
    'model_id', p_model_id,
    'analysis_period_days', p_analysis_days,
    'recent_predictions', COALESCE(recent_predictions, 0),
    'average_accuracy', COALESCE(avg_accuracy, 0),
    'average_latency_ms', COALESCE(avg_latency, 0),
    'drift_detected', COALESCE(drift_detected, false),
    'recommendations', recommendations,
    'analysis_timestamp', NOW()
  );

  RETURN performance_data;
END;
$$ LANGUAGE plpgsql;

-- AI Automated Decision Function
CREATE OR REPLACE FUNCTION execute_ai_decision(
  p_rule_id UUID,
  p_input_data JSONB,
  p_context JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  rule_info RECORD;
  model_predictions JSONB;
  decision_outcome VARCHAR(50);
  confidence_score DECIMAL(5,4);
  actions_taken JSONB;
  execution_result JSONB;
BEGIN
  -- Get decision rule information
  SELECT * INTO rule_info
  FROM ai_decision_rules
  WHERE id = p_rule_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Decision rule not found or inactive');
  END IF;

  -- Simulate AI model predictions (in real implementation, call actual models)
  model_predictions := jsonb_build_object(
    'risk_score', random() * 0.4 + 0.3,  -- 0.3 to 0.7
    'confidence', random() * 0.3 + 0.7,   -- 0.7 to 1.0
    'classification', CASE 
      WHEN random() > 0.7 THEN 'high_risk'
      WHEN random() > 0.4 THEN 'medium_risk'
      ELSE 'low_risk'
    END
  );

  confidence_score := (model_predictions->>'confidence')::decimal;
  
  -- Make decision based on confidence threshold
  IF confidence_score >= rule_info.confidence_threshold THEN
    decision_outcome := rule_info.action_type;
    actions_taken := rule_info.automated_actions;
  ELSE
    decision_outcome := 'request_review';
    actions_taken := jsonb_build_object('reason', 'Low confidence score');
  END IF;

  -- Record the execution
  INSERT INTO ai_decision_executions (
    decision_rule_id,
    execution_context,
    input_data,
    ai_predictions,
    confidence_scores,
    decision_outcome,
    actions_taken,
    execution_time_ms,
    human_review_required,
    business_impact_score
  ) VALUES (
    p_rule_id,
    p_context,
    p_input_data,
    model_predictions,
    jsonb_build_object('overall', confidence_score),
    decision_outcome,
    actions_taken,
    random() * 500 + 50, -- 50-550ms
    confidence_score < rule_info.confidence_threshold,
    random() * 5 + 1 -- 1-6 impact score
  );

  -- Update rule activation count
  UPDATE ai_decision_rules
  SET 
    rule_activation_count = rule_activation_count + 1,
    last_triggered = NOW()
  WHERE id = p_rule_id;

  execution_result := jsonb_build_object(
    'success', true,
    'decision_outcome', decision_outcome,
    'confidence_score', confidence_score,
    'actions_taken', actions_taken,
    'human_review_required', confidence_score < rule_info.confidence_threshold,
    'model_predictions', model_predictions,
    'execution_timestamp', NOW()
  );

  RETURN execution_result;
END;
$$ LANGUAGE plpgsql;

-- Insert Sample AI Models
INSERT INTO ai_models (model_name, model_type, model_category, model_version, model_framework, model_description, model_file_path, deployment_status, accuracy_score) VALUES
('Security Risk Classifier', 'classification', 'security', '2.1', 'tensorflow', 'Classifies security threats from visitor behavior patterns', '/models/security_risk_v2.1.h5', 'production', 0.92),
('Visitor Flow Predictor', 'regression', 'analytics', '1.5', 'pytorch', 'Predicts visitor traffic patterns and optimal routing', '/models/visitor_flow_v1.5.pt', 'production', 0.87),
('Anomaly Detection Engine', 'anomaly_detection', 'security', '3.0', 'scikit_learn', 'Detects unusual patterns in access logs and behavior', '/models/anomaly_detection_v3.0.pkl', 'production', 0.89),
('Face Recognition System', 'computer_vision', 'security', '1.8', 'tensorflow', 'Advanced face recognition for visitor identification', '/models/face_recognition_v1.8.h5', 'production', 0.95),
('Text Sentiment Analyzer', 'nlp', 'analytics', '2.3', 'huggingface', 'Analyzes sentiment in visitor feedback and communications', '/models/sentiment_v2.3/', 'staging', 0.91),
('Predictive Maintenance AI', 'regression', 'optimization', '1.2', 'xgboost', 'Predicts equipment maintenance needs', '/models/maintenance_v1.2.json', 'production', 0.84);

-- Insert Sample Decision Rules
INSERT INTO ai_decision_rules (rule_name, rule_category, trigger_conditions, ai_models_used, decision_logic, action_type, confidence_threshold) VALUES
('High Risk Visitor Alert', 'security', '{"visitor_risk_score": {"gt": 0.7}}', ARRAY[(SELECT id FROM ai_models WHERE model_name = 'Security Risk Classifier')], '{"if_risk_high": "immediate_alert"}', 'alert', 0.85),
('Automatic Access Approval', 'access_control', '{"visitor_verified": true, "risk_score": {"lt": 0.3}}', ARRAY[(SELECT id FROM ai_models WHERE model_name = 'Security Risk Classifier')], '{"if_low_risk_verified": "auto_approve"}', 'auto_approve', 0.90),
('Anomaly Investigation', 'security', '{"anomaly_detected": true}', ARRAY[(SELECT id FROM ai_models WHERE model_name = 'Anomaly Detection Engine')], '{"if_anomaly": "investigate"}', 'escalate', 0.80);

-- RLS Policies
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_inference_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decision_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decision_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nlp_text_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_image_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_automated_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_engine ENABLE ROW LEVEL SECURITY;

-- Service role access for AI operations
CREATE POLICY ai_models_service_role ON ai_models USING (auth.role() = 'service_role');
CREATE POLICY ai_training_jobs_service_role ON ai_training_jobs USING (auth.role() = 'service_role');
CREATE POLICY ai_inference_sessions_service_role ON ai_inference_sessions USING (auth.role() = 'service_role');
CREATE POLICY ai_decision_rules_service_role ON ai_decision_rules USING (auth.role() = 'service_role');
CREATE POLICY ai_decision_executions_service_role ON ai_decision_executions USING (auth.role() = 'service_role');
CREATE POLICY nlp_text_analysis_service_role ON nlp_text_analysis USING (auth.role() = 'service_role');
CREATE POLICY cv_image_analysis_service_role ON cv_image_analysis USING (auth.role() = 'service_role');
CREATE POLICY ai_model_monitoring_service_role ON ai_model_monitoring USING (auth.role() = 'service_role');
CREATE POLICY ai_automated_workflows_service_role ON ai_automated_workflows USING (auth.role() = 'service_role');
CREATE POLICY ai_insights_engine_service_role ON ai_insights_engine USING (auth.role() = 'service_role');

COMMENT ON TABLE ai_models IS 'Registry of AI/ML models with deployment and performance tracking';
COMMENT ON TABLE ai_training_jobs IS 'AI model training job management and monitoring';
COMMENT ON TABLE ai_inference_sessions IS 'AI model inference sessions and results tracking';
COMMENT ON TABLE ai_decision_rules IS 'AI-powered automated decision rules and logic';
COMMENT ON TABLE ai_decision_executions IS 'AI decision execution history and outcomes';
COMMENT ON TABLE nlp_text_analysis IS 'Natural language processing and text analytics results';
COMMENT ON TABLE cv_image_analysis IS 'Computer vision and image analysis results';
COMMENT ON TABLE ai_model_monitoring IS 'AI model performance monitoring and drift detection';
COMMENT ON TABLE ai_automated_workflows IS 'AI-powered automated workflow definitions';
COMMENT ON TABLE ai_insights_engine IS 'Advanced analytics and AI-generated insights';
