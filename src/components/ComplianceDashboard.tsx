import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  BarChart3, 
  Settings,
  Download,
  RefreshCw,
  Calendar,
  Users,
  Database,
  Lock,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  BookOpen,
  Scale,
  FileCheck,
  AlertCircle,
  Activity,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';

interface RegulatoryFramework {
  id: string;
  framework_name: string;
  framework_code: string;
  framework_type: string;
  jurisdiction: string;
  regulatory_body: string;
  is_active: boolean;
  effective_date: string;
  compliance_requirements_count?: number;
}

interface ComplianceRequirement {
  id: string;
  requirement_code: string;
  requirement_title: string;
  requirement_category: string;
  compliance_level: string;
  risk_level: string;
  effective_date: string;
  is_active: boolean;
}

interface ComplianceAssessment {
  id: string;
  assessment_name: string;
  assessment_type: string;
  assessment_status: string;
  overall_compliance_score: number;
  risk_rating: string;
  assessment_start_date: string;
  assessment_end_date?: string;
}

interface ComplianceViolation {
  id: string;
  violation_id: string;
  violation_type: string;
  severity_level: string;
  violation_status: string;
  detected_at: string;
  violation_description: string;
  affected_systems: string[];
}

interface DashboardMetrics {
  total_frameworks: number;
  active_requirements: number;
  recent_violations: number;
  completed_assessments: number;
  overall_compliance_score: number;
  risk_level: string;
  monitoring_coverage: number;
  training_completion: number;
}

