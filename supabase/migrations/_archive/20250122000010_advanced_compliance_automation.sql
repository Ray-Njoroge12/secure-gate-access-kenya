-- Advanced Compliance Automation - Low Priority Phase
-- Automated Regulatory Reporting and Compliance Monitoring

-- 1. Regulatory Frameworks and Standards
CREATE TABLE regulatory_frameworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_name VARCHAR(200) NOT NULL UNIQUE,
  framework_code VARCHAR(50) NOT NULL UNIQUE,
  framework_type VARCHAR(50) NOT NULL CHECK (framework_type IN ('privacy', 'security', 'financial', 'industry_specific', 'international', 'national', 'regional')),
  jurisdiction VARCHAR(100) NOT NULL,
  regulatory_body VARCHAR(200) NOT NULL,
  effective_date DATE NOT NULL,
  last_updated DATE,
  version_number VARCHAR(20) DEFAULT '1.0',
  framework_description TEXT,
  scope_and_applicability JSONB NOT NULL,
  compliance_requirements JSONB NOT NULL,
  reporting_obligations JSONB DEFAULT '{}',
  penalty_structure JSONB DEFAULT '{}',
  certification_requirements JSONB DEFAULT '{}',
  audit_requirements JSONB DEFAULT '{}',
  documentation_standards JSONB DEFAULT '{}',
  risk_assessment_criteria JSONB DEFAULT '{}',
  incident_reporting_procedures JSONB DEFAULT '{}',
  data_protection_requirements JSONB DEFAULT '{}',
  access_control_standards JSONB DEFAULT '{}',
  monitoring_requirements JSONB DEFAULT '{}',
  retention_policies JSONB DEFAULT '{}',
  cross_border_provisions JSONB DEFAULT '{}',
  technology_specific_requirements JSONB DEFAULT '{}',
  implementation_guidance JSONB DEFAULT '{}',
  best_practices JSONB DEFAULT '{}',
  related_frameworks TEXT[],
  superseded_frameworks TEXT[],
  amendment_history JSONB DEFAULT '{}',
  interpretation_guidelines JSONB DEFAULT '{}',
  enforcement_history JSONB DEFAULT '{}',
  industry_impact_assessment JSONB DEFAULT '{}',
  compliance_tools JSONB DEFAULT '{}',
  training_requirements JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  review_cycle_months INTEGER DEFAULT 12,
  next_review_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Compliance Requirements and Controls
CREATE TABLE compliance_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_code VARCHAR(100) NOT NULL,
  regulatory_framework_id UUID REFERENCES regulatory_frameworks(id) ON DELETE CASCADE,
  requirement_title VARCHAR(300) NOT NULL,
  requirement_description TEXT NOT NULL,
  requirement_category VARCHAR(50) NOT NULL CHECK (requirement_category IN ('data_protection', 'access_control', 'audit_logging', 'incident_response', 'risk_management', 'training', 'documentation')),
  compliance_level VARCHAR(20) NOT NULL CHECK (compliance_level IN ('mandatory', 'recommended', 'optional', 'conditional')),
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('critical', 'high', 'medium', 'low')),
  control_objectives JSONB NOT NULL,
  implementation_guidelines JSONB NOT NULL,
  testing_procedures JSONB DEFAULT '{}',
  evidence_requirements JSONB NOT NULL,
  measurement_criteria JSONB NOT NULL,
  automation_possible BOOLEAN DEFAULT false,
  automation_complexity VARCHAR(20) DEFAULT 'medium' CHECK (automation_complexity IN ('low', 'medium', 'high', 'very_high')),
  technical_controls JSONB DEFAULT '{}',
  administrative_controls JSONB DEFAULT '{}',
  physical_controls JSONB DEFAULT '{}',
  monitoring_requirements JSONB DEFAULT '{}',
  reporting_frequency VARCHAR(20) DEFAULT 'quarterly' CHECK (reporting_frequency IN ('real_time', 'daily', 'weekly', 'monthly', 'quarterly', 'annually')),
  exception_handling JSONB DEFAULT '{}',
  compensating_controls JSONB DEFAULT '{}',
  third_party_requirements JSONB DEFAULT '{}',
  cloud_specific_considerations JSONB DEFAULT '{}',
  mobile_device_requirements JSONB DEFAULT '{}',
  remote_work_provisions JSONB DEFAULT '{}',
  vendor_management_aspects JSONB DEFAULT '{}',
  business_continuity_requirements JSONB DEFAULT '{}',
  data_classification_requirements JSONB DEFAULT '{}',
  encryption_requirements JSONB DEFAULT '{}',
  network_security_requirements JSONB DEFAULT '{}',
  application_security_requirements JSONB DEFAULT '{}',
  identity_management_requirements JSONB DEFAULT '{}',
  privileged_access_requirements JSONB DEFAULT '{}',
  vulnerability_management_requirements JSONB DEFAULT '{}',
  change_management_requirements JSONB DEFAULT '{}',
  configuration_management_requirements JSONB DEFAULT '{}',
  asset_management_requirements JSONB DEFAULT '{}',
  effective_date DATE NOT NULL,
  review_date DATE,
  retirement_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requirement_code, regulatory_framework_id)
);

