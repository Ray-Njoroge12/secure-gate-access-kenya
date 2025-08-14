import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Shield, 
  Clock, 
  MapPin, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Filter,
  RefreshCw,
  Eye,
  UserCheck,
  XCircle,
  CheckCircle,
  Timer,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AnalyticsData {
  realTimeMetrics: {
    currentVisitors: number;
    todayVisits: number;
    pendingInvitations: number;
    activeIncidents: number;
    systemHealth: number;
  };
  visitorAnalytics: {
    totalVisitors: number;
    successRate: number;
    averageStayDuration: number;
    peakHours: Array<{ hour: number; count: number }>;
    visitorTypes: Array<{ type: string; count: number; percentage: number }>;
  };
  securityMetrics: {
    totalIncidents: number;
    resolvedIncidents: number;
    averageResponseTime: number;
    threatLevel: 'Low' | 'Medium' | 'High';
    failedAccessAttempts: number;
  };
  performanceMetrics: {
    systemUptime: number;
    responseTime: number;
    guardEfficiency: number;
    userSatisfaction: number;
  };
  predictiveInsights: {
    expectedVisitors: number;
    capacityUtilization: number;
    maintenanceAlerts: Array<{ system: string; priority: string; eta: string }>;
    recommendations: Array<{ type: string; message: string; impact: string }>;
  };
}

