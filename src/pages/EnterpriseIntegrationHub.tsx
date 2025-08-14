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
  Network,
  Building,
  Users,
  Key,
  Shield,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Server,
  Database,
  Globe,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  TestTube,
  Activity,
  Zap,
  Link,
  Unlink,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Monitor,
  Smartphone,
  Wifi,
  Cloud,
  HardDrive,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Mic,
  Speaker,
  Thermometer,
  Wind
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  type: 'ldap' | 'sso' | 'erp' | 'bms' | 'security' | 'iot' | 'calendar' | 'communication';
  status: 'connected' | 'disconnected' | 'error' | 'pending' | 'testing';
  provider: string;
  version: string;
  lastSync: Date;
  lastError?: string;
  configuration: Record<string, any>;
  health: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  features: string[];
  enabled: boolean;
}

interface IntegrationTemplate {
  id: string;
  name: string;
  type: Integration['type'];
  provider: string;
  description: string;
  icon: React.ReactNode;
  complexity: 'basic' | 'intermediate' | 'advanced';
  estimatedSetupTime: string;
  requiredFields: string[];
  optionalFields: string[];
  features: string[];
  documentation: string;
}

interface SystemHealth {
  overall: number;
  integrations: {
    total: number;
    active: number;
    errors: number;
    warnings: number;
  };
  performance: {
    avgResponseTime: number;
    totalRequests: number;
    errorRate: number;
    uptime: number;
  };
  security: {
    sslCertificates: number;
    expiringSoon: number;
    securityIssues: number;
    complianceStatus: string;
  };
}

interface ConnectionLog {
  id: string;
  integrationId: string;
  timestamp: Date;
  event: 'connect' | 'disconnect' | 'error' | 'sync' | 'test' | 'configuration_change';
  details: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  duration?: number;
  metadata?: Record<string, any>;
}

