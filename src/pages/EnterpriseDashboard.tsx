import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Activity, 
  Users, 
  Key, 
  Webhook, 
  BarChart3, 
  Globe, 
  Shield, 
  Cloud,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Network,
  MessageSquare,
  Mail,
  Phone
} from 'lucide-react';
import EnterpriseAPIPortal from '@/components/EnterpriseAPIPortal';
import ThirdPartyIntegrations from '@/components/ThirdPartyIntegrations';

interface DashboardMetrics {
  totalLocations: number;
  activeIntegrations: number;
  apiRequests: {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
  };
  visitors: {
    total: number;
    active: number;
    verified: number;
    pending: number;
  };
  systemHealth: {
    api: 'healthy' | 'degraded' | 'down';
    database: 'healthy' | 'degraded' | 'down';
    integrations: 'healthy' | 'degraded' | 'down';
    webhooks: 'healthy' | 'degraded' | 'down';
  };
  realTimeStats: {
    concurrentVisitors: number;
    activeAccessCodes: number;
    webhookDeliveries: number;
    apiCallsPerMinute: number;
  };
}

interface LocationStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  visitors: number;
  lastActivity: string;
  apiHealth: number;
  integrationStatus: string;
}

const EnterpriseDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [locations, setLocations] = useState<LocationStatus[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simulate loading enterprise metrics
      setMetrics({
        totalLocations: 8,
        activeIntegrations: 6,
        apiRequests: {
          total: 15420,
          successful: 14891,
          failed: 529,
          avgResponseTime: 142
        },
        visitors: {
          total: 1247,
          active: 23,
          verified: 1156,
          pending: 68
        },
        systemHealth: {
          api: 'healthy',
          database: 'healthy',
          integrations: 'degraded',
          webhooks: 'healthy'
        },
        realTimeStats: {
          concurrentVisitors: 23,
          activeAccessCodes: 156,
          webhookDeliveries: 89,
          apiCallsPerMinute: 24
        }
      });

      setLocations([
        {
          id: '1',
          name: 'Main Gate - Nairobi',
          status: 'online',
          visitors: 45,
          lastActivity: new Date().toISOString(),
          apiHealth: 98,
          integrationStatus: 'All Connected'
        },
        {
          id: '2',
          name: 'Secondary Gate - Nairobi',
          status: 'online',
          visitors: 23,
          lastActivity: new Date(Date.now() - 300000).toISOString(),
          apiHealth: 95,
          integrationStatus: 'WhatsApp Pending'
        },
        {
          id: '3',
          name: 'Mombasa Office',
          status: 'online',
          visitors: 12,
          lastActivity: new Date(Date.now() - 600000).toISOString(),
          apiHealth: 92,
          integrationStatus: 'All Connected'
        },
        {
          id: '4',
          name: 'Kisumu Branch',
          status: 'maintenance',
          visitors: 0,
          lastActivity: new Date(Date.now() - 3600000).toISOString(),
          apiHealth: 0,
          integrationStatus: 'Maintenance Mode'
        }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 95) return 'text-green-600';
    if (health >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your multi-location secure gate access system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Phase 8 - Enterprise
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="api-portal" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Portal
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {metrics && (
            <>
              {/* Real-time metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.realTimeStats.concurrentVisitors}</div>
                    <p className="text-xs text-muted-foreground">
                      Currently on premises
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">API Calls/Min</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.realTimeStats.apiCallsPerMinute}</div>
                    <p className="text-xs text-muted-foreground">
                      Real-time traffic
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{locations.filter(l => l.status === 'online').length}</div>
                    <p className="text-xs text-muted-foreground">
                      of {metrics.totalLocations} total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Integrations</CardTitle>
                    <Cloud className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.activeIntegrations}</div>
                    <p className="text-xs text-muted-foreground">
                      Connected services
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    System Health
                  </CardTitle>
                  <CardDescription>
                    Real-time system component status monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">API Gateway</span>
                        {getStatusIcon(metrics.systemHealth.api)}
                      </div>
                      <Progress value={95} className="h-2" />
                      <p className="text-xs text-muted-foreground">95% uptime</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Database</span>
                        {getStatusIcon(metrics.systemHealth.database)}
                      </div>
                      <Progress value={98} className="h-2" />
                      <p className="text-xs text-muted-foreground">98% uptime</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Integrations</span>
                        {getStatusIcon(metrics.systemHealth.integrations)}
                      </div>
                      <Progress value={87} className="h-2" />
                      <p className="text-xs text-muted-foreground">87% uptime</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Webhooks</span>
                        {getStatusIcon(metrics.systemHealth.webhooks)}
                      </div>
                      <Progress value={92} className="h-2" />
                      <p className="text-xs text-muted-foreground">92% uptime</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* API Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      API Performance
                    </CardTitle>
                    <CardDescription>
                      Last 24 hours API metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">{metrics.apiRequests.total.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total Requests</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round((metrics.apiRequests.successful / metrics.apiRequests.total) * 100)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span>{Math.round((metrics.apiRequests.successful / metrics.apiRequests.total) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(metrics.apiRequests.successful / metrics.apiRequests.total) * 100} 
                        className="h-2" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Avg Response:</span> {metrics.apiRequests.avgResponseTime}ms
                      </div>
                      <div>
                        <span className="font-medium">Failed:</span> {metrics.apiRequests.failed}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Visitor Analytics
                    </CardTitle>
                    <CardDescription>
                      Current visitor management status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">{metrics.visitors.total}</div>
                        <p className="text-xs text-muted-foreground">Total Visitors</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{metrics.visitors.active}</div>
                        <p className="text-xs text-muted-foreground">Currently Active</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Verified</span>
                        <span>{metrics.visitors.verified}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pending</span>
                        <span>{metrics.visitors.pending}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Verification Rate</span>
                        <span>{Math.round((metrics.visitors.verified / metrics.visitors.total) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(metrics.visitors.verified / metrics.visitors.total) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common enterprise management tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <Key className="h-5 w-5" />
                      <span className="text-xs">Generate API Key</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <Webhook className="h-5 w-5" />
                      <span className="text-xs">Create Webhook</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <Building2 className="h-5 w-5" />
                      <span className="text-xs">Add Location</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <Cloud className="h-5 w-5" />
                      <span className="text-xs">Connect Service</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Location Status</h2>
            <Button>
              <Building2 className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>

          <div className="grid gap-4">
            {locations.map((location) => (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5" />
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {location.name}
                          {getStatusIcon(location.status)}
                        </CardTitle>
                        <CardDescription>
                          {location.visitors} active visitors • {location.integrationStatus}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={location.status === 'online' ? 'default' : 'secondary'}>
                        {location.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">API Health:</span>{' '}
                      <span className={getHealthColor(location.apiHealth)}>
                        {location.apiHealth}%
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Active Visitors:</span> {location.visitors}
                    </div>
                    <div>
                      <span className="font-medium">Last Activity:</span>{' '}
                      {new Date(location.lastActivity).toLocaleTimeString()}
                    </div>
                    <div>
                      <span className="font-medium">Integration:</span> {location.integrationStatus}
                    </div>
                  </div>
                  {location.status === 'maintenance' && (
                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This location is currently under maintenance. Access control is temporarily disabled.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api-portal">
          <EnterpriseAPIPortal />
        </TabsContent>

        <TabsContent value="integrations">
          <ThirdPartyIntegrations />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <h2 className="text-2xl font-semibold">System Monitoring</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Network Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Main Connection</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Backup Connection</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Load Balancer</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Communication Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">WhatsApp</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SMS Gateway</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Service</span>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhook Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Delivery Rate</span>
                    <span className="text-sm font-medium">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Delivered: 847</span>
                    <span>Failed: 53</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent System Events</CardTitle>
              <CardDescription>
                Latest system activities and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    time: '2 minutes ago', 
                    message: 'API endpoint /visitors responding normally', 
                    type: 'info',
                    icon: <CheckCircle className="h-4 w-4 text-green-500" />
                  },
                  { 
                    time: '5 minutes ago', 
                    message: 'WhatsApp integration reconnected successfully', 
                    type: 'success',
                    icon: <CheckCircle className="h-4 w-4 text-green-500" />
                  },
                  { 
                    time: '12 minutes ago', 
                    message: 'High API response time detected (avg: 850ms)', 
                    type: 'warning',
                    icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  },
                  { 
                    time: '18 minutes ago', 
                    message: 'Database backup completed successfully', 
                    type: 'info',
                    icon: <CheckCircle className="h-4 w-4 text-blue-500" />
                  },
                ].map((event, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    {event.icon}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{event.message}</p>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnterpriseDashboard;
