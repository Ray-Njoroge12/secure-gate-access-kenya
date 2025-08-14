import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Settings,
  Users,
  UserCheck,
  UserX,
  Database,
  Server,
  Network,
  Globe,
  Smartphone,
  Laptop,
  Monitor,
  Fingerprint,
  Scan,
  QrCode,
  CreditCard,
  IdCard,
  Calendar,
  MapPin,
  Building,
  Camera,
  Mic,
  Wifi,
  Bluetooth,
  Usb,
  HardDrive,
  MemoryStick,
  Folder,
  File,
  Mail,
  Phone,
  MessageSquare,
  Bell,
  BellOff,
  Flag,
  Target,
  Crosshair,
  Radar,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Timer,
  Stopwatch,
  History,
  Archive,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  Link,
  ExternalLink,
  Copy,
  Share,
  Send,
  Paperclip,
  Image,
  Video,
  Music,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FilePlus,
  FileMinus,
  MoreHorizontal,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Square,
  Circle,
  Triangle,
  Star,
  Heart,
  Bookmark as BookmarkIcon,
  Home,
  User,
  Group
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SecurityRole {
  id: string;
  name: string;
  description: string;
  level: 'basic' | 'standard' | 'elevated' | 'admin' | 'super_admin';
  permissions: string[];
  restrictions: string[];
  assignedUsers: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  location?: string;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure' | 'blocked';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  sessionId?: string;
}

interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'security' | 'privacy' | 'industry' | 'regulatory';
  requirements: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    mandatory: boolean;
    implemented: boolean;
    compliance_score: number;
    evidence: string[];
    gaps: string[];
  }>;
  overallScore: number;
  lastAssessment: Date;
  nextAssessment: Date;
  responsible: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';
}

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'access_violation' | 'data_breach' | 'malware' | 'phishing' | 'insider_threat' | 'system_compromise' | 'policy_violation';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  reportedBy: string;
  reportedAt: Date;
  assignedTo?: string;
  location?: string;
  affectedSystems: string[];
  affectedUsers: string[];
  timeline: Array<{
    timestamp: Date;
    action: string;
    details: string;
    user: string;
  }>;
  evidence: Array<{
    type: 'log' | 'screenshot' | 'document' | 'video';
    filename: string;
    description: string;
    uploadedAt: Date;
  }>;
  mitigation: {
    steps: string[];
    completed: boolean;
    completedAt?: Date;
  };
  rootCause?: string;
  lessons: string[];
}

interface DataProtectionPolicy {
  id: string;
  name: string;
  type: 'retention' | 'classification' | 'encryption' | 'access' | 'deletion' | 'transfer';
  description: string;
  scope: 'global' | 'location' | 'department' | 'role';
  rules: Array<{
    condition: string;
    action: string;
    automated: boolean;
    exceptions: string[];
  }>;
  dataTypes: string[];
  retentionPeriod?: number;
  encryptionRequired: boolean;
  approvalRequired: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastReview: Date;
  nextReview: Date;
}

interface ThreatAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  source: 'system' | 'user_report' | 'automated_scan' | 'external_feed';
  category: 'anomaly' | 'malware' | 'intrusion' | 'policy_violation' | 'data_leak' | 'unauthorized_access';
  status: 'active' | 'investigating' | 'mitigated' | 'false_positive' | 'resolved';
  detectedAt: Date;
  lastUpdated: Date;
  affectedAssets: string[];
  indicators: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  recommendations: string[];
  automatedResponse?: {
    action: string;
    executed: boolean;
    executedAt?: Date;
    result?: string;
  };
}