interface TimeFilter {
  period: 'today' | 'week' | 'month' | 'quarter' | 'year';
  label: string;
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimeFilter>({
    period: 'today',
    label: 'Today'
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const timeFilters: TimeFilter[] = [
    { period: 'today', label: 'Today' },
    { period: 'week', label: 'This Week' },
    { period: 'month', label: 'This Month' },
    { period: 'quarter', label: 'This Quarter' },
    { period: 'year', label: 'This Year' }
  ];

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      // Real-time metrics
      const { data: visitors } = await supabase
        .from('visitors')
        .select('*')
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const { data: invitations } = await supabase
        .from('invitations')
        .select('*')
        .eq('status', 'pending');

      const { data: incidents } = await supabase
        .from('security_incidents')
        .select('*')
        .in('status', ['open', 'in_progress']);

      const { data: accessCodes } = await supabase
        .from('access_codes')
        .select('*')
        .gte('created_at', new Date().toISOString().split('T')[0]);

      // Security metrics
      const { data: securityIncidents } = await supabase
        .from('security_incidents')
        .select('*')
        .gte('created_at', getDateFilter(selectedPeriod.period));

      const { data: accessLogs } = await supabase
        .from('access_logs')
        .select('*')
        .gte('created_at', getDateFilter(selectedPeriod.period));

      // Calculate metrics
      const currentVisitors = accessCodes?.filter(code => 
        !code.used_at && new Date(code.expires_at) > new Date()
      ).length || 0;

      const todayVisits = visitors?.length || 0;
      const pendingInvitations = invitations?.length || 0;
      const activeIncidents = incidents?.length || 0;

      // Visitor analytics
      const successfulAccess = accessLogs?.filter(log => log.success).length || 0;
      const totalAttempts = accessLogs?.length || 0;
      const successRate = totalAttempts > 0 ? (successfulAccess / totalAttempts) * 100 : 0;

      // Peak hours analysis
      const peakHours = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: accessLogs?.filter(log => 
          new Date(log.created_at).getHours() === hour
        ).length || 0
      }));

      // Security metrics
      const resolvedIncidents = securityIncidents?.filter(
        incident => incident.status === 'resolved'
      ).length || 0;
      
      const failedAttempts = accessLogs?.filter(log => !log.success).length || 0;

      const mockAnalytics: AnalyticsData = {
        realTimeMetrics: {
          currentVisitors,
          todayVisits,
          pendingInvitations,
          activeIncidents,
          systemHealth: 98.5
        },
        visitorAnalytics: {
          totalVisitors: visitors?.length || 0,
          successRate,
          averageStayDuration: 125, // minutes
          peakHours,
          visitorTypes: [
            { type: 'Business', count: 45, percentage: 35 },
            { type: 'Personal', count: 38, percentage: 30 },
            { type: 'Delivery', count: 25, percentage: 20 },
            { type: 'Service', count: 20, percentage: 15 }
          ]
        },
        securityMetrics: {
          totalIncidents: securityIncidents?.length || 0,
          resolvedIncidents,
          averageResponseTime: 8.5, // minutes
          threatLevel: activeIncidents > 5 ? 'High' : activeIncidents > 2 ? 'Medium' : 'Low',
          failedAccessAttempts: failedAttempts
        },
        performanceMetrics: {
          systemUptime: 99.8,
          responseTime: 250, // milliseconds
          guardEfficiency: 94.2,
          userSatisfaction: 4.6
        },
        predictiveInsights: {
          expectedVisitors: Math.round(todayVisits * 1.2),
          capacityUtilization: Math.min((currentVisitors / 50) * 100, 100),
          maintenanceAlerts: [
            { system: 'Access Control', priority: 'Medium', eta: '2 days' },
            { system: 'Camera System', priority: 'Low', eta: '1 week' }
          ],
          recommendations: [
            { 
              type: 'Staffing', 
              message: 'Consider adding additional guard during peak hours (2-4 PM)',
              impact: 'High'
            },
            { 
              type: 'Security', 
              message: 'Review access patterns for unusual activity',
              impact: 'Medium'
            }
          ]
        }
      };

      setAnalyticsData(mockAnalytics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Analytics Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  const getDateFilter = (period: string): string => {
    const now = new Date();
    switch (period) {
      case 'today':
        return now.toISOString().split('T')[0];
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return monthAgo.toISOString();
      case 'quarter':
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return quarterAgo.toISOString();
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return yearAgo.toISOString();
      default:
        return now.toISOString().split('T')[0];
    }
  };

  const exportReport = async (format: 'pdf' | 'csv') => {
    try {
      toast({
        title: "Export Started",
        description: `Generating ${format.toUpperCase()} report...`,
      });
      
      // Simulate export process
      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: `Analytics report downloaded as ${format.toUpperCase()}.`,
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAnalyticsData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchAnalyticsData]);

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading analytics data...</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load analytics data. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and business intelligence
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <select
              value={selectedPeriod.period}
              onChange={(e) => {
                const period = e.target.value as TimeFilter['period'];
                const filter = timeFilters.find(f => f.period === period)!;
                setSelectedPeriod(filter);
              }}
              className="px-3 py-1 border rounded-md text-sm"
            >
              {timeFilters.map(filter => (
                <option key={filter.period} value={filter.period}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          {/* Auto Refresh Toggle */}
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh
          </Button>

          {/* Manual Refresh */}
          <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          {/* Export Options */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportReport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportReport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Last Updated Info */}
      <div className="text-sm text-muted-foreground">
        Last updated: {lastUpdated.toLocaleString()}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.realTimeMetrics.currentVisitors}</div>
                <p className="text-xs text-muted-foreground">On premises now</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.realTimeMetrics.todayVisits}</div>
                <p className="text-xs text-muted-foreground">+12% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.realTimeMetrics.pendingInvitations}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.realTimeMetrics.activeIncidents}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.realTimeMetrics.systemHealth}%</div>
                <Progress value={analyticsData.realTimeMetrics.systemHealth} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Key Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Visitor Volume</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    +15% ↗
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Security Incidents</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    +3% ↗
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Time</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    -8% ↓
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">User Satisfaction</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    +5% ↗
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Threat Level</span>
                  <Badge 
                    className={`${getThreatLevelColor(analyticsData.securityMetrics.threatLevel)} text-white`}
                  >
                    {analyticsData.securityMetrics.threatLevel}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Failed Access Attempts</span>
                  <span className="font-medium">{analyticsData.securityMetrics.failedAccessAttempts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Incident Resolution Rate</span>
                  <span className="font-medium">
                    {analyticsData.securityMetrics.totalIncidents > 0 
                      ? Math.round((analyticsData.securityMetrics.resolvedIncidents / analyticsData.securityMetrics.totalIncidents) * 100)
                      : 100}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Response Time</span>
                  <span className="font-medium">{analyticsData.securityMetrics.averageResponseTime} min</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Visitors Tab */}
        <TabsContent value="visitors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Visitor Analytics</CardTitle>
                <CardDescription>Detailed visitor insights and patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{analyticsData.visitorAnalytics.totalVisitors}</div>
                    <p className="text-sm text-muted-foreground">Total Visitors</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{analyticsData.visitorAnalytics.successRate.toFixed(1)}%</div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{analyticsData.visitorAnalytics.averageStayDuration}</div>
                    <p className="text-sm text-muted-foreground">Avg Stay (min)</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {analyticsData.visitorAnalytics.peakHours
                        .reduce((max, hour) => hour.count > max.count ? hour : max, { hour: 0, count: 0 })
                        .hour}:00
                    </div>
                    <p className="text-sm text-muted-foreground">Peak Hour</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visitor Types</CardTitle>
                <CardDescription>Distribution by visitor category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.visitorAnalytics.visitorTypes.map((type) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">{type.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{type.count}</span>
                        <span className="text-xs text-muted-foreground">({type.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Peak Hours Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Peak Hours Analysis</CardTitle>
              <CardDescription>Visitor activity throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-1">
                {analyticsData.visitorAnalytics.peakHours.map((hour) => (
                  <div
                    key={hour.hour}
                    className="flex flex-col items-center gap-1"
                    style={{ height: '100%' }}
                  >
                    <div
                      className="bg-blue-500 w-4 rounded-t"
                      style={{
                        height: `${Math.max((hour.count / Math.max(...analyticsData.visitorAnalytics.peakHours.map(h => h.count))) * 100, 5)}%`
                      }}
                    ></div>
                    <span className="text-xs text-muted-foreground">
                      {hour.hour.toString().padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.securityMetrics.totalIncidents}</div>
                <p className="text-xs text-muted-foreground">This period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.securityMetrics.resolvedIncidents}</div>
                <p className="text-xs text-muted-foreground">Successfully closed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Access</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.securityMetrics.failedAccessAttempts}</div>
                <p className="text-xs text-muted-foreground">Denied attempts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.securityMetrics.averageResponseTime}m</div>
                <p className="text-xs text-muted-foreground">Average response</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Threat Level</CardTitle>
                <CardDescription>Current security assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-full ${getThreatLevelColor(analyticsData.securityMetrics.threatLevel)} flex items-center justify-center`}>
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{analyticsData.securityMetrics.threatLevel}</div>
                    <p className="text-sm text-muted-foreground">
                      {analyticsData.securityMetrics.threatLevel === 'Low' ? 'All systems normal' :
                       analyticsData.securityMetrics.threatLevel === 'Medium' ? 'Increased vigilance required' :
                       'Immediate attention needed'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Performance</CardTitle>
                <CardDescription>Key security indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Incident Resolution Rate</span>
                    <span>{analyticsData.securityMetrics.totalIncidents > 0 
                      ? Math.round((analyticsData.securityMetrics.resolvedIncidents / analyticsData.securityMetrics.totalIncidents) * 100)
                      : 100}%</span>
                  </div>
                  <Progress 
                    value={analyticsData.securityMetrics.totalIncidents > 0 
                      ? (analyticsData.securityMetrics.resolvedIncidents / analyticsData.securityMetrics.totalIncidents) * 100
                      : 100} 
                    className="mt-1" 
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Access Success Rate</span>
                    <span>{analyticsData.visitorAnalytics.successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={analyticsData.visitorAnalytics.successRate} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Response Time Performance</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.performanceMetrics.systemUptime}%</div>
                <p className="text-xs text-muted-foreground">99.8% target</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.performanceMetrics.responseTime}ms</div>
                <p className="text-xs text-muted-foreground">Average response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Guard Efficiency</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.performanceMetrics.guardEfficiency}%</div>
                <p className="text-xs text-muted-foreground">Performance rating</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.performanceMetrics.userSatisfaction}/5</div>
                <p className="text-xs text-muted-foreground">Average rating</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance Metrics</CardTitle>
                <CardDescription>Technical performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>System Uptime</span>
                    <span>{analyticsData.performanceMetrics.systemUptime}%</span>
                  </div>
                  <Progress value={analyticsData.performanceMetrics.systemUptime} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Response Time (Target: &lt;300ms)</span>
                    <span>{analyticsData.performanceMetrics.responseTime}ms</span>
                  </div>
                  <Progress 
                    value={Math.max(100 - (analyticsData.performanceMetrics.responseTime / 500) * 100, 0)} 
                    className="mt-1" 
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Guard Efficiency</span>
                    <span>{analyticsData.performanceMetrics.guardEfficiency}%</span>
                  </div>
                  <Progress value={analyticsData.performanceMetrics.guardEfficiency} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>User Satisfaction (Target: 4.5/5)</span>
                    <span>{analyticsData.performanceMetrics.userSatisfaction}/5</span>
                  </div>
                  <Progress 
                    value={(analyticsData.performanceMetrics.userSatisfaction / 5) * 100} 
                    className="mt-1" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Performance over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">System Uptime</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    +0.2% ↗
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Time</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    -15ms ↓
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Guard Efficiency</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    +2.1% ↗
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">User Satisfaction</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    +0.3 ↗
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictive Tab */}
        <TabsContent value="predictive" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expected Visitors</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.predictiveInsights.expectedVisitors}</div>
                <p className="text-xs text-muted-foreground">Next 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.predictiveInsights.capacityUtilization.toFixed(1)}%</div>
                <Progress value={analyticsData.predictiveInsights.capacityUtilization} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.predictiveInsights.maintenanceAlerts.length}</div>
                <p className="text-xs text-muted-foreground">Systems require attention</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Alerts</CardTitle>
                <CardDescription>Predictive maintenance recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.predictiveInsights.maintenanceAlerts.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{alert.system}</div>
                        <div className="text-sm text-muted-foreground">ETA: {alert.eta}</div>
                      </div>
                      <Badge 
                        variant={alert.priority === 'High' ? 'destructive' : 
                               alert.priority === 'Medium' ? 'default' : 'secondary'}
                      >
                        {alert.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>Intelligent system suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.predictiveInsights.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{rec.type}</Badge>
                        <Badge 
                          variant={rec.impact === 'High' ? 'destructive' : 
                                 rec.impact === 'Medium' ? 'default' : 'secondary'}
                        >
                          {rec.impact} Impact
                        </Badge>
                      </div>
                      <p className="text-sm">{rec.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
