import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Shield, 
  Calendar, 
  Users, 
  Eye, 
  Lock,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  FileImage,
  Database,
  Trash2,
  UserX,
  Archive,
  Settings,
  Search,
  Filter,
  RefreshCw,
  Share,
  Mail,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ComplianceReport {
  id: string;
  type: 'GDPR' | 'DPA' | 'Security' | 'Audit' | 'Custom';
  title: string;
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'published';
  createdAt: Date;
  updatedAt: Date;
  generatedBy: string;
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  nextGeneration?: Date;
  format: 'pdf' | 'csv' | 'excel' | 'json';
  size: string;
  url?: string;
}

interface DataRetentionPolicy {
  id: string;
  dataType: string;
  retentionPeriod: number;
  retentionUnit: 'days' | 'months' | 'years';
  isActive: boolean;
  autoDelete: boolean;
  lastCleanup: Date;
  recordsAffected: number;
  complianceStandard: string[];
}

interface PrivacyRequest {
  id: string;
  type: 'access' | 'rectification' | 'deletion' | 'portability' | 'restriction';
  requesterId: string;
  requesterEmail: string;
  requestDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  assignedTo?: string;
  description: string;
  responseTime: number;
  dataCategories: string[];
}

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'authentication' | 'data_access' | 'data_modification' | 'system' | 'privacy';
}

interface ComplianceScore {
  overall: number;
  gdpr: number;
  dpa: number;
  security: number;
  lastAssessment: Date;
  risks: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }>;
}