const EnterpriseIntegrationHub: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([]);
  const [templates, setTemplates] = useState<IntegrationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [configData, setConfigData] = useState<Record<string, string>>({});

  const integrationTemplates: IntegrationTemplate[] = [
    {
      id: 'ldap-ad',
      name: 'Active Directory / LDAP',
      type: 'ldap',
      provider: 'Microsoft AD / OpenLDAP',
      description: 'Enterprise user directory integration for centralized authentication',
      icon: <Users className="h-6 w-6" />,
      complexity: 'intermediate',
      estimatedSetupTime: '30-60 minutes',
      requiredFields: ['server', 'port', 'bindDN', 'baseDN', 'username', 'password'],
      optionalFields: ['encryption', 'timeout', 'userFilter', 'groupFilter'],
      features: ['User Authentication', 'Group Synchronization', 'Automated Provisioning'],
      documentation: '/docs/integrations/ldap'
    },
    {
      id: 'saml-sso',
      name: 'SAML Single Sign-On',
      type: 'sso',
      provider: 'Azure AD / Okta / OneLogin',
      description: 'Enterprise SSO integration for seamless user authentication',
      icon: <Shield className="h-6 w-6" />,
      complexity: 'advanced',
      estimatedSetupTime: '45-90 minutes',
      requiredFields: ['entityId', 'ssoUrl', 'certificate', 'attributeMapping'],
      optionalFields: ['logoutUrl', 'encryptionCert', 'signatureAlgorithm'],
      features: ['Single Sign-On', 'Automatic Logout', 'Attribute Mapping'],
      documentation: '/docs/integrations/saml'
    },
    {
      id: 'erp-sap',
      name: 'SAP ERP Integration',
      type: 'erp',
      provider: 'SAP',
      description: 'Enterprise resource planning system integration',
      icon: <Database className="h-6 w-6" />,
      complexity: 'advanced',
      estimatedSetupTime: '2-4 hours',
      requiredFields: ['host', 'client', 'username', 'password', 'systemNumber'],
      optionalFields: ['language', 'destination', 'poolSize'],
      features: ['Employee Data Sync', 'Cost Center Integration', 'Asset Management'],
      documentation: '/docs/integrations/sap'
    },
    {
      id: 'bms-honeywell',
      name: 'Building Management System',
      type: 'bms',
      provider: 'Honeywell / Johnson Controls',
      description: 'Integrate with building automation and control systems',
      icon: <Building className="h-6 w-6" />,
      complexity: 'intermediate',
      estimatedSetupTime: '60-120 minutes',
      requiredFields: ['endpoint', 'apiKey', 'buildingId'],
      optionalFields: ['pollInterval', 'timeout', 'zones'],
      features: ['HVAC Control', 'Access Control', 'Energy Monitoring'],
      documentation: '/docs/integrations/bms'
    },
    {
      id: 'security-cameras',
      name: 'Security Camera System',
      type: 'security',
      provider: 'Axis / Hikvision / Dahua',
      description: 'Integration with IP camera systems for visual verification',
      icon: <Camera className="h-6 w-6" />,
      complexity: 'intermediate',
      estimatedSetupTime: '30-60 minutes',
      requiredFields: ['rtspUrl', 'username', 'password', 'cameraIds'],
      optionalFields: ['recordingEnabled', 'motionDetection', 'resolution'],
      features: ['Live Streaming', 'Motion Detection', 'Automated Recording'],
      documentation: '/docs/integrations/cameras'
    },
    {
      id: 'iot-sensors',
      name: 'IoT Sensor Network',
      type: 'iot',
      provider: 'Various IoT Providers',
      description: 'Connect IoT sensors for environmental monitoring and automation',
      icon: <Thermometer className="h-6 w-6" />,
      complexity: 'basic',
      estimatedSetupTime: '15-30 minutes',
      requiredFields: ['mqttBroker', 'topic', 'credentials'],
      optionalFields: ['qos', 'retain', 'sensorTypes'],
      features: ['Environmental Monitoring', 'Automated Alerts', 'Data Logging'],
      documentation: '/docs/integrations/iot'
    }
  ];

  const fetchIntegrationData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate fetching integration data
      const mockIntegrations: Integration[] = [
        {
          id: 'ldap-001',
          name: 'Corporate Active Directory',
          type: 'ldap',
          provider: 'Microsoft AD',
          version: '2019',
          status: 'connected',
          lastSync: new Date('2025-08-13T09:30:00'),
          configuration: {
            server: 'ad.securegate.com',
            port: 389,
            baseDN: 'DC=securegate,DC=com',
            userFilter: '(objectClass=user)',
            groupFilter: '(objectClass=group)'
          },
          health: {
            uptime: 99.8,
            responseTime: 45,
            errorRate: 0.2,
            throughput: 1250
          },
          features: ['User Authentication', 'Group Sync', 'Auto Provisioning'],
          enabled: true
        },
        {
          id: 'sso-001',
          name: 'Azure AD SSO',
          type: 'sso',
          provider: 'Azure Active Directory',
          version: 'v2.0',
          status: 'connected',
          lastSync: new Date('2025-08-13T09:45:00'),
          configuration: {
            entityId: 'https://securegate.com/saml',
            ssoUrl: 'https://login.microsoftonline.com/tenant/saml2',
            certificate: '-----BEGIN CERTIFICATE-----...'
          },
          health: {
            uptime: 99.9,
            responseTime: 120,
            errorRate: 0.1,
            throughput: 890
          },
          features: ['Single Sign-On', 'Automatic Logout', 'MFA Support'],
          enabled: true
        },
        {
          id: 'bms-001',
          name: 'Building Automation',
          type: 'bms',
          provider: 'Honeywell',
          version: '4.2',
          status: 'connected',
          lastSync: new Date('2025-08-13T09:15:00'),
          configuration: {
            endpoint: 'https://bms.securegate.com/api',
            buildingId: 'BLDG-001',
            zones: ['Zone-A', 'Zone-B', 'Zone-C']
          },
          health: {
            uptime: 98.5,
            responseTime: 200,
            errorRate: 1.5,
            throughput: 450
          },
          features: ['HVAC Control', 'Access Integration', 'Energy Monitoring'],
          enabled: true
        },
        {
          id: 'security-001',
          name: 'IP Camera System',
          type: 'security',
          provider: 'Axis Communications',
          version: '9.80',
          status: 'error',
          lastSync: new Date('2025-08-13T08:30:00'),
          lastError: 'Connection timeout - Camera 5 unreachable',
          configuration: {
            rtspUrl: 'rtsp://cameras.securegate.com',
            cameraCount: 24,
            recordingEnabled: true
          },
          health: {
            uptime: 94.2,
            responseTime: 850,
            errorRate: 5.8,
            throughput: 2100
          },
          features: ['Live Streaming', 'Motion Detection', 'Recording'],
          enabled: true
        },
        {
          id: 'iot-001',
          name: 'Environmental Sensors',
          type: 'iot',
          provider: 'IoT Sensor Network',
          version: '1.4',
          status: 'connected',
          lastSync: new Date('2025-08-13T09:50:00'),
          configuration: {
            mqttBroker: 'mqtt.securegate.com',
            sensorCount: 48,
            monitoringEnabled: true
          },
          health: {
            uptime: 97.8,
            responseTime: 35,
            errorRate: 2.2,
            throughput: 3200
          },
          features: ['Temperature Monitoring', 'Motion Detection', 'Air Quality'],
          enabled: true
        }
      ];

      const mockSystemHealth: SystemHealth = {
        overall: 96.8,
        integrations: {
          total: 5,
          active: 4,
          errors: 1,
          warnings: 0
        },
        performance: {
          avgResponseTime: 250,
          totalRequests: 48392,
          errorRate: 1.8,
          uptime: 98.2
        },
        security: {
          sslCertificates: 8,
          expiringSoon: 1,
          securityIssues: 0,
          complianceStatus: 'Compliant'
        }
      };

      const mockConnectionLogs: ConnectionLog[] = [
        {
          id: 'log-001',
          integrationId: 'ldap-001',
          timestamp: new Date('2025-08-13T09:30:00'),
          event: 'sync',
          details: 'Successfully synchronized 1,247 users and 45 groups from Active Directory',
          severity: 'info',
          duration: 12.3
        },
        {
          id: 'log-002',
          integrationId: 'security-001',
          timestamp: new Date('2025-08-13T08:30:00'),
          event: 'error',
          details: 'Camera 5 connection timeout - unable to establish RTSP stream',
          severity: 'error',
          duration: 30.0
        },
        {
          id: 'log-003',
          integrationId: 'sso-001',
          timestamp: new Date('2025-08-13T09:45:00'),
          event: 'connect',
          details: 'SAML SSO connection established with Azure AD tenant',
          severity: 'info',
          duration: 2.1
        },
        {
          id: 'log-004',
          integrationId: 'bms-001',
          timestamp: new Date('2025-08-13T09:15:00'),
          event: 'sync',
          details: 'Building automation data synchronized - 3 HVAC zones updated',
          severity: 'info',
          duration: 5.8
        }
      ];

      setIntegrations(mockIntegrations);
      setSystemHealth(mockSystemHealth);
      setConnectionLogs(mockConnectionLogs);
      setTemplates(integrationTemplates);

    } catch (error) {
      console.error('Error fetching integration data:', error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load integration data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const testIntegration = async (integrationId: string) => {
    setTestingIntegration(integrationId);
    try {
      toast({
        title: "Testing Integration",
        description: "Running connection and functionality tests...",
      });

      // Simulate integration testing
      setTimeout(() => {
        const integration = integrations.find(i => i.id === integrationId);
        if (integration) {
          const testResults = {
            connectivity: Math.random() > 0.1,
            authentication: Math.random() > 0.05,
            dataFlow: Math.random() > 0.08,
            performance: Math.random() > 0.12
          };

          const allPassed = Object.values(testResults).every(result => result);
          
          setIntegrations(prev => prev.map(i => 
            i.id === integrationId 
              ? { ...i, status: allPassed ? 'connected' : 'error' as const }
              : i
          ));

          toast({
            title: allPassed ? "Test Successful" : "Test Failed",
            description: allPassed 
              ? "All integration tests passed successfully." 
              : "Some tests failed. Check the logs for details.",
            variant: allPassed ? "default" : "destructive"
          });
        }
        setTestingIntegration(null);
      }, 3000);
    } catch (error) {
      setTestingIntegration(null);
      toast({
        title: "Test Failed",
        description: "Failed to run integration tests.",
        variant: "destructive"
      });
    }
  };

  const toggleIntegration = async (integrationId: string, enabled: boolean) => {
    try {
      setIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { ...i, enabled, status: enabled ? 'connected' : 'disconnected' as const }
          : i
      ));

      toast({
        title: enabled ? "Integration Enabled" : "Integration Disabled",
        description: `Integration has been ${enabled ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Toggle Failed",
        description: "Failed to toggle integration status.",
        variant: "destructive"
      });
    }
  };

  const syncIntegration = async (integrationId: string) => {
    try {
      toast({
        title: "Synchronization Started",
        description: "Starting data synchronization...",
      });

      setTimeout(() => {
        setIntegrations(prev => prev.map(i => 
          i.id === integrationId 
            ? { ...i, lastSync: new Date() }
            : i
        ));

        const newLog: ConnectionLog = {
          id: `log-${Date.now()}`,
          integrationId,
          timestamp: new Date(),
          event: 'sync',
          details: 'Manual synchronization completed successfully',
          severity: 'info',
          duration: Math.random() * 10 + 2
        };

        setConnectionLogs(prev => [newLog, ...prev]);

        toast({
          title: "Sync Complete",
          description: "Data synchronization completed successfully.",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize integration data.",
        variant: "destructive"
      });
    }
  };

  const installIntegration = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      toast({
        title: "Installing Integration",
        description: `Setting up ${template.name}...`,
      });

      // Simulate installation process
      setTimeout(() => {
        const newIntegration: Integration = {
          id: `${template.type}-${Date.now()}`,
          name: template.name,
          type: template.type,
          provider: template.provider,
          version: '1.0',
          status: 'pending',
          lastSync: new Date(),
          configuration: {},
          health: {
            uptime: 0,
            responseTime: 0,
            errorRate: 0,
            throughput: 0
          },
          features: template.features,
          enabled: false
        };

        setIntegrations(prev => [...prev, newIntegration]);
        setSelectedIntegration(newIntegration.id);
        setShowConfiguration(true);

        toast({
          title: "Integration Installed",
          description: `${template.name} has been installed. Please configure it to start using.`,
        });
      }, 1500);
    } catch (error) {
      toast({
        title: "Installation Failed",
        description: "Failed to install integration.",
        variant: "destructive"
      });
    }
  };

  const exportConfiguration = async () => {
    try {
      const config = {
        integrations: integrations.map(i => ({
          name: i.name,
          type: i.type,
          provider: i.provider,
          configuration: i.configuration,
          enabled: i.enabled
        })),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `integration-config-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Configuration Exported",
        description: "Integration configuration has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export configuration.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchIntegrationData();
  }, [fetchIntegrationData]);

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'testing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'disconnected': return <XCircle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'testing': return <TestTube className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: Integration['type']) => {
    switch (type) {
      case 'ldap': return <Users className="h-5 w-5" />;
      case 'sso': return <Shield className="h-5 w-5" />;
      case 'erp': return <Database className="h-5 w-5" />;
      case 'bms': return <Building className="h-5 w-5" />;
      case 'security': return <Camera className="h-5 w-5" />;
      case 'iot': return <Thermometer className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      case 'communication': return <Mail className="h-5 w-5" />;
      default: return <Network className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Network className="h-6 w-6 animate-pulse" />
          <span>Loading enterprise integrations...</span>
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
            <Network className="h-8 w-8" />
            Enterprise Integration Hub
          </h1>
          <p className="text-muted-foreground">
            Centralized management for all enterprise system integrations
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchIntegrationData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportConfiguration}>
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
          <Button size="sm" onClick={() => setShowConfiguration(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health Overview
            </CardTitle>
            <CardDescription>Real-time status and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${systemHealth.overall >= 95 ? 'text-green-600' : systemHealth.overall >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {systemHealth.overall}%
                </div>
                <p className="text-sm text-muted-foreground">Overall Health</p>
                <Progress value={systemHealth.overall} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.integrations.active}/{systemHealth.integrations.total}</div>
                <p className="text-sm text-muted-foreground">Active Integrations</p>
                <Progress value={(systemHealth.integrations.active / systemHealth.integrations.total) * 100} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.performance.avgResponseTime}ms</div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <Progress value={Math.max(100 - (systemHealth.performance.avgResponseTime / 1000) * 100, 0)} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.performance.uptime}%</div>
                <p className="text-sm text-muted-foreground">System Uptime</p>
                <Progress value={systemHealth.performance.uptime} className="mt-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Errors</span>
                </div>
                <Badge variant="destructive">{systemHealth.integrations.errors}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Security</span>
                </div>
                <Badge variant="secondary">{systemHealth.security.complianceStatus}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Total Requests</span>
                </div>
                <Badge variant="outline">{systemHealth.performance.totalRequests.toLocaleString()}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="active">Active Integrations</TabsTrigger>
          <TabsTrigger value="templates">Available Templates</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="logs">Connection Logs</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
        </TabsList>

        {/* Active Integrations Tab */}
        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id} className={`${!integration.enabled ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(integration.type)}
                      <div>
                        <CardTitle className="text-sm">{integration.name}</CardTitle>
                        <CardDescription className="text-xs">{integration.provider}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(integration.status)}`}></div>
                      {getStatusIcon(integration.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Uptime:</span>
                        <div className="font-medium">{integration.health.uptime}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Response:</span>
                        <div className="font-medium">{integration.health.responseTime}ms</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Errors:</span>
                        <div className="font-medium">{integration.health.errorRate}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Throughput:</span>
                        <div className="font-medium">{integration.health.throughput}/h</div>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="text-muted-foreground">Last Sync:</span>
                      <div className="font-medium">{integration.lastSync.toLocaleString()}</div>
                    </div>

                    {integration.lastError && (
                      <Alert className="py-2">
                        <AlertTriangle className="h-3 w-3" />
                        <AlertDescription className="text-xs">
                          {integration.lastError}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center justify-between">
                      <Switch
                        checked={integration.enabled}
                        onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                      />
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => testIntegration(integration.id)}
                          disabled={testingIntegration === integration.id}
                        >
                          {testingIntegration === integration.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <TestTube className="h-3 w-3" />
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => syncIntegration(integration.id)}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedIntegration(integration.id)}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Available Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {template.icon}
                    <div>
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <CardDescription className="text-xs">{template.provider}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={
                      template.complexity === 'basic' ? 'secondary' :
                      template.complexity === 'intermediate' ? 'default' : 'destructive'
                    }>
                      {template.complexity}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{template.estimatedSetupTime}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-xs font-medium">Features:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{feature}</Badge>
                        ))}
                        {template.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{template.features.length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => installIntegration(template.id)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Install
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Real-time performance monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.filter(i => i.enabled).map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(integration.type)}
                        <div>
                          <div className="font-medium text-sm">{integration.name}</div>
                          <div className="text-xs text-muted-foreground">{integration.provider}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{integration.health.responseTime}ms</div>
                        <div className="text-xs text-muted-foreground">{integration.health.uptime}% uptime</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
                <CardDescription>Security and compliance monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="text-sm">SSL Certificates</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{systemHealth?.security.sslCertificates} Valid</div>
                      <div className="text-xs text-muted-foreground">{systemHealth?.security.expiringSoon} expiring soon</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Security Issues</span>
                    </div>
                    <Badge variant={systemHealth?.security.securityIssues === 0 ? "secondary" : "destructive"}>
                      {systemHealth?.security.securityIssues}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Compliance Status</span>
                    </div>
                    <Badge variant="secondary">{systemHealth?.security.complianceStatus}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Connection Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <div className="space-y-4">
            {connectionLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.severity === 'critical' ? 'bg-red-600' :
                        log.severity === 'error' ? 'bg-red-500' :
                        log.severity === 'warning' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm capitalize">{log.event}</span>
                          <Badge variant="outline" className="text-xs">{log.severity}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {integrations.find(i => i.id === log.integrationId)?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleString()}
                        {log.duration && ` (${log.duration}s)`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Global Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Default Settings</CardTitle>
                <CardDescription>Global configuration for all integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Default Timeout (seconds)</Label>
                  <Input id="timeout" type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retry">Retry Attempts</Label>
                  <Input id="retry" type="number" defaultValue="3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                  <Input id="sync-interval" type="number" defaultValue="15" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-retry" defaultChecked />
                  <Label htmlFor="auto-retry">Enable automatic retry on failures</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="health-monitoring" defaultChecked />
                  <Label htmlFor="health-monitoring">Enable health monitoring</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Security and compliance configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="ssl-required" defaultChecked />
                  <Label htmlFor="ssl-required">Require SSL/TLS for all connections</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="cert-validation" defaultChecked />
                  <Label htmlFor="cert-validation">Validate SSL certificates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="audit-logging" defaultChecked />
                  <Label htmlFor="audit-logging">Enable comprehensive audit logging</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-retention">Log Retention (days)</Label>
                  <Input id="log-retention" type="number" defaultValue="90" />
                </div>
                <Button className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Update Security Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnterpriseIntegrationHub;