const SecurityComplianceCenter: React.FC = () => {
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [complianceFrameworks, setComplianceFrameworks] = useState<ComplianceFramework[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [dataProtectionPolicies, setDataProtectionPolicies] = useState<DataProtectionPolicy[]>([]);
  const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock security roles
      const mockRoles: SecurityRole[] = [
        {
          id: 'role-001',
          name: 'Security Administrator',
          description: 'Full security management access',
          level: 'super_admin',
          permissions: [
            'security.manage_all',
            'users.manage_all',
            'audit.view_all',
            'incidents.manage_all',
            'compliance.manage_all'
          ],
          restrictions: [],
          assignedUsers: 3,
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-08-10'),
          isActive: true
        },
        {
          id: 'role-002',
          name: 'Compliance Officer',
          description: 'Compliance monitoring and reporting',
          level: 'admin',
          permissions: [
            'compliance.view_all',
            'compliance.create_reports',
            'audit.view_compliance',
            'policies.manage_compliance'
          ],
          restrictions: ['security.system_config'],
          assignedUsers: 2,
          createdAt: new Date('2025-02-01'),
          updatedAt: new Date('2025-08-05'),
          isActive: true
        },
        {
          id: 'role-003',
          name: 'Security Analyst',
          description: 'Incident investigation and monitoring',
          level: 'standard',
          permissions: [
            'incidents.view_all',
            'incidents.investigate',
            'audit.view_incidents',
            'threats.view_all'
          ],
          restrictions: ['users.modify', 'policies.modify'],
          assignedUsers: 8,
          createdAt: new Date('2025-03-10'),
          updatedAt: new Date('2025-08-12'),
          isActive: true
        }
      ];

      // Mock audit logs
      const mockAuditLogs: AuditLogEntry[] = [
        {
          id: 'audit-001',
          timestamp: new Date('2025-08-14T10:30:00'),
          userId: 'user-001',
          userName: 'John Kimani',
          action: 'LOGIN_SUCCESS',
          resource: 'authentication_system',
          location: 'Nairobi HQ',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          result: 'success',
          riskLevel: 'low',
          details: { method: 'biometric', device: 'workstation_001' },
          sessionId: 'sess_12345'
        },
        {
          id: 'audit-002',
          timestamp: new Date('2025-08-14T10:25:00'),
          userId: 'user-002',
          userName: 'Jane Wanjiku',
          action: 'POLICY_MODIFICATION',
          resource: 'security_policy',
          resourceId: 'pol-001',
          location: 'Westlands Branch',
          ipAddress: '192.168.2.50',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          result: 'success',
          riskLevel: 'medium',
          details: { 
            policy_name: 'Access Control Policy',
            changes: ['updated_business_hours', 'added_emergency_access'] 
          }
        },
        {
          id: 'audit-003',
          timestamp: new Date('2025-08-14T10:20:00'),
          userId: 'user-003',
          userName: 'Unknown User',
          action: 'LOGIN_FAILED',
          resource: 'authentication_system',
          location: 'Unknown',
          ipAddress: '203.45.67.89',
          userAgent: 'curl/7.68.0',
          result: 'blocked',
          riskLevel: 'high',
          details: { 
            reason: 'invalid_credentials',
            attempts: 5,
            blocked_duration: '30_minutes'
          }
        }
      ];

      // Mock compliance frameworks
      const mockFrameworks: ComplianceFramework[] = [
        {
          id: 'framework-001',
          name: 'ISO 27001:2022',
          version: '2022',
          description: 'Information Security Management System',
          type: 'security',
          requirements: [
            {
              id: 'iso-001',
              title: 'Access Control Management',
              description: 'Implement proper access control measures',
              category: 'Access Control',
              mandatory: true,
              implemented: true,
              compliance_score: 92,
              evidence: ['access_control_policy.pdf', 'rbac_implementation.doc'],
              gaps: ['Multi-factor authentication for all admin accounts']
            },
            {
              id: 'iso-002',
              title: 'Incident Management',
              description: 'Establish incident response procedures',
              category: 'Incident Management',
              mandatory: true,
              implemented: true,
              compliance_score: 88,
              evidence: ['incident_response_plan.pdf'],
              gaps: ['Automated incident detection', 'External communication templates']
            }
          ],
          overallScore: 90,
          lastAssessment: new Date('2025-07-15'),
          nextAssessment: new Date('2025-10-15'),
          responsible: 'compliance@securegate.com',
          status: 'compliant'
        },
        {
          id: 'framework-002',
          name: 'GDPR',
          version: '2018',
          description: 'General Data Protection Regulation',
          type: 'privacy',
          requirements: [
            {
              id: 'gdpr-001',
              title: 'Data Subject Rights',
              description: 'Implement mechanisms for data subject rights',
              category: 'Rights Management',
              mandatory: true,
              implemented: false,
              compliance_score: 45,
              evidence: [],
              gaps: ['Right to be forgotten implementation', 'Data portability tools']
            }
          ],
          overallScore: 65,
          lastAssessment: new Date('2025-06-01'),
          nextAssessment: new Date('2025-09-01'),
          responsible: 'dpo@securegate.com',
          status: 'partial'
        }
      ];

      // Mock security incidents
      const mockIncidents: SecurityIncident[] = [
        {
          id: 'inc-001',
          title: 'Suspicious Login Attempts',
          description: 'Multiple failed login attempts from foreign IP addresses',
          severity: 'medium',
          category: 'access_violation',
          status: 'investigating',
          reportedBy: 'security@securegate.com',
          reportedAt: new Date('2025-08-14T09:00:00'),
          assignedTo: 'john.analyst@securegate.com',
          location: 'Nairobi HQ',
          affectedSystems: ['authentication_system', 'user_database'],
          affectedUsers: ['admin@securegate.com'],
          timeline: [
            {
              timestamp: new Date('2025-08-14T09:00:00'),
              action: 'Incident Reported',
              details: 'Automated system detected suspicious activity',
              user: 'system'
            },
            {
              timestamp: new Date('2025-08-14T09:15:00'),
              action: 'Investigation Started',
              details: 'Assigned to security analyst for investigation',
              user: 'security@securegate.com'
            }
          ],
          evidence: [
            {
              type: 'log',
              filename: 'auth_logs_2025-08-14.log',
              description: 'Authentication system logs showing failed attempts',
              uploadedAt: new Date('2025-08-14T09:30:00')
            }
          ],
          mitigation: {
            steps: [
              'Block suspicious IP addresses',
              'Reset affected user passwords',
              'Enable additional monitoring'
            ],
            completed: false
          },
          lessons: []
        }
      ];

      // Mock data protection policies
      const mockPolicies: DataProtectionPolicy[] = [
        {
          id: 'policy-001',
          name: 'PII Encryption Policy',
          type: 'encryption',
          description: 'All personally identifiable information must be encrypted',
          scope: 'global',
          rules: [
            {
              condition: 'data.type === "PII"',
              action: 'encrypt_aes_256',
              automated: true,
              exceptions: ['system_admin_access']
            }
          ],
          dataTypes: ['personal_data', 'financial_data', 'health_data'],
          encryptionRequired: true,
          approvalRequired: false,
          isActive: true,
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-08-01'),
          lastReview: new Date('2025-07-01'),
          nextReview: new Date('2025-10-01')
        }
      ];

      // Mock threat alerts
      const mockThreatAlerts: ThreatAlert[] = [
        {
          id: 'threat-001',
          title: 'Brute Force Attack Detected',
          description: 'Automated brute force attack detected on login endpoints',
          severity: 'high',
          source: 'automated_scan',
          category: 'intrusion',
          status: 'active',
          detectedAt: new Date('2025-08-14T10:45:00'),
          lastUpdated: new Date('2025-08-14T10:45:00'),
          affectedAssets: ['login_portal', 'user_database'],
          indicators: [
            {
              type: 'IP_ADDRESS',
              value: '203.45.67.89',
              confidence: 95
            },
            {
              type: 'USER_AGENT',
              value: 'curl/7.68.0',
              confidence: 90
            }
          ],
          recommendations: [
            'Block the attacking IP address',
            'Implement rate limiting',
            'Enable CAPTCHA for failed login attempts'
          ],
          automatedResponse: {
            action: 'IP_BLOCK',
            executed: true,
            executedAt: new Date('2025-08-14T10:46:00'),
            result: 'Successfully blocked IP address'
          }
        }
      ];

      setRoles(mockRoles);
      setAuditLogs(mockAuditLogs);
      setComplianceFrameworks(mockFrameworks);
      setIncidents(mockIncidents);
      setDataProtectionPolicies(mockPolicies);
      setThreatAlerts(mockThreatAlerts);

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load security data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const createSecurityRole = async (roleData: Partial<SecurityRole>) => {
    try {
      const newRole: SecurityRole = {
        id: `role-${Date.now()}`,
        name: roleData.name || '',
        description: roleData.description || '',
        level: roleData.level || 'basic',
        permissions: roleData.permissions || [],
        restrictions: roleData.restrictions || [],
        assignedUsers: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      setRoles(prev => [newRole, ...prev]);

      toast({
        title: "Role Created",
        description: "Security role has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create security role.",
        variant: "destructive"
      });
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: SecurityIncident['status']) => {
    try {
      setIncidents(prev => prev.map(inc => 
        inc.id === incidentId 
          ? {
              ...inc, 
              status: newStatus,
              timeline: [
                ...inc.timeline,
                {
                  timestamp: new Date(),
                  action: `Status changed to ${newStatus}`,
                  details: `Incident status updated`,
                  user: 'current-user@securegate.com'
                }
              ]
            }
          : inc
      ));

      toast({
        title: "Status Updated",
        description: `Incident status changed to ${newStatus}.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update incident status.",
        variant: "destructive"
      });
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      setThreatAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'investigating' } : alert
      ));

      toast({
        title: "Alert Acknowledged",
        description: "Threat alert has been acknowledged and is under investigation.",
      });
    } catch (error) {
      toast({
        title: "Acknowledgment Failed",
        description: "Failed to acknowledge threat alert.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'open': case 'compliant': return 'bg-green-500';
      case 'investigating': case 'partial': return 'bg-yellow-500';
      case 'resolved': case 'closed': return 'bg-gray-500';
      case 'non_compliant': case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 animate-pulse" />
          <span>Loading security & compliance center...</span>
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
            Security & Compliance Center
          </h1>
          <p className="text-muted-foreground">
            Comprehensive security governance and compliance management
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchSecurityData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Security Report
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {threatAlerts.filter(t => t.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {threatAlerts.filter(t => t.severity === 'critical').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <Flag className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {incidents.filter(i => ['open', 'investigating'].includes(i.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {incidents.filter(i => i.severity === 'high').length} high severity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {complianceFrameworks.length > 0 
                ? Math.round(complianceFrameworks.reduce((sum, f) => sum + f.overallScore, 0) / complianceFrameworks.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across {complianceFrameworks.length} frameworks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Roles</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {roles.filter(r => r.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {roles.reduce((sum, r) => sum + r.assignedUsers, 0)} total assignments
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="threats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="roles">Roles & Access</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="policies">Data Protection</TabsTrigger>
        </TabsList>

        {/* Threats Tab */}
        <TabsContent value="threats" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search threats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {threatAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{alert.title}</CardTitle>
                      <CardDescription className="text-xs">{alert.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`}></div>
                      <Badge variant="outline" className="text-xs capitalize">{alert.severity}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{alert.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Source:</span>
                        <div className="font-medium capitalize">{alert.source.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <div className="font-medium capitalize">{alert.category.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Detected:</span>
                        <div className="font-medium">{alert.detectedAt.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Affected Assets:</span>
                        <div className="font-medium">{alert.affectedAssets.length}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium mb-2">Threat Indicators:</div>
                      <div className="space-y-1">
                        {alert.indicators.map((indicator, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded text-xs">
                            <span>{indicator.type}: {indicator.value}</span>
                            <Badge variant="secondary">
                              {indicator.confidence}% confidence
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium mb-2">Recommendations:</div>
                      <div className="space-y-1">
                        {alert.recommendations.map((rec, index) => (
                          <div key={index} className="text-xs p-2 bg-muted rounded">
                            • {rec}
                          </div>
                        ))}
                      </div>
                    </div>

                    {alert.automatedResponse && (
                      <Alert>
                        <Zap className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Automated Response: {alert.automatedResponse.action} - 
                          {alert.automatedResponse.executed ? ' Executed' : ' Pending'}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => acknowledgeAlert(alert.id)}
                        disabled={alert.status !== 'active'}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Acknowledge
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Investigate
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Security Incidents</h3>
              <p className="text-sm text-muted-foreground">Track and manage security incidents</p>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </div>

          <div className="space-y-4">
            {incidents.map((incident) => (
              <Card key={incident.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{incident.title}</CardTitle>
                      <CardDescription className="text-xs">{incident.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getSeverityColor(incident.severity)}`}></div>
                      <Badge variant="outline" className="text-xs capitalize">{incident.severity}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{incident.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <div className="font-medium capitalize">{incident.category.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reported By:</span>
                        <div className="font-medium">{incident.reportedBy}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reported:</span>
                        <div className="font-medium">{incident.reportedAt.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Assigned To:</span>
                        <div className="font-medium">{incident.assignedTo || 'Unassigned'}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium mb-2">Affected Systems:</div>
                      <div className="flex flex-wrap gap-1">
                        {incident.affectedSystems.map((system) => (
                          <Badge key={system} variant="secondary" className="text-xs">
                            {system}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium mb-2">Timeline:</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {incident.timeline.map((entry, index) => (
                          <div key={index} className="text-xs p-2 border-l-2 border-blue-200 pl-3">
                            <div className="font-medium">{entry.action}</div>
                            <div className="text-muted-foreground">
                              {entry.timestamp.toLocaleString()} by {entry.user}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Select 
                        value={incident.status} 
                        onValueChange={(value) => updateIncidentStatus(incident.id, value as SecurityIncident['status'])}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="contained">Contained</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Compliance Frameworks</h3>
              <p className="text-sm text-muted-foreground">Monitor compliance across frameworks</p>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Framework
            </Button>
          </div>

          <div className="space-y-4">
            {complianceFrameworks.map((framework) => (
              <Card key={framework.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{framework.name}</CardTitle>
                      <CardDescription className="text-xs">{framework.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(framework.status)}`}></div>
                      <Badge variant="outline" className="text-xs capitalize">{framework.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Overall Score:</span>
                        <div className="font-medium text-lg">{framework.overallScore}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <div className="font-medium capitalize">{framework.type}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Assessment:</span>
                        <div className="font-medium">{framework.lastAssessment.toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Assessment:</span>
                        <div className="font-medium">{framework.nextAssessment.toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium mb-2">Compliance Progress</div>
                      <Progress value={framework.overallScore} className="h-3" />
                    </div>

                    <div>
                      <div className="text-xs font-medium mb-2">Requirements Status:</div>
                      <div className="space-y-2">
                        {framework.requirements.map((req) => (
                          <div key={req.id} className="p-2 border rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{req.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs">{req.compliance_score}%</span>
                                {req.implemented ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">{req.description}</div>
                            {req.gaps.length > 0 && (
                              <div className="text-xs mt-1">
                                <span className="font-medium text-red-600">Gaps: </span>
                                {req.gaps.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        Assessment Report
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Update
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Roles & Access Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Security Roles & Access Control</h3>
              <p className="text-sm text-muted-foreground">Manage security roles and permissions</p>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{role.name}</CardTitle>
                      <CardDescription className="text-xs">{role.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{role.level}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Level:</span>
                        <div className="font-medium capitalize">{role.level.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Assigned Users:</span>
                        <div className="font-medium">{role.assignedUsers}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Permissions:</span>
                        <div className="font-medium">{role.permissions.length}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Restrictions:</span>
                        <div className="font-medium">{role.restrictions.length}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium mb-2">Key Permissions:</div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <div key={permission} className="text-xs p-1 bg-green-50 rounded">
                            ✓ {permission.replace(/[._]/g, ' ')}
                          </div>
                        ))}
                        {role.permissions.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{role.permissions.length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        Assign
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-3 w-3 mr-1" />
                        Clone
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <Card key={log.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.result === 'success' ? 'bg-green-500' :
                      log.result === 'failure' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                    <div>
                      <div className="text-sm font-medium">{log.action.replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.userName} • {log.ipAddress} • {log.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs">{log.timestamp.toLocaleString()}</div>
                    <Badge variant="outline" className={`text-xs ${
                      log.riskLevel === 'critical' ? 'border-red-500 text-red-600' :
                      log.riskLevel === 'high' ? 'border-orange-500 text-orange-600' :
                      log.riskLevel === 'medium' ? 'border-yellow-500 text-yellow-600' :
                      'border-blue-500 text-blue-600'
                    }`}>
                      {log.riskLevel} risk
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Data Protection Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Data Protection Policies</h3>
              <p className="text-sm text-muted-foreground">Manage data privacy and protection policies</p>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </div>

          <div className="space-y-4">
            {dataProtectionPolicies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{policy.name}</CardTitle>
                      <CardDescription className="text-xs">{policy.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{policy.type}</Badge>
                      <Badge variant={policy.isActive ? "default" : "secondary"}>
                        {policy.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Scope:</span>
                        <div className="font-medium capitalize">{policy.scope}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Data Types:</span>
                        <div className="font-medium">{policy.dataTypes.length}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Encryption:</span>
                        <div className="font-medium">{policy.encryptionRequired ? 'Required' : 'Optional'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Review:</span>
                        <div className="font-medium">{policy.nextReview.toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium mb-2">Data Types Covered:</div>
                      <div className="flex flex-wrap gap-1">
                        {policy.dataTypes.map((type) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium mb-2">Policy Rules:</div>
                      <div className="space-y-1">
                        {policy.rules.map((rule, index) => (
                          <div key={index} className="text-xs p-2 border rounded">
                            <div className="font-medium">When {rule.condition}</div>
                            <div className="text-muted-foreground">Then {rule.action}</div>
                            {rule.automated && (
                              <Badge variant="outline" className="text-xs mt-1">Automated</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-3 w-3 mr-1" />
                        Clone
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        Compliance
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityComplianceCenter;