const ComplianceReportingCenter: React.FC = () => {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<DataRetentionPolicy[]>([]);
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [complianceScore, setComplianceScore] = useState<ComplianceScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchComplianceData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate fetching compliance data
      const mockReports: ComplianceReport[] = [
        {
          id: 'rpt-001',
          type: 'GDPR',
          title: 'Monthly GDPR Compliance Report',
          description: 'Comprehensive GDPR compliance assessment and data processing activities',
          status: 'published',
          createdAt: new Date('2025-08-01'),
          updatedAt: new Date('2025-08-01'),
          generatedBy: 'System Auto-Generate',
          schedule: 'monthly',
          nextGeneration: new Date('2025-09-01'),
          format: 'pdf',
          size: '2.3 MB',
          url: '/reports/gdpr-2025-08.pdf'
        },
        {
          id: 'rpt-002',
          type: 'Security',
          title: 'Security Audit Report',
          description: 'Detailed security assessment and incident analysis',
          status: 'approved',
          createdAt: new Date('2025-08-10'),
          updatedAt: new Date('2025-08-12'),
          generatedBy: 'John Doe',
          schedule: 'quarterly',
          format: 'pdf',
          size: '4.1 MB'
        },
        {
          id: 'rpt-003',
          type: 'DPA',
          title: 'Kenya DPA Compliance Report',
          description: 'Data Protection Act compliance verification',
          status: 'pending',
          createdAt: new Date('2025-08-13'),
          updatedAt: new Date('2025-08-13'),
          generatedBy: 'Jane Smith',
          schedule: 'quarterly',
          format: 'excel',
          size: '1.8 MB'
        }
      ];

      const mockRetentionPolicies: DataRetentionPolicy[] = [
        {
          id: 'pol-001',
          dataType: 'Visitor Registration Data',
          retentionPeriod: 2,
          retentionUnit: 'years',
          isActive: true,
          autoDelete: true,
          lastCleanup: new Date('2025-08-01'),
          recordsAffected: 1247,
          complianceStandard: ['GDPR', 'Kenya DPA']
        },
        {
          id: 'pol-002',
          dataType: 'Access Logs',
          retentionPeriod: 7,
          retentionUnit: 'years',
          isActive: true,
          autoDelete: false,
          lastCleanup: new Date('2025-07-15'),
          recordsAffected: 48392,
          complianceStandard: ['Security Policy', 'Audit Requirements']
        },
        {
          id: 'pol-003',
          dataType: 'Incident Reports',
          retentionPeriod: 10,
          retentionUnit: 'years',
          isActive: true,
          autoDelete: false,
          lastCleanup: new Date('2025-06-30'),
          recordsAffected: 156,
          complianceStandard: ['Legal Requirements', 'Insurance']
        }
      ];

      const mockPrivacyRequests: PrivacyRequest[] = [
        {
          id: 'req-001',
          type: 'deletion',
          requesterId: 'user-123',
          requesterEmail: 'john.visitor@email.com',
          requestDate: new Date('2025-08-10'),
          status: 'processing',
          priority: 'high',
          dueDate: new Date('2025-08-25'),
          assignedTo: 'privacy-officer',
          description: 'Request to delete all personal data after lease termination',
          responseTime: 5,
          dataCategories: ['Personal Info', 'Visit History', 'Access Logs']
        },
        {
          id: 'req-002',
          type: 'access',
          requesterId: 'user-456',
          requesterEmail: 'mary.resident@email.com',
          requestDate: new Date('2025-08-12'),
          status: 'completed',
          priority: 'medium',
          dueDate: new Date('2025-08-27'),
          description: 'Request for copy of all personal data held',
          responseTime: 3,
          dataCategories: ['Personal Info', 'Resident Profile', 'Invitation History']
        },
        {
          id: 'req-003',
          type: 'rectification',
          requesterId: 'user-789',
          requesterEmail: 'peter.guard@email.com',
          requestDate: new Date('2025-08-13'),
          status: 'pending',
          priority: 'low',
          dueDate: new Date('2025-08-28'),
          description: 'Correction of phone number in employee records',
          responseTime: 0,
          dataCategories: ['Employee Info']
        }
      ];

      const mockAuditLogs: AuditLog[] = [
        {
          id: 'log-001',
          timestamp: new Date('2025-08-13T10:30:00'),
          userId: 'user-123',
          userEmail: 'admin@securegate.com',
          action: 'DATA_EXPORT',
          resource: 'visitor_data',
          details: 'Exported visitor data for compliance report',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          severity: 'info',
          category: 'data_access'
        },
        {
          id: 'log-002',
          timestamp: new Date('2025-08-13T09:15:00'),
          userId: 'user-456',
          userEmail: 'guard@securegate.com',
          action: 'LOGIN_SUCCESS',
          resource: 'security_interface',
          details: 'Successful login to security guard interface',
          ipAddress: '192.168.1.105',
          userAgent: 'Mobile App v2.1',
          severity: 'info',
          category: 'authentication'
        },
        {
          id: 'log-003',
          timestamp: new Date('2025-08-13T08:45:00'),
          userId: 'user-789',
          userEmail: 'unknown@unknown.com',
          action: 'LOGIN_FAILED',
          resource: 'admin_panel',
          details: 'Failed login attempt with invalid credentials',
          ipAddress: '203.45.67.89',
          userAgent: 'curl/7.68.0',
          severity: 'warning',
          category: 'authentication'
        }
      ];

      const mockComplianceScore: ComplianceScore = {
        overall: 87,
        gdpr: 92,
        dpa: 85,
        security: 84,
        lastAssessment: new Date('2025-08-10'),
        risks: [
          {
            category: 'Data Retention',
            severity: 'medium',
            description: 'Some access logs exceed recommended retention period',
            recommendation: 'Implement automated cleanup for logs older than 7 years'
          },
          {
            category: 'Privacy Requests',
            severity: 'low',
            description: 'Average response time for privacy requests could be improved',
            recommendation: 'Streamline privacy request workflow and assign dedicated resources'
          },
          {
            category: 'Audit Trail',
            severity: 'low',
            description: 'Some system actions lack detailed audit logging',
            recommendation: 'Enhance logging for administrative actions'
          }
        ]
      };

      setReports(mockReports);
      setRetentionPolicies(mockRetentionPolicies);
      setPrivacyRequests(mockPrivacyRequests);
      setAuditLogs(mockAuditLogs);
      setComplianceScore(mockComplianceScore);

    } catch (error) {
      console.error('Error fetching compliance data:', error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load compliance data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReport = async (type: ComplianceReport['type'], format: ComplianceReport['format']) => {
    try {
      toast({
        title: "Report Generation Started",
        description: `Generating ${type} report in ${format.toUpperCase()} format...`,
      });

      // Simulate report generation
      setTimeout(() => {
        const newReport: ComplianceReport = {
          id: `rpt-${Date.now()}`,
          type,
          title: `${type} Report - ${new Date().toLocaleDateString()}`,
          description: `Auto-generated ${type} compliance report`,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          generatedBy: 'System Auto-Generate',
          schedule: 'manual',
          format,
          size: `${(Math.random() * 5 + 1).toFixed(1)} MB`
        };

        setReports(prev => [newReport, ...prev]);

        toast({
          title: "Report Generated",
          description: `${type} report has been generated successfully.`,
        });
      }, 3000);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const processPrivacyRequest = async (requestId: string, action: 'approve' | 'reject' | 'complete') => {
    try {
      setPrivacyRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: action === 'approve' ? 'processing' : action === 'reject' ? 'rejected' : 'completed',
              responseTime: action === 'complete' ? req.responseTime + 1 : req.responseTime
            }
          : req
      ));

      toast({
        title: "Privacy Request Updated",
        description: `Request has been ${action}d successfully.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update privacy request.",
        variant: "destructive"
      });
    }
  };

  const runDataCleanup = async (policyId: string) => {
    try {
      toast({
        title: "Data Cleanup Started",
        description: "Running automated data cleanup based on retention policy...",
      });

      setTimeout(() => {
        setRetentionPolicies(prev => prev.map(policy => 
          policy.id === policyId 
            ? { 
                ...policy, 
                lastCleanup: new Date(),
                recordsAffected: Math.floor(Math.random() * 100) + 50
              }
            : policy
        ));

        toast({
          title: "Cleanup Complete",
          description: "Data cleanup completed successfully based on retention policy.",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: "Failed to run data cleanup. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportAuditLogs = async (format: 'csv' | 'excel' | 'json') => {
    try {
      toast({
        title: "Export Started",
        description: `Exporting audit logs in ${format.toUpperCase()} format...`,
      });
      
      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: `Audit logs exported successfully.`,
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export audit logs.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchComplianceData();
  }, [fetchComplianceData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': case 'completed': case 'approved': return 'bg-green-500';
      case 'processing': case 'pending': return 'bg-yellow-500';
      case 'rejected': case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 animate-pulse" />
          <span>Loading compliance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Compliance & Reporting Center
          </h1>
          <p className="text-muted-foreground">
            GDPR, Kenya DPA compliance and comprehensive reporting
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchComplianceData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => generateReport('GDPR', 'pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Compliance Score Dashboard */}
      {complianceScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Compliance Score Overview
            </CardTitle>
            <CardDescription>Overall compliance assessment and risk analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{complianceScore.overall}%</div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <Progress value={complianceScore.overall} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{complianceScore.gdpr}%</div>
                <p className="text-sm text-muted-foreground">GDPR Compliance</p>
                <Progress value={complianceScore.gdpr} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{complianceScore.dpa}%</div>
                <p className="text-sm text-muted-foreground">Kenya DPA</p>
                <Progress value={complianceScore.dpa} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{complianceScore.security}%</div>
                <p className="text-sm text-muted-foreground">Security</p>
                <Progress value={complianceScore.security} className="mt-2" />
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="font-medium mb-3">Identified Risks & Recommendations</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {complianceScore.risks.map((risk, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(risk.severity)}`}></div>
                      <span className="font-medium">{risk.category}</span>
                      <Badge variant="outline" className="text-xs">{risk.severity}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                    <p className="text-sm">{risk.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Requests</TabsTrigger>
          <TabsTrigger value="retention">Data Retention</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="export">Export & Share</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Compliance Reports</h2>
              <p className="text-muted-foreground">Generated compliance and audit reports</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => generateReport('GDPR', 'pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                GDPR Report
              </Button>
              <Button variant="outline" size="sm" onClick={() => generateReport('DPA', 'excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                DPA Report
              </Button>
              <Button variant="outline" size="sm" onClick={() => generateReport('Security', 'pdf')}>
                <Shield className="h-4 w-4 mr-2" />
                Security Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{report.type}</Badge>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`}></div>
                      <span className="text-xs text-muted-foreground capitalize">{report.status}</span>
                    </div>
                  </div>
                  <CardTitle className="text-sm">{report.title}</CardTitle>
                  <CardDescription className="text-xs">{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{report.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="uppercase">{report.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{report.size}</span>
                    </div>
                    {report.schedule !== 'manual' && (
                      <div className="flex justify-between">
                        <span>Schedule:</span>
                        <span className="capitalize">{report.schedule}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    {report.url && (
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Privacy Requests Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Privacy Requests</h2>
              <p className="text-muted-foreground">GDPR and DPA privacy rights requests</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Pending: {privacyRequests.filter(r => r.status === 'pending').length}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Processing: {privacyRequests.filter(r => r.status === 'processing').length}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {privacyRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{request.type}</Badge>
                      <Badge variant={getPriorityColor(request.priority)}>{request.priority}</Badge>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(request.status)}`}></div>
                        <span className="text-sm text-muted-foreground capitalize">{request.status}</span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Due: {request.dueDate.toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Requester</p>
                      <p className="text-sm text-muted-foreground">{request.requesterEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Request Date</p>
                      <p className="text-sm text-muted-foreground">{request.requestDate.toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Data Categories Affected</p>
                    <div className="flex flex-wrap gap-1">
                      {request.dataCategories.map((category, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">{category}</Badge>
                      ))}
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => processPrivacyRequest(request.id, 'approve')}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Process
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => processPrivacyRequest(request.id, 'reject')}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {request.status === 'processing' && (
                    <Button 
                      size="sm" 
                      onClick={() => processPrivacyRequest(request.id, 'complete')}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark Complete
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Data Retention Tab */}
        <TabsContent value="retention" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Data Retention Policies</h2>
              <p className="text-muted-foreground">Automated data lifecycle management</p>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure Policies
            </Button>
          </div>

          <div className="space-y-4">
            {retentionPolicies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{policy.dataType}</CardTitle>
                    <div className="flex items-center gap-2">
                      {policy.isActive && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      )}
                      {policy.autoDelete && (
                        <Badge variant="outline">Auto-Delete</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Retention Period</p>
                      <p className="text-sm text-muted-foreground">
                        {policy.retentionPeriod} {policy.retentionUnit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Cleanup</p>
                      <p className="text-sm text-muted-foreground">
                        {policy.lastCleanup.toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Records Affected</p>
                      <p className="text-sm text-muted-foreground">
                        {policy.recordsAffected.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Compliance Standards</p>
                    <div className="flex flex-wrap gap-1">
                      {policy.complianceStandard.map((standard, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">{standard}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => runDataCleanup(policy.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Run Cleanup
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Audit Logs</h2>
              <p className="text-muted-foreground">Comprehensive system activity tracking</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm w-48"
              />
              <Button variant="outline" size="sm" onClick={() => exportAuditLogs('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {auditLogs
              .filter(log => 
                searchTerm === '' || 
                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.resource.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.severity === 'critical' ? 'bg-red-600' :
                        log.severity === 'warning' ? 'bg-yellow-500' :
                        log.severity === 'error' ? 'bg-red-500' :
                        'bg-green-500'
                      }`}></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{log.action}</span>
                          <Badge variant="outline" className="text-xs">{log.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.details}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{log.userEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Export & Share Tab */}
        <TabsContent value="export" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Export & Share</h2>
            <p className="text-muted-foreground">Export compliance data and share reports</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Export Options</CardTitle>
                <CardDescription>Export various data sets for analysis or compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export All Visitor Data (CSV)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Export Access Logs (JSON)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Export Security Incidents (Excel)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Export User Data (CSV)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Archive className="h-4 w-4 mr-2" />
                  Full System Backup (ZIP)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Report Sharing</CardTitle>
                <CardDescription>Share compliance reports with stakeholders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Monthly Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Share className="h-4 w-4 mr-2" />
                  Generate Share Link
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Automatic Reports
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Submit to Authorities
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Compliance Package
                </Button>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              All exports are encrypted and access-logged for security. Sensitive data is automatically 
              anonymized where possible while maintaining compliance requirements.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceReportingCenter;
