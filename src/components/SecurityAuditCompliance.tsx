import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  Clock, 
  Download, 
  Eye, 
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  FileText,
  Lock,
  UserCheck,
  Activity
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuditEvent {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id?: string;
  user_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  compliance_status: 'compliant' | 'non_compliant' | 'pending_review';
}

interface ComplianceReport {
  id: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'incident_based' | 'regulatory';
  period_start: string;
  period_end: string;
  status: 'generating' | 'completed' | 'failed';
  findings: {
    total_events: number;
    compliance_violations: number;
    security_incidents: number;
    access_anomalies: number;
    data_integrity_issues: number;
  };
  recommendations: string[];
  created_at: string;
  generated_by: string;
}

interface ComplianceMetrics {
  overall_score: number;
  security_posture: 'excellent' | 'good' | 'fair' | 'poor';
  risk_assessment: 'low' | 'medium' | 'high' | 'critical';
  recent_violations: number;
  pending_reviews: number;
  last_audit_date: string;
}

interface SecurityAuditComplianceProps {
  className?: string;
  onComplianceAlert?: (alert: any) => void;
}

export function SecurityAuditCompliance({ 
  className = "", 
  onComplianceAlert 
}: SecurityAuditComplianceProps) {
  const { toast } = useToast();
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h');
  const [filterType, setFilterType] = useState<'all' | 'violations' | 'incidents' | 'access'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load audit events
  const loadAuditEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range
      const now = new Date();
      const ranges = {
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      };

      const startDate = ranges[selectedTimeRange];

      // Get audit events from audit_logs table
      const { data: rawEvents, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        throw error;
      }

      // Process and enrich audit events
      const processedEvents: AuditEvent[] = (rawEvents || []).map(event => ({
        id: event.id,
        event_type: event.event_type,
        entity_type: event.entity_type || '',
        entity_id: event.entity_id || '',
        user_id: event.user_id || '',
        details: (typeof event.details === 'object' && event.details !== null) ? event.details as Record<string, any> : {},
        ip_address: event.ip_address ? String(event.ip_address) : '',
        user_agent: event.user_agent || '',
        created_at: event.created_at || '',
        risk_level: assessRiskLevel(event),
        compliance_status: assessComplianceStatus(event)
      }));

      // Apply filters
      let filteredEvents = processedEvents;
      
      if (filterType !== 'all') {
        filteredEvents = filteredEvents.filter(event => {
          switch (filterType) {
            case 'violations':
              return event.compliance_status === 'non_compliant';
            case 'incidents':
              return event.event_type.includes('incident') || event.risk_level === 'critical';
            case 'access':
              return event.event_type.includes('access') || event.event_type.includes('auth');
            default:
              return true;
          }
        });
      }

      if (searchQuery) {
        filteredEvents = filteredEvents.filter(event =>
          event.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.entity_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          JSON.stringify(event.details).toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setAuditEvents(filteredEvents);

      // Calculate compliance metrics
      const metrics = calculateComplianceMetrics(processedEvents);
      setComplianceMetrics(metrics);

      // Check for critical compliance issues
      const criticalIssues = filteredEvents.filter(event => 
        event.risk_level === 'critical' || event.compliance_status === 'non_compliant'
      );
      
      if (criticalIssues.length > 0 && onComplianceAlert) {
        onComplianceAlert({
          type: 'compliance_violation',
          count: criticalIssues.length,
          events: criticalIssues.slice(0, 5)
        });
      }

    } catch (error) {
      console.error('Error loading audit events:', error);
      toast({
        title: "Error",
        description: "Failed to load audit events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange, filterType, searchQuery, toast, onComplianceAlert]);

  // Assess risk level based on event characteristics
  const assessRiskLevel = (event: any): 'low' | 'medium' | 'high' | 'critical' => {
    const { event_type, details } = event;

    // Critical risk events
    if (
      event_type.includes('incident_report') ||
      event_type.includes('security_breach') ||
      event_type.includes('unauthorized_access') ||
      event_type.includes('data_leak')
    ) {
      return 'critical';
    }

    // High risk events
    if (
      event_type.includes('failed_auth') ||
      event_type.includes('suspicious_activity') ||
      event_type.includes('multiple_attempts') ||
      (details?.severity && ['high', 'critical'].includes(details.severity))
    ) {
      return 'high';
    }

    // Medium risk events
    if (
      event_type.includes('access_granted') ||
      event_type.includes('permission_change') ||
      event_type.includes('data_access') ||
      (details?.severity && details.severity === 'medium')
    ) {
      return 'medium';
    }

    return 'low';
  };

  // Assess compliance status based on event and regulatory requirements
  const assessComplianceStatus = (event: any): 'compliant' | 'non_compliant' | 'pending_review' => {
    const { event_type, details, created_at } = event;

    // Non-compliant events (immediate violations)
    if (
      event_type.includes('unauthorized') ||
      event_type.includes('breach') ||
      event_type.includes('violation') ||
      (details?.type === 'security' && details?.severity === 'critical')
    ) {
      return 'non_compliant';
    }

    // Pending review events (require manual assessment)
    if (
      event_type.includes('incident_report') ||
      event_type.includes('anomaly') ||
      event_type.includes('suspicious') ||
      (details?.severity && ['high', 'critical'].includes(details.severity))
    ) {
      return 'pending_review';
    }

    return 'compliant';
  };

  // Calculate overall compliance metrics
  const calculateComplianceMetrics = (events: AuditEvent[]): ComplianceMetrics => {
    const totalEvents = events.length;
    const violations = events.filter(e => e.compliance_status === 'non_compliant').length;
    const pendingReviews = events.filter(e => e.compliance_status === 'pending_review').length;
    const criticalEvents = events.filter(e => e.risk_level === 'critical').length;

    const complianceRate = totalEvents > 0 ? ((totalEvents - violations) / totalEvents) * 100 : 100;
    
    let securityPosture: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    if (complianceRate < 95) securityPosture = 'good';
    if (complianceRate < 85) securityPosture = 'fair';
    if (complianceRate < 75) securityPosture = 'poor';

    let riskAssessment: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalEvents > 0) riskAssessment = 'critical';
    else if (violations > 5) riskAssessment = 'high';
    else if (violations > 2) riskAssessment = 'medium';

    return {
      overall_score: Math.round(complianceRate),
      security_posture: securityPosture,
      risk_assessment: riskAssessment,
      recent_violations: violations,
      pending_reviews: pendingReviews,
      last_audit_date: new Date().toISOString()
    };
  };

  // Generate compliance report
  const generateComplianceReport = async (reportType: ComplianceReport['report_type']) => {
    try {
      setIsLoading(true);
      
      const now = new Date();
      let startDate: Date;
      
      switch (reportType) {
        case 'daily':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Analyze events for the report period
      const reportEvents = auditEvents.filter(event => 
        new Date(event.created_at) >= startDate
      );

      const findings = {
        total_events: reportEvents.length,
        compliance_violations: reportEvents.filter(e => e.compliance_status === 'non_compliant').length,
        security_incidents: reportEvents.filter(e => e.event_type.includes('incident')).length,
        access_anomalies: reportEvents.filter(e => e.event_type.includes('access') && e.risk_level === 'high').length,
        data_integrity_issues: reportEvents.filter(e => e.event_type.includes('data') && e.risk_level !== 'low').length
      };

      const recommendations = generateRecommendations(findings, reportEvents);

      const newReport: ComplianceReport = {
        id: crypto.randomUUID(),
        report_type: reportType,
        period_start: startDate.toISOString(),
        period_end: now.toISOString(),
        status: 'completed',
        findings,
        recommendations,
        created_at: now.toISOString(),
        generated_by: 'system'
      };

      setComplianceReports(prev => [newReport, ...prev.slice(0, 9)]);

      toast({
        title: "Compliance Report Generated",
        description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} compliance report has been generated successfully.`,
      });

    } catch (error) {
      console.error('Error generating compliance report:', error);
      toast({
        title: "Error",
        description: "Failed to generate compliance report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate recommendations based on findings
  const generateRecommendations = (findings: ComplianceReport['findings'], events: AuditEvent[]): string[] => {
    const recommendations: string[] = [];

    if (findings.compliance_violations > 0) {
      recommendations.push(`Address ${findings.compliance_violations} compliance violations identified in the audit trail`);
    }

    if (findings.security_incidents > 3) {
      recommendations.push("Implement additional security monitoring due to elevated incident frequency");
    }

    if (findings.access_anomalies > 5) {
      recommendations.push("Review access control policies and implement stricter verification procedures");
    }

    const criticalEvents = events.filter(e => e.risk_level === 'critical');
    if (criticalEvents.length > 0) {
      recommendations.push("Immediate investigation required for critical security events");
    }

    const pendingReviews = events.filter(e => e.compliance_status === 'pending_review');
    if (pendingReviews.length > 10) {
      recommendations.push("Prioritize manual review of pending compliance assessments");
    }

    if (recommendations.length === 0) {
      recommendations.push("Current security posture is satisfactory. Continue monitoring and maintain current procedures.");
    }

    return recommendations;
  };

  // Export compliance data
  const exportComplianceData = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const data = {
        events: auditEvents,
        metrics: complianceMetrics,
        reports: complianceReports,
        export_timestamp: new Date().toISOString()
      };

      let blob: Blob;
      let filename: string;

      switch (format) {
        case 'json':
          blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          filename = `compliance_audit_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'csv':
          const csvContent = convertToCSV(auditEvents);
          blob = new Blob([csvContent], { type: 'text/csv' });
          filename = `compliance_audit_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        default:
          throw new Error('Unsupported export format');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Compliance data exported as ${format.toUpperCase()}.`,
      });

    } catch (error) {
      console.error('Error exporting compliance data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export compliance data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Convert audit events to CSV format
  const convertToCSV = (events: AuditEvent[]): string => {
    const headers = ['Timestamp', 'Event Type', 'Entity Type', 'Risk Level', 'Compliance Status', 'User ID', 'Details'];
    const rows = events.map(event => [
      event.created_at,
      event.event_type,
      event.entity_type || '',
      event.risk_level,
      event.compliance_status,
      event.user_id || '',
      JSON.stringify(event.details).replace(/"/g, '""')
    ]);

    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadAuditEvents();
  }, [loadAuditEvents]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'non_compliant': return 'bg-red-100 text-red-800 border-red-300';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Audit & Compliance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complianceMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{complianceMetrics.overall_score}%</div>
                <div className="text-sm text-gray-600">Compliance Score</div>
              </div>
              <div className="text-center">
                <Badge variant={complianceMetrics.security_posture === 'excellent' ? 'default' : 'secondary'} className="text-sm">
                  {complianceMetrics.security_posture.charAt(0).toUpperCase() + complianceMetrics.security_posture.slice(1)}
                </Badge>
                <div className="text-sm text-gray-600 mt-1">Security Posture</div>
              </div>
              <div className="text-center">
                <Badge variant={complianceMetrics.risk_assessment === 'low' ? 'default' : 'destructive'} className="text-sm">
                  {complianceMetrics.risk_assessment.charAt(0).toUpperCase() + complianceMetrics.risk_assessment.slice(1)}
                </Badge>
                <div className="text-sm text-gray-600 mt-1">Risk Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{complianceMetrics.pending_reviews}</div>
                <div className="text-sm text-gray-600">Pending Reviews</div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex gap-2">
              {(['24h', '7d', '30d', '90d'] as const).map(range => (
                <Button
                  key={range}
                  size="sm"
                  variant={selectedTimeRange === range ? 'default' : 'outline'}
                  onClick={() => setSelectedTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2">
              {(['all', 'violations', 'incidents', 'access'] as const).map(filter => (
                <Button
                  key={filter}
                  size="sm"
                  variant={filterType === filter ? 'default' : 'outline'}
                  onClick={() => setFilterType(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => generateComplianceReport('daily')}>
                <FileText className="h-4 w-4 mr-1" />
                Daily Report
              </Button>
              <Button size="sm" variant="outline" onClick={() => generateComplianceReport('weekly')}>
                <FileText className="h-4 w-4 mr-1" />
                Weekly Report
              </Button>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => exportComplianceData('csv')}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportComplianceData('json')}>
                <Download className="h-4 w-4 mr-1" />
                Export JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit Trail ({auditEvents.length} events)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading audit events...</div>
            ) : auditEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No audit events found for the selected criteria.</div>
            ) : (
              auditEvents.map(event => (
                <div key={event.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskLevelColor(event.risk_level)}>
                        {event.risk_level}
                      </Badge>
                      <Badge className={getComplianceStatusColor(event.compliance_status)}>
                        {event.compliance_status.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm font-medium">{event.event_type}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Entity:</span> {event.entity_type || 'N/A'}
                    {event.user_id && (
                      <>
                        <span className="ml-4 font-medium">User:</span> {event.user_id}
                      </>
                    )}
                  </div>
                  
                  {event.details && Object.keys(event.details).length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Compliance Reports */}
      {complianceReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Recent Compliance Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceReports.slice(0, 5).map(report => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{report.report_type.replace('_', ' ').toUpperCase()} Report</span>
                    <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Total Events</div>
                      <div>{report.findings.total_events}</div>
                    </div>
                    <div>
                      <div className="font-medium">Violations</div>
                      <div className="text-red-600">{report.findings.compliance_violations}</div>
                    </div>
                    <div>
                      <div className="font-medium">Incidents</div>
                      <div className="text-orange-600">{report.findings.security_incidents}</div>
                    </div>
                    <div>
                      <div className="font-medium">Access Issues</div>
                      <div className="text-yellow-600">{report.findings.access_anomalies}</div>
                    </div>
                    <div>
                      <div className="font-medium">Generated</div>
                      <div>{new Date(report.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  {report.recommendations.length > 0 && (
                    <div className="mt-3">
                      <div className="font-medium text-sm mb-1">Recommendations:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {report.recommendations.slice(0, 3).map((rec, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-blue-600">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