-- 3. Compliance Assessments and Evaluations
CREATE TABLE compliance_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_name VARCHAR(200) NOT NULL,
  assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('self_assessment', 'internal_audit', 'external_audit', 'compliance_review', 'gap_analysis', 'maturity_assessment')),
  regulatory_framework_id UUID REFERENCES regulatory_frameworks(id) ON DELETE CASCADE,
  assessment_scope JSONB NOT NULL,
  assessment_criteria JSONB NOT NULL,
  assessment_methodology VARCHAR(100) NOT NULL,
  assessment_start_date DATE NOT NULL,
  assessment_end_date DATE,
  planned_completion_date DATE NOT NULL,
  actual_completion_date DATE,
  assessment_status VARCHAR(20) DEFAULT 'planned' CHECK (assessment_status IN ('planned', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  overall_compliance_score DECIMAL(5,2),
  risk_rating VARCHAR(20) CHECK (risk_rating IN ('critical', 'high', 'medium', 'low')),
  assessor_information JSONB NOT NULL,
  assessment_team JSONB DEFAULT '{}',
  external_auditor_details JSONB DEFAULT '{}',
  assessment_tools_used TEXT[],
  sampling_methodology JSONB DEFAULT '{}',
  testing_procedures JSONB DEFAULT '{}',
  evidence_collection_methods JSONB DEFAULT '{}',
  interview_participants JSONB DEFAULT '{}',
  document_review_scope JSONB DEFAULT '{}',
  technical_testing_scope JSONB DEFAULT '{}',
  findings_summary JSONB DEFAULT '{}',
  non_compliance_issues JSONB DEFAULT '{}',
  remediation_recommendations JSONB DEFAULT '{}',
  improvement_opportunities JSONB DEFAULT '{}',
  management_response JSONB DEFAULT '{}',
  follow_up_actions JSONB DEFAULT '{}',
  lessons_learned JSONB DEFAULT '{}',
  cost_of_assessment DECIMAL(12,2),
  business_impact_assessment JSONB DEFAULT '{}',
  stakeholder_communication JSONB DEFAULT '{}',
  reporting_requirements JSONB DEFAULT '{}',
  certification_implications JSONB DEFAULT '{}',
  regulatory_notification_required BOOLEAN DEFAULT false,
  public_disclosure_required BOOLEAN DEFAULT false,
  executive_summary TEXT,
  detailed_report_url TEXT,
  supporting_documents JSONB DEFAULT '{}',
  assessment_quality_score DECIMAL(5,2),
  peer_review_results JSONB DEFAULT '{}',
  validation_results JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Compliance Monitoring and Continuous Assessment
CREATE TABLE compliance_monitoring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  monitoring_name VARCHAR(200) NOT NULL,
  compliance_requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE CASCADE,
  monitoring_type VARCHAR(50) NOT NULL CHECK (monitoring_type IN ('automated', 'manual', 'hybrid', 'real_time', 'periodic')),
  monitoring_frequency VARCHAR(20) NOT NULL CHECK (monitoring_frequency IN ('continuous', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly')),
  monitoring_scope JSONB NOT NULL,
  data_sources JSONB NOT NULL,
  monitoring_criteria JSONB NOT NULL,
  threshold_settings JSONB NOT NULL,
  alert_conditions JSONB NOT NULL,
  escalation_procedures JSONB NOT NULL,
  automated_remediation JSONB DEFAULT '{}',
  manual_intervention_required BOOLEAN DEFAULT false,
  monitoring_tools TEXT[],
  data_collection_methods JSONB DEFAULT '{}',
  analysis_algorithms JSONB DEFAULT '{}',
  baseline_measurements JSONB DEFAULT '{}',
  trend_analysis_settings JSONB DEFAULT '{}',
  anomaly_detection_rules JSONB DEFAULT '{}',
  correlation_rules JSONB DEFAULT '{}',
  risk_scoring_methodology JSONB DEFAULT '{}',
  reporting_templates JSONB DEFAULT '{}',
  dashboard_configurations JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  integration_endpoints JSONB DEFAULT '{}',
  api_configurations JSONB DEFAULT '{}',
  data_retention_policies JSONB DEFAULT '{}',
  archival_procedures JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  effectiveness_measures JSONB DEFAULT '{}',
  cost_efficiency_tracking JSONB DEFAULT '{}',
  resource_utilization JSONB DEFAULT '{}',
  false_positive_rates JSONB DEFAULT '{}',
  false_negative_rates JSONB DEFAULT '{}',
  accuracy_measurements JSONB DEFAULT '{}',
  calibration_procedures JSONB DEFAULT '{}',
  maintenance_schedules JSONB DEFAULT '{}',
  update_procedures JSONB DEFAULT '{}',
  version_control JSONB DEFAULT '{}',
  change_management JSONB DEFAULT '{}',
  testing_procedures JSONB DEFAULT '{}',
  validation_methods JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_execution TIMESTAMPTZ,
  next_execution TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Compliance Violations and Incidents
CREATE TABLE compliance_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  violation_id VARCHAR(100) NOT NULL UNIQUE,
  compliance_requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE CASCADE,
  monitoring_id UUID REFERENCES compliance_monitoring(id) ON DELETE SET NULL,
  violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN ('data_breach', 'access_violation', 'policy_violation', 'procedure_violation', 'control_failure', 'reporting_failure')),
  severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('critical', 'high', 'medium', 'low')),
  violation_status VARCHAR(20) DEFAULT 'open' CHECK (violation_status IN ('open', 'investigating', 'resolved', 'closed', 'false_positive')),
  detection_method VARCHAR(50) NOT NULL CHECK (detection_method IN ('automated_monitoring', 'manual_review', 'self_reported', 'external_notification', 'audit_finding')),
  detected_at TIMESTAMPTZ NOT NULL,
  detected_by VARCHAR(200),
  violation_description TEXT NOT NULL,
  affected_systems TEXT[],
  affected_data_categories TEXT[],
  affected_individuals_count INTEGER,
  business_impact JSONB NOT NULL,
  technical_impact JSONB NOT NULL,
  regulatory_impact JSONB NOT NULL,
  root_cause_analysis JSONB DEFAULT '{}',
  contributing_factors JSONB DEFAULT '{}',
  timeline_of_events JSONB DEFAULT '{}',
  evidence_collected JSONB DEFAULT '{}',
  investigation_findings JSONB DEFAULT '{}',
  investigation_team JSONB DEFAULT '{}',
  external_parties_involved JSONB DEFAULT '{}',
  regulatory_notifications JSONB DEFAULT '{}',
  customer_notifications JSONB DEFAULT '{}',
  media_coverage JSONB DEFAULT '{}',
  legal_implications JSONB DEFAULT '{}',
  financial_impact JSONB DEFAULT '{}',
  reputation_impact JSONB DEFAULT '{}',
  immediate_actions_taken JSONB DEFAULT '{}',
  containment_measures JSONB DEFAULT '{}',
  remediation_plan JSONB DEFAULT '{}',
  corrective_actions JSONB DEFAULT '{}',
  preventive_measures JSONB DEFAULT '{}',
  monitoring_enhancements JSONB DEFAULT '{}',
  policy_updates_required JSONB DEFAULT '{}',
  training_requirements JSONB DEFAULT '{}',
  technology_improvements JSONB DEFAULT '{}',
  process_improvements JSONB DEFAULT '{}',
  organizational_changes JSONB DEFAULT '{}',
  third_party_involvement JSONB DEFAULT '{}',
  lessons_learned JSONB DEFAULT '{}',
  best_practices_identified JSONB DEFAULT '{}',
  knowledge_sharing JSONB DEFAULT '{}',
  similar_incidents_analysis JSONB DEFAULT '{}',
  trend_analysis JSONB DEFAULT '{}',
  risk_reassessment JSONB DEFAULT '{}',
  compliance_program_updates JSONB DEFAULT '{}',
  governance_improvements JSONB DEFAULT '{}',
  reporting_timeline JSONB DEFAULT '{}',
  stakeholder_communication JSONB DEFAULT '{}',
  resolution_date TIMESTAMPTZ,
  closure_date TIMESTAMPTZ,
  closure_reason TEXT,
  assigned_to UUID,
  escalated_to UUID,
  priority_level INTEGER DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 5),
  sla_breach BOOLEAN DEFAULT false,
  recurring_violation BOOLEAN DEFAULT false,
  related_violations UUID[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Automated Compliance Reports
CREATE TABLE automated_compliance_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_name VARCHAR(200) NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('regulatory_filing', 'board_report', 'management_dashboard', 'audit_report', 'risk_assessment', 'performance_metrics')),
  regulatory_framework_id UUID REFERENCES regulatory_frameworks(id) ON DELETE CASCADE,
  report_frequency VARCHAR(20) NOT NULL CHECK (report_frequency IN ('real_time', 'daily', 'weekly', 'monthly', 'quarterly', 'annually', 'on_demand')),
  report_scope JSONB NOT NULL,
  data_sources JSONB NOT NULL,
  report_template JSONB NOT NULL,
  generation_rules JSONB NOT NULL,
  distribution_list JSONB NOT NULL,
  delivery_methods JSONB DEFAULT '{}',
  format_options JSONB DEFAULT '{}',
  customization_settings JSONB DEFAULT '{}',
  branding_requirements JSONB DEFAULT '{}',
  language_settings JSONB DEFAULT '{}',
  timezone_settings JSONB DEFAULT '{}',
  currency_settings JSONB DEFAULT '{}',
  data_aggregation_rules JSONB DEFAULT '{}',
  calculation_methodologies JSONB DEFAULT '{}',
  statistical_analysis JSONB DEFAULT '{}',
  trend_analysis_settings JSONB DEFAULT '{}',
  comparative_analysis JSONB DEFAULT '{}',
  benchmark_data JSONB DEFAULT '{}',
  visualization_settings JSONB DEFAULT '{}',
  chart_configurations JSONB DEFAULT '{}',
  table_formats JSONB DEFAULT '{}',
  summary_requirements JSONB DEFAULT '{}',
  detailed_analysis JSONB DEFAULT '{}',
  executive_summary_template TEXT,
  technical_details_template TEXT,
  appendix_requirements JSONB DEFAULT '{}',
  footnote_standards JSONB DEFAULT '{}',
  disclaimer_text TEXT,
  confidentiality_markings JSONB DEFAULT '{}',
  security_classifications JSONB DEFAULT '{}',
  access_restrictions JSONB DEFAULT '{}',
  retention_requirements JSONB DEFAULT '{}',
  archival_procedures JSONB DEFAULT '{}',
  audit_trail_requirements JSONB DEFAULT '{}',
  version_control JSONB DEFAULT '{}',
  approval_workflows JSONB DEFAULT '{}',
  review_processes JSONB DEFAULT '{}',
  quality_assurance JSONB DEFAULT '{}',
  validation_rules JSONB DEFAULT '{}',
  error_handling JSONB DEFAULT '{}',
  fallback_procedures JSONB DEFAULT '{}',
  performance_optimization JSONB DEFAULT '{}',
  scalability_considerations JSONB DEFAULT '{}',
  integration_requirements JSONB DEFAULT '{}',
  api_configurations JSONB DEFAULT '{}',
  automation_level VARCHAR(20) DEFAULT 'fully_automated' CHECK (automation_level IN ('manual', 'semi_automated', 'fully_automated')),
  manual_review_required BOOLEAN DEFAULT false,
  approval_required BOOLEAN DEFAULT false,
  regulatory_submission_required BOOLEAN DEFAULT false,
  public_disclosure_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_generated TIMESTAMPTZ,
  next_generation TIMESTAMPTZ,
  generation_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  average_generation_time_minutes DECIMAL(8,2),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Compliance Evidence and Documentation
CREATE TABLE compliance_evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evidence_id VARCHAR(100) NOT NULL UNIQUE,
  compliance_requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES compliance_assessments(id) ON DELETE SET NULL,
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('document', 'screenshot', 'log_file', 'configuration', 'policy', 'procedure', 'training_record', 'certification')),
  evidence_category VARCHAR(50) NOT NULL CHECK (evidence_category IN ('technical_control', 'administrative_control', 'physical_control', 'documentation', 'training', 'monitoring')),
  evidence_title VARCHAR(300) NOT NULL,
  evidence_description TEXT,
  file_path TEXT,
  file_size_bytes BIGINT,
  file_format VARCHAR(20),
  file_hash VARCHAR(128),
  digital_signature JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  collection_method VARCHAR(50) NOT NULL CHECK (collection_method IN ('automated', 'manual', 'api_extraction', 'database_query', 'log_analysis')),
  collection_timestamp TIMESTAMPTZ NOT NULL,
  collected_by VARCHAR(200),
  data_source VARCHAR(200),
  validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected', 'expired')),
  validation_criteria JSONB DEFAULT '{}',
  validation_results JSONB DEFAULT '{}',
  validation_date TIMESTAMPTZ,
  validated_by VARCHAR(200),
  authenticity_verified BOOLEAN DEFAULT false,
  integrity_verified BOOLEAN DEFAULT false,
  completeness_verified BOOLEAN DEFAULT false,
  accuracy_verified BOOLEAN DEFAULT false,
  timeliness_verified BOOLEAN DEFAULT false,
  relevance_score DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  reliability_score DECIMAL(5,2),
  confidence_level DECIMAL(5,2),
  chain_of_custody JSONB DEFAULT '{}',
  access_log JSONB DEFAULT '{}',
  retention_period_months INTEGER,
  retention_reason TEXT,
  disposal_date DATE,
  disposal_method VARCHAR(50),
  legal_hold BOOLEAN DEFAULT false,
  legal_hold_reason TEXT,
  privacy_classification VARCHAR(20) DEFAULT 'internal' CHECK (privacy_classification IN ('public', 'internal', 'confidential', 'restricted')),
  security_classification VARCHAR(20) DEFAULT 'standard' CHECK (security_classification IN ('public', 'standard', 'sensitive', 'highly_sensitive')),
  encryption_status BOOLEAN DEFAULT false,
  encryption_method VARCHAR(50),
  access_controls JSONB DEFAULT '{}',
  sharing_restrictions JSONB DEFAULT '{}',
  geographic_restrictions JSONB DEFAULT '{}',
  cross_reference_ids UUID[],
  related_evidence UUID[],
  supporting_documents JSONB DEFAULT '{}',
  contextual_information JSONB DEFAULT '{}',
  business_justification TEXT,
  regulatory_relevance JSONB DEFAULT '{}',
  audit_trail JSONB DEFAULT '{}',
  change_history JSONB DEFAULT '{}',
  version_information JSONB DEFAULT '{}',
  superseded_evidence UUID,
  superseded_by UUID,
  superseded_reason TEXT,
  tags TEXT[],
  keywords TEXT[],
  search_metadata JSONB DEFAULT '{}',
  indexing_information JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Compliance Training and Awareness
