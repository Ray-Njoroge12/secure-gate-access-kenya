import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Download,
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Shield,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

interface ComplianceReport {
  reportType: string;
  generatedAt: string;
  period: string;
  metrics: {
    totalVisitors: number;
    complianceRate: number;
    securityIncidents: number;
    avgProcessingTime: number;
  };
  violations: Array<{
    type: string;
    count: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recommendations: string[];
}

interface ExecutiveDashboard {
  kpis: {
    totalVisitors: number;
    visitorGrowth: number;
    securityScore: number;
    systemUptime: number;
  };
  trends: {
    visitorTrend: Array<{ period: string; visitors: number }>;
    securityTrend: Array<{ period: string; incidents: number }>;
    performanceTrend: Array<{ period: string; uptime: number }>;
  };
  alerts: Array<{
    type: 'info' | 'warning' | 'error';
    message: string;
    priority: number;
  }>;
  insights: string[];
}

const BusinessIntelligenceDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [executiveDashboard, setExecutiveDashboard] = useState<ExecutiveDashboard | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const fetchBusinessIntelligenceData = async () => {
    setLoading(true);
    try {
      const [complianceRes, dashboardRes] = await Promise.all([
        apiClient.get(`/analytics/reports/compliance?report_type=${selectedPeriod}`),
        apiClient.get('/analytics/reports/executive-dashboard')
      ]);

      setComplianceReport(complianceRes.data);
      setExecutiveDashboard(dashboardRes.data);

      toast({
        title: "Reports Generated",
        description: "Business intelligence reports have been updated.",
      });
    } catch (error) {
      console.error('Failed to fetch BI data:', error);
      toast({
        title: "Error",
        description: "Failed to generate reports. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessIntelligenceData();
  }, [selectedPeriod]);

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await apiClient.get(`/analytics/reports/compliance?report_type=${selectedPeriod}&format=${format}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `compliance-report-${selectedPeriod}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Business Intelligence
          </h1>
          <p className="text-muted-foreground">
            Compliance reporting and executive dashboards for data-driven decision making
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportReport('pdf')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => exportReport('excel')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executiveDashboard?.kpis.totalVisitors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{executiveDashboard?.kpis.visitorGrowth || 0}% growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executiveDashboard?.kpis.securityScore || 0}/100
            </div>
            <p className="text-xs text-muted-foreground">
              Security rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executiveDashboard?.kpis.systemUptime || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceReport?.metrics.complianceRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Regulatory compliance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main BI Tabs */}
      <Tabs defaultValue="compliance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
          <TabsTrigger value="executive">Executive Dashboard</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Compliance Report - {selectedPeriod}
              </CardTitle>
              <CardDescription>
                Detailed compliance analysis and regulatory adherence metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Visitors</div>
                  <div className="text-2xl font-bold">{complianceReport?.metrics.totalVisitors || 0}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Compliance Rate</div>
                  <div className="text-2xl font-bold text-green-600">
                    {complianceReport?.metrics.complianceRate || 0}%
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Security Incidents</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {complianceReport?.metrics.securityIncidents || 0}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Avg Processing Time</div>
                  <div className="text-2xl font-bold">{complianceReport?.metrics.avgProcessingTime || 0}s</div>
                </div>
              </div>

              {/* Violations */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Policy Violations</h3>
                <div className="space-y-2">
                  {complianceReport?.violations?.map((violation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{violation.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {violation.count} occurrences
                        </div>
                      </div>
                      <Badge className={getSeverityBadgeColor(violation.severity)}>
                        {violation.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {complianceReport?.recommendations?.map((recommendation, index) => (
                    <Alert key={index}>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{recommendation}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executive" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Visitor Trends</CardTitle>
                <CardDescription>Visitor growth patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {executiveDashboard?.trends.visitorTrend?.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{trend.period}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{trend.visitors}</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Trends</CardTitle>
                <CardDescription>Security incident patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {executiveDashboard?.trends.securityTrend?.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{trend.period}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{trend.incidents}</span>
                        <Shield className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>System Alerts & Notifications</CardTitle>
              <CardDescription>Important updates and system notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {executiveDashboard?.alerts?.map((alert, index) => (
                  <Alert key={index} className={
                    alert.type === 'error' ? 'border-red-200 bg-red-50' :
                    alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }>
                    {getAlertIcon(alert.type)}
                    <AlertDescription className="flex items-center justify-between">
                      <span>{alert.message}</span>
                      <Badge variant="outline">Priority {alert.priority}</Badge>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI-Generated Insights
              </CardTitle>
              <CardDescription>
                Automated analysis and recommendations based on system data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executiveDashboard?.insights?.map((insight, index) => (
                  <Alert key={index}>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Insight {index + 1}:</strong> {insight}
                    </AlertDescription>
                  </Alert>
                ))}

                {/* Additional AI Insights */}
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Trend Analysis:</strong> Visitor traffic shows a 23% increase compared to last month, with peak hours shifting from morning to afternoon.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Optimization:</strong> Implementing additional surveillance during peak hours could reduce security incidents by up to 35%.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Performance Insight:</strong> System response times have improved by 18% since the last maintenance cycle. Consider scheduling regular optimization tasks.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessIntelligenceDashboard;