const ComplianceDashboard: React.FC = () => {
  const [frameworks, setFrameworks] = useState<RegulatoryFramework[]>([]);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [assessments, setAssessments] = useState<ComplianceAssessment[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [processingCompliance, setProcessingCompliance] = useState(false);
  const [monitoringResults, setMonitoringResults] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      // Load regulatory frameworks
      const { data: frameworksData, error: frameworksError } = await supabase
        .from('regulatory_frameworks')
        .select('*')
        .eq('is_active', true)
        .order('framework_name');

      if (frameworksError) throw frameworksError;
      setFrameworks(frameworksData || []);

      // Load requirements for selected framework or all
      let requirementsQuery = supabase
        .from('compliance_requirements')
        .select('*')
        .eq('is_active', true);

      if (selectedFramework) {
        requirementsQuery = requirementsQuery.eq('regulatory_framework_id', selectedFramework);
      }

      const { data: requirementsData, error: requirementsError } = await requirementsQuery
        .order('requirement_code');

      if (requirementsError) throw requirementsError;
      setRequirements(requirementsData || []);

      // Load recent assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('compliance_assessments')
        .select('*')
        .order('assessment_start_date', { ascending: false })
        .limit(10);

      if (assessmentsError) throw assessmentsError;
      setAssessments(assessmentsData || []);

      // Load recent violations
      const { data: violationsData, error: violationsError } = await supabase
        .from('compliance_violations')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(20);

      if (violationsError) throw violationsError;
      setViolations(violationsData || []);

      // Calculate dashboard metrics
      await loadDashboardMetrics();

    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load compliance dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardMetrics = async () => {
    try {
      const frameworkId = selectedFramework || frameworks[0]?.id;
      if (!frameworkId) return;

      const { data: dashboardData, error } = await supabase
        .rpc('get_compliance_dashboard_analytics', {
          p_framework_id: frameworkId,
          p_analysis_days: 30
        });

      if (error) throw error;

      const calculatedMetrics: DashboardMetrics = {
        total_frameworks: frameworks.length,
        active_requirements: requirements.length,
        recent_violations: violations.filter(v => v.violation_status === 'open').length,
        completed_assessments: assessments.filter(a => a.assessment_status === 'completed').length,
        overall_compliance_score: dashboardData?.summary_metrics?.average_compliance_score || 0,
        risk_level: dashboardData?.risk_indicators?.overall_risk_level || 'unknown',
        monitoring_coverage: dashboardData?.summary_metrics?.monitoring_coverage || 0,
        training_completion: 85 // Mock data
      };

      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  const executeComplianceMonitoring = async (monitoringType: string) => {
    try {
      setProcessingCompliance(true);
      
      const { data, error } = await supabase.functions.invoke('compliance-automation-processing', {
        body: {
          operation: 'execute_monitoring',
          data: {
            monitoring_id: selectedFramework || 'default',
            execution_context: {
              monitoring_type: monitoringType,
              triggered_by: 'manual',
              timestamp: new Date().toISOString()
            }
          }
        }
      });

      if (error) throw error;

      setMonitoringResults(data.result);
      toast({
        title: "Monitoring Executed",
        description: `${monitoringType} monitoring completed successfully.`,
      });

      // Reload data to reflect changes
      await loadComplianceData();

    } catch (error) {
      console.error('Error executing compliance monitoring:', error);
      toast({
        title: "Monitoring Failed",
        description: "Failed to execute compliance monitoring. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingCompliance(false);
    }
  };

  const generateComplianceReport = async (reportType: string) => {
    try {
      setProcessingCompliance(true);

      const { data, error } = await supabase.functions.invoke('compliance-automation-processing', {
        body: {
          operation: 'generate_report',
          data: {
            report_id: 'manual-generation',
            framework_id: selectedFramework || frameworks[0]?.id,
            report_type: reportType,
            parameters: {
              reporting_period_days: 90,
              include_details: true,
              format: 'json'
            }
          }
        }
      });

      if (error) throw error;

      // Handle report download or display
      toast({
        title: "Report Generated",
        description: `${reportType} report has been generated successfully.`,
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate compliance report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingCompliance(false);
    }
  };

  const executeComplianceAssessment = async () => {
    try {
      setProcessingCompliance(true);

      const { data, error } = await supabase.functions.invoke('compliance-automation-processing', {
        body: {
          operation: 'assess_compliance',
          data: {
            assessment_id: 'manual-assessment',
            framework_id: selectedFramework || frameworks[0]?.id,
            scope: {
              assessment_type: 'comprehensive',
              include_all_requirements: true
            },
            criteria: {
              assessment_methodology: 'automated',
              minimum_score: 80
            }
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Assessment Completed",
        description: `Compliance assessment completed with score: ${data.result.overall_compliance_score}%`,
      });

      await loadComplianceData();

    } catch (error) {
      console.error('Error executing assessment:', error);
      toast({
        title: "Assessment Failed",
        description: "Failed to execute compliance assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingCompliance(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading compliance dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Compliance Automation Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Advanced regulatory compliance monitoring and automation
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedFramework} onValueChange={setSelectedFramework}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select Regulatory Framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Frameworks</SelectItem>
              {frameworks.map((framework) => (
                <SelectItem key={framework.id} value={framework.id}>
                  {framework.framework_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => loadComplianceData()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overall_compliance_score}%</div>
              <Progress value={metrics.overall_compliance_score} className="mt-2" />
              <p className="text-xs text-gray-600 mt-2">
                Risk Level: <span className={getRiskColor(metrics.risk_level)}>{metrics.risk_level}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Requirements</CardTitle>
              <FileCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active_requirements}</div>
              <p className="text-xs text-gray-600 mt-2">
                Across {metrics.total_frameworks} frameworks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Violations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.recent_violations}</div>
              <p className="text-xs text-gray-600 mt-2">
                Requiring immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitoring Coverage</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.monitoring_coverage}%</div>
              <Progress value={metrics.monitoring_coverage} className="mt-2" />
              <p className="text-xs text-gray-600 mt-2">
                Automated monitoring active
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Compliance Activity</CardTitle>
                <CardDescription>Latest assessments and violations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {assessments.slice(0, 3).map((assessment) => (
                    <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{assessment.assessment_name}</p>
                        <p className="text-sm text-gray-600">
                          {assessment.assessment_type} • {assessment.assessment_start_date}
                        </p>
                      </div>
                      <Badge variant={assessment.assessment_status === 'completed' ? 'default' : 'secondary'}>
                        {assessment.assessment_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment Summary</CardTitle>
                <CardDescription>Current compliance risk levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Data Protection</span>
                    <Badge className="bg-green-500">Low Risk</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Access Control</span>
                    <Badge className="bg-yellow-500">Medium Risk</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Audit Logging</span>
                    <Badge className="bg-green-500">Low Risk</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Incident Response</span>
                    <Badge className="bg-orange-500">High Risk</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monitoring Results */}
          {monitoringResults && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Monitoring Results</CardTitle>
                <CardDescription>Automated compliance monitoring execution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {monitoringResults.check_results?.compliance_status || 'Unknown'}
                    </div>
                    <p className="text-sm text-gray-600">Compliance Status</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {Math.round((monitoringResults.check_results?.risk_score || 0) * 100)}%
                    </div>
                    <p className="text-sm text-gray-600">Risk Score</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {monitoringResults.check_results?.findings_count || 0}
                    </div>
                    <p className="text-sm text-gray-600">Findings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Frameworks</CardTitle>
              <CardDescription>Manage compliance frameworks and standards</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Framework</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {frameworks.map((framework) => (
                    <TableRow key={framework.id}>
                      <TableCell className="font-medium">{framework.framework_name}</TableCell>
                      <TableCell>{framework.framework_code}</TableCell>
                      <TableCell>{framework.framework_type}</TableCell>
                      <TableCell>{framework.jurisdiction}</TableCell>
                      <TableCell>
                        <Badge variant={framework.is_active ? 'default' : 'secondary'}>
                          {framework.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Requirements</CardTitle>
              <CardDescription>Detailed compliance requirements and controls</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map((requirement) => (
                    <TableRow key={requirement.id}>
                      <TableCell className="font-mono">{requirement.requirement_code}</TableCell>
                      <TableCell>{requirement.requirement_title}</TableCell>
                      <TableCell>{requirement.requirement_category}</TableCell>
                      <TableCell>
                        <Badge variant={requirement.compliance_level === 'mandatory' ? 'default' : 'secondary'}>
                          {requirement.compliance_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(requirement.risk_level)}>
                          {requirement.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={requirement.is_active ? 'default' : 'secondary'}>
                          {requirement.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Compliance Assessments</h3>
              <p className="text-sm text-gray-600">Manage and execute compliance assessments</p>
            </div>
            <Button onClick={executeComplianceAssessment} disabled={processingCompliance}>
              {processingCompliance ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileCheck className="h-4 w-4 mr-2" />
              )}
              Run Assessment
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">{assessment.assessment_name}</TableCell>
                      <TableCell>{assessment.assessment_type}</TableCell>
                      <TableCell>
                        <Badge variant={assessment.assessment_status === 'completed' ? 'default' : 'secondary'}>
                          {assessment.assessment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assessment.overall_compliance_score ? 
                          `${assessment.overall_compliance_score}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {assessment.risk_rating && (
                          <Badge className={getSeverityColor(assessment.risk_rating)}>
                            {assessment.risk_rating}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{assessment.assessment_start_date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Violations</CardTitle>
              <CardDescription>Track and manage compliance violations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.map((violation) => (
                    <TableRow key={violation.id}>
                      <TableCell className="font-mono">{violation.violation_id}</TableCell>
                      <TableCell>{violation.violation_type}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(violation.severity_level)}>
                          {violation.severity_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={violation.violation_status === 'open' ? 'destructive' : 'default'}>
                          {violation.violation_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(violation.detected_at).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {violation.violation_description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Automated Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Monitoring
                </CardTitle>
                <CardDescription>Execute automated compliance monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => executeComplianceMonitoring('full_scan')}
                  disabled={processingCompliance}
                  className="w-full"
                >
                  {processingCompliance ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Full Compliance Scan
                </Button>
                <Button 
                  onClick={() => executeComplianceMonitoring('quick_check')}
                  disabled={processingCompliance}
                  variant="outline"
                  className="w-full"
                >
                  Quick Compliance Check
                </Button>
              </CardContent>
            </Card>

            {/* Report Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Reports
                </CardTitle>
                <CardDescription>Generate automated compliance reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => generateComplianceReport('regulatory_filing')}
                  disabled={processingCompliance}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Regulatory Filing
                </Button>
                <Button 
                  onClick={() => generateComplianceReport('audit_report')}
                  disabled={processingCompliance}
                  variant="outline"
                  className="w-full"
                >
                  Audit Report
                </Button>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration
                </CardTitle>
                <CardDescription>Configure automation settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule Monitoring
                </Button>
                <Button variant="outline" className="w-full">
                  <Scale className="h-4 w-4 mr-2" />
                  Update Frameworks
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Automation Status */}
          <Card>
            <CardHeader>
              <CardTitle>Automation Status</CardTitle>
              <CardDescription>Current status of automated compliance processes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <p className="text-sm">Monitoring Active</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <p className="text-sm">Reports Scheduled</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">~</div>
                  <p className="text-sm">Assessments Running</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <p className="text-sm">Alerts Configured</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceDashboard;