CREATE TABLE compliance_training (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  training_program_name VARCHAR(200) NOT NULL,
  regulatory_framework_id UUID REFERENCES regulatory_frameworks(id) ON DELETE CASCADE,
  training_type VARCHAR(50) NOT NULL CHECK (training_type IN ('general_awareness', 'role_specific', 'technical_training', 'leadership_training', 'vendor_training')),
  target_audience VARCHAR(100) NOT NULL,
  training_objectives JSONB NOT NULL,
  learning_outcomes JSONB NOT NULL,
  training_content JSONB NOT NULL,
  delivery_methods JSONB NOT NULL,
  duration_hours DECIMAL(6,2),
  prerequisites TEXT[],
  training_materials JSONB DEFAULT '{}',
  assessment_criteria JSONB DEFAULT '{}',
  certification_requirements JSONB DEFAULT '{}',
  recertification_period_months INTEGER,
  mandatory_training BOOLEAN DEFAULT true,
  completion_deadline DATE,
  training_schedule JSONB DEFAULT '{}',
  instructor_information JSONB DEFAULT '{}',
  training_venue_requirements JSONB DEFAULT '{}',
  technology_requirements JSONB DEFAULT '{}',
  accessibility_considerations JSONB DEFAULT '{}',
  language_options TEXT[],
  customization_options JSONB DEFAULT '{}',
  personalization_features JSONB DEFAULT '{}',
  progress_tracking JSONB DEFAULT '{}',
  engagement_metrics JSONB DEFAULT '{}',
  effectiveness_measures JSONB DEFAULT '{}',
  feedback_collection JSONB DEFAULT '{}',
  improvement_opportunities JSONB DEFAULT '{}',
  cost_per_participant DECIMAL(10,2),
  budget_allocation DECIMAL(12,2),
  resource_requirements JSONB DEFAULT '{}',
  vendor_information JSONB DEFAULT '{}',
  procurement_details JSONB DEFAULT '{}',
  contract_terms JSONB DEFAULT '{}',
  service_level_agreements JSONB DEFAULT '{}',
  quality_assurance JSONB DEFAULT '{}',
  compliance_validation JSONB DEFAULT '{}',
  regulatory_approval JSONB DEFAULT '{}',
  accreditation_status JSONB DEFAULT '{}',
  industry_recognition JSONB DEFAULT '{}',
  best_practices_integration JSONB DEFAULT '{}',
  continuous_improvement JSONB DEFAULT '{}',
  version_control JSONB DEFAULT '{}',
  update_procedures JSONB DEFAULT '{}',
  maintenance_schedule JSONB DEFAULT '{}',
  retirement_criteria JSONB DEFAULT '{}',
  successor_programs JSONB DEFAULT '{}',
  migration_procedures JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  launch_date DATE,
  retirement_date DATE,
  enrollment_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  pass_rate DECIMAL(5,2),
  satisfaction_score DECIMAL(5,2),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Advanced Indexes for Compliance Performance
CREATE INDEX idx_compliance_requirements_framework_category ON compliance_requirements (regulatory_framework_id, requirement_category, is_active);
CREATE INDEX idx_compliance_assessments_framework_status ON compliance_assessments (regulatory_framework_id, assessment_status, assessment_start_date DESC);
CREATE INDEX idx_compliance_monitoring_requirement_frequency ON compliance_monitoring (compliance_requirement_id, monitoring_frequency, is_active);
CREATE INDEX idx_compliance_violations_severity_status ON compliance_violations (severity_level, violation_status, detected_at DESC);
CREATE INDEX idx_compliance_violations_requirement_type ON compliance_violations (compliance_requirement_id, violation_type, detected_at DESC);
CREATE INDEX idx_compliance_evidence_requirement_type ON compliance_evidence (compliance_requirement_id, evidence_type, collection_timestamp DESC);
CREATE INDEX idx_compliance_reports_framework_frequency ON automated_compliance_reports (regulatory_framework_id, report_frequency, is_active);
CREATE INDEX idx_compliance_training_framework_audience ON compliance_training (regulatory_framework_id, target_audience, is_active);

-- Compliance Automation Functions

-- 1. Generate Compliance Assessment Report
CREATE OR REPLACE FUNCTION generate_compliance_assessment_report(
  p_assessment_id UUID
)
RETURNS JSONB AS $$
DECLARE
  assessment_info RECORD;
  compliance_score DECIMAL(5,2);
  requirements_tested INTEGER;
  requirements_passed INTEGER;
  critical_issues INTEGER;
  high_issues INTEGER;
  report_data JSONB;
BEGIN
  -- Get assessment information
  SELECT * INTO assessment_info
  FROM compliance_assessments
  WHERE id = p_assessment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Assessment not found');
  END IF;

  -- Calculate compliance metrics (mock calculations)
  requirements_tested := 25;
  requirements_passed := 22;
  compliance_score := (requirements_passed::DECIMAL / requirements_tested) * 100;
  critical_issues := 1;
  high_issues := 2;

  -- Build report data
  report_data := jsonb_build_object(
    'assessment_id', p_assessment_id,
    'assessment_name', assessment_info.assessment_name,
    'assessment_type', assessment_info.assessment_type,
    'assessment_period', jsonb_build_object(
      'start_date', assessment_info.assessment_start_date,
      'end_date', assessment_info.assessment_end_date
    ),
    'overall_compliance_score', compliance_score,
    'summary_metrics', jsonb_build_object(
      'requirements_tested', requirements_tested,
      'requirements_passed', requirements_passed,
      'compliance_percentage', compliance_score,
      'critical_issues', critical_issues,
      'high_risk_issues', high_issues
    ),
    'risk_assessment', jsonb_build_object(
      'overall_risk_level', CASE 
        WHEN compliance_score >= 95 THEN 'low'
        WHEN compliance_score >= 85 THEN 'medium'
        WHEN compliance_score >= 70 THEN 'high'
        ELSE 'critical'
      END,
      'key_risk_areas', ARRAY['data_protection', 'access_control'],
      'mitigation_recommendations', ARRAY[
        'Implement additional access controls',
        'Enhance data encryption practices',
        'Improve audit logging coverage'
      ]
    ),
    'next_steps', jsonb_build_object(
      'immediate_actions', ARRAY['Address critical findings'],
      'short_term_goals', ARRAY['Remediate high-risk issues'],
      'long_term_improvements', ARRAY['Enhance compliance monitoring']
    ),
    'generated_at', NOW(),
    'report_version', '1.0'
  );

  RETURN report_data;
END;
$$ LANGUAGE plpgsql;

-- 2. Automated Compliance Monitoring Check
CREATE OR REPLACE FUNCTION execute_compliance_monitoring_check(
  p_monitoring_id UUID
)
RETURNS JSONB AS $$
DECLARE
  monitoring_info RECORD;
  check_results JSONB;
  compliance_status VARCHAR(20);
  risk_score DECIMAL(5,2);
  findings_count INTEGER;
  violation_detected BOOLEAN := false;
BEGIN
  -- Get monitoring configuration
  SELECT * INTO monitoring_info
  FROM compliance_monitoring
  WHERE id = p_monitoring_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Monitoring configuration not found or inactive');
  END IF;

  -- Simulate compliance check (replace with actual monitoring logic)
  risk_score := random() * 0.3 + 0.1; -- 0.1 to 0.4
  findings_count := CASE 
    WHEN risk_score > 0.3 THEN floor(random() * 3) + 1
    ELSE 0
  END;
  
  violation_detected := findings_count > 0;
  
  compliance_status := CASE
    WHEN risk_score < 0.2 THEN 'compliant'
    WHEN risk_score < 0.3 THEN 'minor_issues'
    ELSE 'non_compliant'
  END;

  -- Update monitoring execution count
  UPDATE compliance_monitoring
  SET 
    execution_count = execution_count + 1,
    last_execution = NOW(),
    next_execution = NOW() + INTERVAL '1 day' * 
      CASE monitoring_frequency
        WHEN 'daily' THEN 1
        WHEN 'weekly' THEN 7
        WHEN 'monthly' THEN 30
        ELSE 1
      END
  WHERE id = p_monitoring_id;

  check_results := jsonb_build_object(
    'monitoring_id', p_monitoring_id,
    'monitoring_name', monitoring_info.monitoring_name,
    'execution_timestamp', NOW(),
    'compliance_status', compliance_status,
    'risk_score', risk_score,
    'violation_detected', violation_detected,
    'findings_count', findings_count,
    'check_details', jsonb_build_object(
      'data_sources_checked', monitoring_info.data_sources,
      'criteria_evaluated', monitoring_info.monitoring_criteria,
      'thresholds_applied', monitoring_info.threshold_settings
    ),
    'recommendations', CASE
      WHEN compliance_status = 'non_compliant' THEN 
        ARRAY['Immediate review required', 'Escalate to compliance team']
      WHEN compliance_status = 'minor_issues' THEN
        ARRAY['Schedule remediation', 'Monitor closely']
      ELSE
        ARRAY['Continue monitoring']
    END
  );

  RETURN check_results;
END;
$$ LANGUAGE plpgsql;

-- 3. Compliance Dashboard Analytics
CREATE OR REPLACE FUNCTION get_compliance_dashboard_analytics(
  p_framework_id UUID,
  p_analysis_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  dashboard_data JSONB;
  total_requirements INTEGER;
  active_monitoring INTEGER;
  recent_violations INTEGER;
  assessment_count INTEGER;
  avg_compliance_score DECIMAL(5,2);
BEGIN
  -- Get total requirements
  SELECT COUNT(*) INTO total_requirements
  FROM compliance_requirements
  WHERE regulatory_framework_id = p_framework_id AND is_active = true;

  -- Get active monitoring
  SELECT COUNT(*) INTO active_monitoring
  FROM compliance_monitoring cm
  JOIN compliance_requirements cr ON cm.compliance_requirement_id = cr.id
  WHERE cr.regulatory_framework_id = p_framework_id AND cm.is_active = true;

  -- Get recent violations
  SELECT COUNT(*) INTO recent_violations
  FROM compliance_violations cv
  JOIN compliance_requirements cr ON cv.compliance_requirement_id = cr.id
  WHERE cr.regulatory_framework_id = p_framework_id
    AND cv.detected_at > NOW() - INTERVAL '1 day' * p_analysis_days;

  -- Get recent assessments
  SELECT COUNT(*) INTO assessment_count
  FROM compliance_assessments
  WHERE regulatory_framework_id = p_framework_id
    AND assessment_start_date > CURRENT_DATE - INTERVAL '1 day' * p_analysis_days;

  -- Calculate average compliance score
  SELECT AVG(overall_compliance_score) INTO avg_compliance_score
  FROM compliance_assessments
  WHERE regulatory_framework_id = p_framework_id
    AND assessment_status = 'completed'
    AND assessment_start_date > CURRENT_DATE - INTERVAL '1 day' * p_analysis_days;

  dashboard_data := jsonb_build_object(
    'framework_id', p_framework_id,
    'analysis_period_days', p_analysis_days,
    'summary_metrics', jsonb_build_object(
      'total_requirements', total_requirements,
      'active_monitoring', active_monitoring,
      'monitoring_coverage', CASE 
        WHEN total_requirements > 0 THEN ROUND((active_monitoring::DECIMAL / total_requirements) * 100, 2)
        ELSE 0
      END,
      'recent_violations', recent_violations,
      'recent_assessments', assessment_count,
      'average_compliance_score', COALESCE(avg_compliance_score, 0)
    ),
    'risk_indicators', jsonb_build_object(
      'high_risk_areas', CASE 
        WHEN recent_violations > 5 THEN ARRAY['access_control', 'data_protection']
        WHEN recent_violations > 2 THEN ARRAY['audit_logging']
        ELSE ARRAY[]::TEXT[]
      END,
      'trending_violations', CASE
        WHEN recent_violations > 10 THEN 'increasing'
        WHEN recent_violations < 3 THEN 'decreasing'
        ELSE 'stable'
      END
    ),
    'recommendations', ARRAY[
      'Schedule quarterly compliance assessment',
      'Review and update monitoring procedures',
      'Enhance staff training programs'
    ],
    'generated_at', NOW()
  );

  RETURN dashboard_data;
END;
$$ LANGUAGE plpgsql;

-- Insert Sample Regulatory Frameworks
INSERT INTO regulatory_frameworks (framework_name, framework_code, framework_type, jurisdiction, regulatory_body, effective_date) VALUES
('General Data Protection Regulation', 'GDPR', 'privacy', 'European Union', 'European Data Protection Board', '2018-05-25'),
('Kenya Data Protection Act', 'KDPA', 'privacy', 'Kenya', 'Office of the Data Protection Commissioner', '2019-11-08'),
('ISO 27001', 'ISO27001', 'security', 'International', 'International Organization for Standardization', '2013-10-01'),
('PCI DSS', 'PCI_DSS', 'financial', 'Global', 'PCI Security Standards Council', '2018-05-01'),
('SOX', 'SOX', 'financial', 'United States', 'Securities and Exchange Commission', '2002-07-30');

-- Insert Sample Compliance Requirements
INSERT INTO compliance_requirements (requirement_code, regulatory_framework_id, requirement_title, requirement_description, requirement_category, compliance_level, risk_level, control_objectives, implementation_guidelines, evidence_requirements, measurement_criteria, effective_date) VALUES
('GDPR.Art6', (SELECT id FROM regulatory_frameworks WHERE framework_code = 'GDPR'), 'Lawfulness of Processing', 'Processing shall be lawful only if at least one of the legal basis applies', 'data_protection', 'mandatory', 'high', '{"lawful_basis": "documented", "consent_management": "implemented"}', '{"consent_forms": "required", "legal_basis_mapping": "documented"}', '{"consent_records": "maintained", "legal_basis_documentation": "available"}', '{"compliance_rate": "100%", "documentation_completeness": "verified"}', '2018-05-25'),
('ISO27001.A12.1.2', (SELECT id FROM regulatory_frameworks WHERE framework_code = 'ISO27001'), 'Change Management', 'Changes to information processing facilities and systems shall be controlled', 'access_control', 'mandatory', 'medium', '{"change_control": "implemented", "approval_process": "documented"}', '{"change_procedures": "defined", "approval_workflow": "established"}', '{"change_logs": "maintained", "approval_records": "kept"}', '{"change_success_rate": "> 95%", "unauthorized_changes": "0"}', '2013-10-01');

-- RLS Policies for Compliance Tables
ALTER TABLE regulatory_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_training ENABLE ROW LEVEL SECURITY;

-- Service role access for compliance operations
CREATE POLICY regulatory_frameworks_service_role ON regulatory_frameworks USING (auth.role() = 'service_role');
CREATE POLICY compliance_requirements_service_role ON compliance_requirements USING (auth.role() = 'service_role');
CREATE POLICY compliance_assessments_service_role ON compliance_assessments USING (auth.role() = 'service_role');
CREATE POLICY compliance_monitoring_service_role ON compliance_monitoring USING (auth.role() = 'service_role');
CREATE POLICY compliance_violations_service_role ON compliance_violations USING (auth.role() = 'service_role');
CREATE POLICY automated_compliance_reports_service_role ON automated_compliance_reports USING (auth.role() = 'service_role');
CREATE POLICY compliance_evidence_service_role ON compliance_evidence USING (auth.role() = 'service_role');
CREATE POLICY compliance_training_service_role ON compliance_training USING (auth.role() = 'service_role');

COMMENT ON TABLE regulatory_frameworks IS 'Regulatory frameworks and compliance standards registry';
COMMENT ON TABLE compliance_requirements IS 'Detailed compliance requirements and control specifications';
COMMENT ON TABLE compliance_assessments IS 'Compliance assessment planning and execution tracking';
COMMENT ON TABLE compliance_monitoring IS 'Continuous compliance monitoring and automated checks';
COMMENT ON TABLE compliance_violations IS 'Compliance violation tracking and incident management';
COMMENT ON TABLE automated_compliance_reports IS 'Automated compliance reporting and regulatory submissions';
COMMENT ON TABLE compliance_evidence IS 'Compliance evidence collection and documentation management';
COMMENT ON TABLE compliance_training IS 'Compliance training programs and awareness initiatives';
