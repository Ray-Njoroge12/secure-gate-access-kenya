import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/apiClient";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Activity,
  Users,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  visitorStats: {
    totalVisitors: number;
    totalVisits: number;
    uniqueVisitors: number;
    averageVisitDuration: string;
    peakHour: number;
    trends: {
      daily_trends: Array<{ date: string; count: number }>;
    };
  };
  securityStats: {
    totalAccessAttempts: number;
    successfulAccess: number;
    failedAccess: number;
    securityIncidents: number;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    recentAlerts: Array<{
      type: string;
      timestamp: string;
      details: any;
    }>;
  };
  performanceMetrics: {
    responseTime: number;
    uptime: number;
    errorRate: number;
    activeUsers: number;
  };
  predictions: {
    expectedVisitors: number;
    resourceNeeds: string;
    maintenanceAlerts: Array<string>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // TODO: Replace with FastAPI analytics endpoints
      // const visitorResponse = await apiClient.getVisitorAnalytics(dateRange.start, dateRange.end);
      // const visitorData = visitorResponse.data;
      const visitorData = []; // Placeholder until FastAPI endpoint is implemented
      const visitorError = null;

      // TODO: Replace with FastAPI analytics endpoints
      // const securityResponse = await apiClient.getSecurityAnalytics(dateRange.start, dateRange.end);
      // const securityData = securityResponse.data;
      const securityData = []; // Placeholder until FastAPI endpoint is implemented
      const securityError = null;

      // TODO: Replace with FastAPI analytics endpoints
      // const performanceResponse = await apiClient.getPerformanceMetrics(dateRange.start, dateRange.end);
      // const performanceData = performanceResponse.data;
      const performanceData = []; // Placeholder until FastAPI endpoint is implemented
      const performanceError = null;

      // Process performance data
      const processedPerformance = {
        responseTime: performanceData
          .filter(m => m.metric_type === 'response_time')
          .reduce((avg, m, _, arr) => avg + m.metric_value / arr.length, 0),
        uptime: performanceData
          .filter(m => m.metric_type === 'uptime')
          .reduce((avg, m, _, arr) => avg + m.metric_value / arr.length, 0),
        errorRate: performanceData
          .filter(m => m.metric_type === 'error_rate')
          .reduce((avg, m, _, arr) => avg + m.metric_value / arr.length, 0),
        activeUsers: performanceData
          .filter(m => m.metric_type === 'active_users')
          .reduce((max, m) => Math.max(max, m.metric_value), 0)
      };

      // Mock predictions for now (to be replaced with actual ML predictions)
      const predictions = {
        expectedVisitors: Math.ceil((visitorData[0]?.total_visitors || 0) * 1.15),
        resourceNeeds: 'Normal',
        maintenanceAlerts: []
      };

      setAnalyticsData({
        visitorStats: {
          totalVisitors: visitorData[0]?.total_visitors || 0,
          totalVisits: visitorData[0]?.total_visits || 0,
          uniqueVisitors: visitorData[0]?.unique_visitors || 0,
          averageVisitDuration: visitorData[0]?.average_visit_duration || '0 minutes',
          peakHour: visitorData[0]?.peak_hour || 9,
          trends: visitorData[0]?.trends || { daily_trends: [] }
        },
        securityStats: {
          totalAccessAttempts: securityData[0]?.total_access_attempts || 0,
          successfulAccess: securityData[0]?.successful_access || 0,
          failedAccess: securityData[0]?.failed_access || 0,
          securityIncidents: securityData[0]?.security_incidents || 0,
          threatLevel: securityData[0]?.threat_level || 'LOW',
          recentAlerts: securityData[0]?.recent_alerts || []
        },
        performanceMetrics: processedPerformance,
        predictions
      });

    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
  };

  const exportReport = async () => {
    try {
      toast({
        title: "Exporting Report",
        description: "Generating analytics report...",
      });

      // Create a comprehensive report
      const reportData = {
        generated_at: new Date().toISOString(),
        period: { start: dateRange.start, end: dateRange.end },
        analytics: analyticsData
      };

      // Convert to CSV or trigger download
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${dateRange.start}-to-${dateRange.end}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: "Analytics report has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analytics report",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'warning';
      default: return 'default';
    }
  };

  const formatDuration = (duration: string) => {
    // Parse duration and format nicely
    return duration.replace(/(\d+):(\d+):(\d+)/, '$1h $2m');
  };

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive system analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="ml-2 px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="ml-2 px-3 py-1 border rounded"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.visitorStats.totalVisitors}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData?.visitorStats.uniqueVisitors} unique visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={getThreatLevelColor(analyticsData?.securityStats.threatLevel || 'LOW')}>
                {analyticsData?.securityStats.threatLevel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData?.securityStats.securityIncidents} incidents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.securityStats.totalAccessAttempts > 0
                ? Math.round((analyticsData.securityStats.successfulAccess / analyticsData.securityStats.totalAccessAttempts) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData?.securityStats.successfulAccess} / {analyticsData?.securityStats.totalAccessAttempts} attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Visit Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(analyticsData?.visitorStats.averageVisitDuration || '0:00:00')}
            </div>
            <p className="text-xs text-muted-foreground">
              Peak hour: {analyticsData?.visitorStats.peakHour}:00
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <Tabs defaultValue="visitors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visitors">Visitor Analytics</TabsTrigger>
          <TabsTrigger value="security">Security Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="visitors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visitor Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Visitor Trends</CardTitle>
                <CardDescription>Visitor count over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData?.visitorStats.trends.daily_trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Visitor Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Visitor Breakdown</CardTitle>
                <CardDescription>Total vs Unique vs Return visitors</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Unique Visitors', value: analyticsData?.visitorStats.uniqueVisitors || 0 },
                        { name: 'Return Visits', value: (analyticsData?.visitorStats.totalVisits || 0) - (analyticsData?.visitorStats.uniqueVisitors || 0) }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Access Attempts Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Access Attempts</CardTitle>
                <CardDescription>Successful vs Failed access attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: 'Access Attempts',
                        successful: analyticsData?.securityStats.successfulAccess || 0,
                        failed: analyticsData?.securityStats.failedAccess || 0
                      }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="successful" fill="#00C49F" />
                    <Bar dataKey="failed" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Security Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Alerts</CardTitle>
                <CardDescription>Latest security events and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {analyticsData?.securityStats.recentAlerts.length ? (
                    analyticsData.securityStats.recentAlerts.map((alert, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">{alert.type}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                          {alert.details && (
                            <div className="text-xs text-gray-500 mt-1">
                              {JSON.stringify(alert.details)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No recent security alerts</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Response Time</span>
                  <span className="font-mono">{analyticsData?.performanceMetrics.responseTime.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>System Uptime</span>
                  <span className="font-mono">{analyticsData?.performanceMetrics.uptime.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Error Rate</span>
                  <span className="font-mono">{analyticsData?.performanceMetrics.errorRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Active Users</span>
                  <span className="font-mono">{analyticsData?.performanceMetrics.activeUsers}</span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>System performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Performance trend chart coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visitor Predictions */}
            <Card>
              <CardHeader>
                <CardTitle>Predictive Analytics</CardTitle>
                <CardDescription>AI-powered insights and forecasts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Expected Visitors (Next Period)</span>
                  <span className="font-mono text-blue-600">
                    {analyticsData?.predictions.expectedVisitors}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Resource Requirements</span>
                  <Badge variant="outline">{analyticsData?.predictions.resourceNeeds}</Badge>
                </div>
                <div>
                  <span className="block mb-2">Maintenance Alerts</span>
                  {analyticsData?.predictions.maintenanceAlerts.length ? (
                    analyticsData.predictions.maintenanceAlerts.map((alert, index) => (
                      <div key={index} className="text-sm bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                        {alert}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No maintenance alerts</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>Machine learning recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>AI insights engine coming soon</p>
                  <p className="text-xs mt-2">Advanced pattern recognition and recommendations</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
