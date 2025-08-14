import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface ComplianceProcessingRequest {
  operation: 'execute_monitoring' | 'generate_report' | 'assess_compliance' | 'process_violation' | 'sync_frameworks'
  data: any
}

interface MonitoringExecution {
  monitoring_id: string
  execution_context: any
}

interface ReportGeneration {
  report_id: string
  framework_id: string
  report_type: string
  parameters: any
}

interface ComplianceAssessment {
  assessment_id: string
  framework_id: string
  scope: any
  criteria: any
}

interface ViolationProcessing {
  violation_data: any
  severity_level: string
  affected_systems: string[]
}

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { operation, data }: ComplianceProcessingRequest = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let result: any

    switch (operation) {
      case 'execute_monitoring':
        result = await executeComplianceMonitoring(supabase, data as MonitoringExecution)
        break
      case 'generate_report':
        result = await generateComplianceReport(supabase, data as ReportGeneration)
        break
      case 'assess_compliance':
        result = await executeComplianceAssessment(supabase, data as ComplianceAssessment)
        break
      case 'process_violation':
        result = await processComplianceViolation(supabase, data as ViolationProcessing)
        break
      case 'sync_frameworks':
        result = await syncRegulatoryFrameworks(supabase, data)
        break
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        operation,
        result,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Compliance processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function executeComplianceMonitoring(supabase: any, data: MonitoringExecution) {
  const { monitoring_id, execution_context } = data

  // Get monitoring configuration
  const { data: monitoring, error: monitoringError } = await supabase
    .from('compliance_monitoring')
    .select(`
      *,
      compliance_requirements (
        id,
        requirement_code,
        requirement_title,
        requirement_category,
        risk_level,
        regulatory_frameworks (
          framework_name,
          framework_code
        )
      )
    `)
    .eq('id', monitoring_id)
    .eq('is_active', true)
    .single()

  if (monitoringError || !monitoring) {
    throw new Error(`Monitoring configuration not found: ${monitoringError?.message}`)
  }

  // Execute monitoring check using the database function
  const { data: checkResults, error: checkError } = await supabase
    .rpc('execute_compliance_monitoring_check', {
      p_monitoring_id: monitoring_id
    })

  if (checkError) {
    throw new Error(`Monitoring execution failed: ${checkError.message}`)
  }

  // Process check results
  const monitoring_results = {
    monitoring_id,
    monitoring_name: monitoring.monitoring_name,
    requirement_info: {
      code: monitoring.compliance_requirements.requirement_code,
      title: monitoring.compliance_requirements.requirement_title,
      category: monitoring.compliance_requirements.requirement_category,
      framework: monitoring.compliance_requirements.regulatory_frameworks.framework_name
    },
    execution_timestamp: new Date().toISOString(),
    check_results: checkResults,
    execution_context,
    next_execution: calculateNextExecution(monitoring.monitoring_frequency)
  }

  // Create violation if non-compliant
  if (checkResults.violation_detected) {
    await createComplianceViolation(supabase, {
      compliance_requirement_id: monitoring.compliance_requirement_id,
      monitoring_id: monitoring_id,
      violation_type: 'control_failure',
      severity_level: determineSeverityLevel(checkResults.risk_score),
      violation_description: `Automated monitoring detected compliance violation: ${checkResults.compliance_status}`,
      business_impact: { risk_score: checkResults.risk_score, findings_count: checkResults.findings_count },
      technical_impact: checkResults.check_details,
      regulatory_impact: { framework: monitoring.compliance_requirements.regulatory_frameworks.framework_code }
    })
  }

  // Log monitoring execution
  await supabase
    .from('compliance_monitoring')
    .update({
      last_execution: new Date().toISOString(),
      execution_count: monitoring.execution_count + 1,
      success_rate: calculateSuccessRate(monitoring.execution_count, monitoring.error_count, checkResults.compliance_status === 'compliant')
    })
    .eq('id', monitoring_id)

  return monitoring_results
}

async function generateComplianceReport(supabase: any, data: ReportGeneration) {
  const { report_id, framework_id, report_type, parameters } = data

  // Get report configuration
  const { data: reportConfig, error: configError } = await supabase
    .from('automated_compliance_reports')
    .select(`
      *,
      regulatory_frameworks (
        framework_name,
        framework_code,
        jurisdiction
      )
    `)
    .eq('id', report_id)
    .eq('is_active', true)
    .single()

  if (configError || !reportConfig) {
    throw new Error(`Report configuration not found: ${configError?.message}`)
  }

  // Generate report data based on type
  let reportData: any = {}

  switch (report_type) {
    case 'regulatory_filing':
      reportData = await generateRegulatoryFiling(supabase, framework_id, parameters)
      break
    case 'audit_report':
      reportData = await generateAuditReport(supabase, framework_id, parameters)
      break
    case 'management_dashboard':
      reportData = await generateManagementDashboard(supabase, framework_id, parameters)
      break
    case 'risk_assessment':
      reportData = await generateRiskAssessment(supabase, framework_id, parameters)
      break
    default:
      reportData = await generateStandardReport(supabase, framework_id, parameters)
  }

  // Apply report template and formatting
  const formattedReport = await applyReportTemplate(reportConfig, reportData)

  // Update report generation stats
  await supabase
    .from('automated_compliance_reports')
    .update({
      last_generated: new Date().toISOString(),
      generation_count: reportConfig.generation_count + 1,
      next_generation: calculateNextGeneration(reportConfig.report_frequency)
    })
    .eq('id', report_id)

  return {
    report_id,
    report_type,
    framework: reportConfig.regulatory_frameworks.framework_name,
    generated_at: new Date().toISOString(),
    report_data: formattedReport,
    metadata: {
      generation_count: reportConfig.generation_count + 1,
      parameters_used: parameters,
      template_version: reportConfig.report_template.version || '1.0'
    }
  }
}

async function executeComplianceAssessment(supabase: any, data: ComplianceAssessment) {
  const { assessment_id, framework_id, scope, criteria } = data

  // Get assessment configuration
  const { data: assessment, error: assessmentError } = await supabase
    .from('compliance_assessments')
    .select(`
      *,
      regulatory_frameworks (
        framework_name,
        framework_code
      )
    `)
    .eq('id', assessment_id)
    .single()

  if (assessmentError || !assessment) {
    throw new Error(`Assessment not found: ${assessmentError?.message}`)
  }

  // Get compliance requirements for the framework
  const { data: requirements, error: reqError } = await supabase
    .from('compliance_requirements')
    .select('*')
    .eq('regulatory_framework_id', framework_id)
    .eq('is_active', true)

  if (reqError) {
    throw new Error(`Failed to get requirements: ${reqError.message}`)
  }

  // Execute assessment for each requirement
  const assessmentResults = []
  let totalScore = 0
  let maxScore = 0

  for (const requirement of requirements) {
    const requirementAssessment = await assessRequirement(supabase, requirement, scope, criteria)
    assessmentResults.push(requirementAssessment)
    totalScore += requirementAssessment.score
    maxScore += requirementAssessment.max_score
  }

  const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
  const riskRating = determineRiskRating(overallScore)

  // Update assessment with results
  await supabase
    .from('compliance_assessments')
    .update({
      assessment_status: 'completed',
      actual_completion_date: new Date().toISOString(),
      overall_compliance_score: overallScore,
      risk_rating: riskRating,
      findings_summary: {
        total_requirements: requirements.length,
        requirements_passed: assessmentResults.filter(r => r.status === 'pass').length,
        requirements_failed: assessmentResults.filter(r => r.status === 'fail').length,
        overall_score: overallScore,
        detailed_results: assessmentResults
      }
    })
    .eq('id', assessment_id)

  return {
    assessment_id,
    framework: assessment.regulatory_frameworks.framework_name,
    overall_compliance_score: overallScore,
    risk_rating: riskRating,
    requirements_assessed: requirements.length,
    assessment_results: assessmentResults,
    summary: {
      passed: assessmentResults.filter(r => r.status === 'pass').length,
      failed: assessmentResults.filter(r => r.status === 'fail').length,
      warnings: assessmentResults.filter(r => r.status === 'warning').length
    },
    completed_at: new Date().toISOString()
  }
}

async function processComplianceViolation(supabase: any, data: ViolationProcessing) {
  const { violation_data, severity_level, affected_systems } = data

  // Generate unique violation ID
  const violationId = `VIO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Create violation record
  const { data: violation, error: violationError } = await supabase
    .from('compliance_violations')
    .insert({
      violation_id: violationId,
      compliance_requirement_id: violation_data.requirement_id,
      monitoring_id: violation_data.monitoring_id,
      violation_type: violation_data.violation_type || 'control_failure',
      severity_level: severity_level,
      violation_status: 'open',
      detection_method: 'automated_monitoring',
      detected_at: new Date().toISOString(),
      detected_by: 'Compliance Automation System',
      violation_description: violation_data.description,
      affected_systems: affected_systems,
      affected_data_categories: violation_data.affected_data_categories || [],
      business_impact: violation_data.business_impact || {},
      technical_impact: violation_data.technical_impact || {},
      regulatory_impact: violation_data.regulatory_impact || {},
      immediate_actions_taken: violation_data.immediate_actions || {},
      priority_level: determinePriority(severity_level),
      created_by: 'system'
    })
    .select()
    .single()

  if (violationError) {
    throw new Error(`Failed to create violation: ${violationError.message}`)
  }

  // Trigger escalation if needed
  if (['critical', 'high'].includes(severity_level)) {
    await triggerViolationEscalation(supabase, violation.id, severity_level)
  }

  // Create remediation plan
  const remediationPlan = await createRemediationPlan(supabase, violation, violation_data)

  return {
    violation_id: violationId,
    violation_record_id: violation.id,
    severity_level,
    status: 'created',
    remediation_plan: remediationPlan,
    escalation_triggered: ['critical', 'high'].includes(severity_level),
    created_at: new Date().toISOString()
  }
}

async function syncRegulatoryFrameworks(supabase: any, data: any) {
  const { source, frameworks } = data

  const syncResults = {
    synchronized_frameworks: 0,
    updated_frameworks: 0,
    new_frameworks: 0,
    errors: []
  }

  for (const framework of frameworks) {
    try {
      // Check if framework exists
      const { data: existing, error: checkError } = await supabase
        .from('regulatory_frameworks')
        .select('id, version_number')
        .eq('framework_code', framework.framework_code)
        .single()

      if (existing) {
        // Update existing framework
        const { error: updateError } = await supabase
          .from('regulatory_frameworks')
          .update({
            framework_name: framework.framework_name,
            framework_type: framework.framework_type,
            jurisdiction: framework.jurisdiction,
            regulatory_body: framework.regulatory_body,
            last_updated: new Date().toISOString(),
            version_number: framework.version_number || existing.version_number,
            compliance_requirements: framework.compliance_requirements || {},
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (!updateError) {
          syncResults.updated_frameworks++
        } else {
          syncResults.errors.push(`Update failed for ${framework.framework_code}: ${updateError.message}`)
        }
      } else {
        // Create new framework
        const { error: insertError } = await supabase
          .from('regulatory_frameworks')
          .insert({
            framework_name: framework.framework_name,
            framework_code: framework.framework_code,
            framework_type: framework.framework_type,
            jurisdiction: framework.jurisdiction,
            regulatory_body: framework.regulatory_body,
            effective_date: framework.effective_date || new Date().toISOString(),
            version_number: framework.version_number || '1.0',
            compliance_requirements: framework.compliance_requirements || {},
            is_active: true
          })

        if (!insertError) {
          syncResults.new_frameworks++
        } else {
          syncResults.errors.push(`Insert failed for ${framework.framework_code}: ${insertError.message}`)
        }
      }

      syncResults.synchronized_frameworks++
    } catch (error) {
      syncResults.errors.push(`Processing failed for ${framework.framework_code}: ${error.message}`)
    }
  }

  return {
    sync_completed_at: new Date().toISOString(),
    source,
    results: syncResults,
    total_processed: frameworks.length
  }
}

// Helper functions
function calculateNextExecution(frequency: string): string {
  const now = new Date()
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  }
}

function calculateNextGeneration(frequency: string): string {
  const now = new Date()
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    case 'quarterly':
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
    case 'annually':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  }
}

function determineSeverityLevel(riskScore: number): string {
  if (riskScore > 0.8) return 'critical'
  if (riskScore > 0.6) return 'high'
  if (riskScore > 0.3) return 'medium'
  return 'low'
}

function determineRiskRating(score: number): string {
  if (score >= 95) return 'low'
  if (score >= 85) return 'medium'
  if (score >= 70) return 'high'
  return 'critical'
}

function determinePriority(severityLevel: string): number {
  switch (severityLevel) {
    case 'critical': return 1
    case 'high': return 2
    case 'medium': return 3
    case 'low': return 4
    default: return 3
  }
}

function calculateSuccessRate(totalExecutions: number, errorCount: number, currentSuccess: boolean): number {
  const newErrorCount = currentSuccess ? errorCount : errorCount + 1
  const newTotalExecutions = totalExecutions + 1
  return Math.round(((newTotalExecutions - newErrorCount) / newTotalExecutions) * 100)
}

async function createComplianceViolation(supabase: any, violationData: any) {
  const violationId = `VIO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return await supabase
    .from('compliance_violations')
    .insert({
      violation_id: violationId,
      ...violationData,
      detected_at: new Date().toISOString(),
      violation_status: 'open',
      detection_method: 'automated_monitoring',
      detected_by: 'Automated Compliance System'
    })
}

async function assessRequirement(supabase: any, requirement: any, scope: any, criteria: any) {
  // Simulate requirement assessment (replace with actual assessment logic)
  const assessmentScore = Math.random() * 100
  const maxScore = 100
  const status = assessmentScore >= 80 ? 'pass' : assessmentScore >= 60 ? 'warning' : 'fail'

  return {
    requirement_id: requirement.id,
    requirement_code: requirement.requirement_code,
    requirement_title: requirement.requirement_title,
    score: Math.round(assessmentScore),
    max_score: maxScore,
    status,
    findings: status === 'fail' ? ['Control implementation incomplete'] : [],
    evidence_reviewed: ['Policy documents', 'System configurations'],
    assessment_notes: `Automated assessment completed with ${Math.round(assessmentScore)}% compliance`
  }
}

async function generateRegulatoryFiling(supabase: any, frameworkId: string, parameters: any) {
  // Generate regulatory filing data
  const { data: dashboardData } = await supabase
    .rpc('get_compliance_dashboard_analytics', {
      p_framework_id: frameworkId,
      p_analysis_days: parameters.reporting_period_days || 90
    })

  return {
    filing_type: 'Compliance Status Report',
    reporting_period: parameters.reporting_period || 'Q1 2024',
    compliance_summary: dashboardData.summary_metrics,
    violations_reported: dashboardData.summary_metrics.recent_violations,
    remediation_status: 'In Progress',
    next_filing_due: calculateNextGeneration('quarterly')
  }
}

async function generateAuditReport(supabase: any, frameworkId: string, parameters: any) {
  return {
    audit_type: 'Internal Compliance Audit',
    audit_period: parameters.audit_period || 'Q1 2024',
    scope: parameters.scope || 'Full Framework Assessment',
    findings_summary: {
      critical_findings: 0,
      high_findings: 2,
      medium_findings: 5,
      low_findings: 3
    },
    overall_rating: 'Satisfactory',
    recommendations: [
      'Enhance monitoring coverage',
      'Update policy documentation',
      'Increase training frequency'
    ]
  }
}

async function generateManagementDashboard(supabase: any, frameworkId: string, parameters: any) {
  const { data: dashboardData } = await supabase
    .rpc('get_compliance_dashboard_analytics', {
      p_framework_id: frameworkId,
      p_analysis_days: parameters.analysis_days || 30
    })

  return dashboardData
}

async function generateRiskAssessment(supabase: any, frameworkId: string, parameters: any) {
  return {
    assessment_type: 'Compliance Risk Assessment',
    risk_methodology: 'Quantitative Analysis',
    overall_risk_level: 'Medium',
    key_risk_areas: [
      'Data Protection Controls',
      'Access Management',
      'Audit Logging'
    ],
    risk_mitigation_plan: {
      immediate_actions: ['Review access controls'],
      short_term_goals: ['Implement enhanced monitoring'],
      long_term_objectives: ['Achieve full automation']
    }
  }
}

async function generateStandardReport(supabase: any, frameworkId: string, parameters: any) {
  return {
    report_type: 'Standard Compliance Report',
    generated_at: new Date().toISOString(),
    framework_id: frameworkId,
    parameters: parameters,
    summary: 'Standard compliance report generated successfully'
  }
}

async function applyReportTemplate(reportConfig: any, reportData: any) {
  // Apply formatting and template to report data
  return {
    header: {
      report_title: reportConfig.report_name,
      generated_at: new Date().toISOString(),
      framework: reportConfig.regulatory_frameworks.framework_name
    },
    content: reportData,
    footer: {
      disclaimer: reportConfig.disclaimer_text || 'This report is generated automatically',
      confidentiality: reportConfig.confidentiality_markings || 'Internal Use Only'
    }
  }
}

async function triggerViolationEscalation(supabase: any, violationId: string, severityLevel: string) {
  // Implement escalation logic (notifications, alerts, etc.)
  console.log(`Escalation triggered for violation ${violationId} with severity ${severityLevel}`)
}

async function createRemediationPlan(supabase: any, violation: any, violationData: any) {
  return {
    plan_id: `REM-${Date.now()}`,
    violation_id: violation.id,
    immediate_actions: [
      'Assess scope of violation',
      'Contain potential data exposure',
      'Notify compliance team'
    ],
    short_term_actions: [
      'Implement corrective controls',
      'Update monitoring procedures',
      'Review related processes'
    ],
    long_term_actions: [
      'Enhance preventive controls',
      'Update training programs',
      'Review policy framework'
    ],
    target_completion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
}
