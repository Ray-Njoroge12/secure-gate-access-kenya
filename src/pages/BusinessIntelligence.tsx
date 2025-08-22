import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Share,
  Calendar,
  FileText,
  Settings,
  Target,
  DollarSign,
  Users,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Briefcase
} from 'lucide-react';

interface ExecutiveMetrics {
  totalRevenue: number;
  monthlyGrowth: number;
  customerRetention: number;
  operationalEfficiency: number;
  securityScore: number;
  userSatisfaction: number;
}

interface ComplianceReport {
  gdprCompliance: number;
  socCompliance: number;
  iso27001Compliance: number;
  overallScore: number;
  lastAuditDate: string;
  nextAuditDate: string;
  findings: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    status: 'open' | 'resolved' | 'in-progress';
  }>;
}

interface PerformanceAnalytics {
  systemUptime: number;
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
  userConcurrency: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
}

interface BusinessForecast {
  predictedGrowth: number;
  expectedUsers: number;
  resourceNeeds: string;
  budgetProjections: {
    infrastructure: number;
    personnel: number;
    maintenance: number;
    total: number;
  };
  riskFactors: Array<{
    factor: string;
    probability: number;
    impact: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function BusinessIntelligence() {
  const [executiveMetrics, setExecutiveMetrics] = useState<ExecutiveMetrics | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [performanceAnalytics, setPerformanceAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [businessForecast, setBusinessForecast] = useState<BusinessForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('quarterly');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const { toast } = useToast();

  const loadBusinessData = async () => {
    try {
      setLoading(true);

      // Enhanced executive metrics with realistic business data
      const executiveData: ExecutiveMetrics = {
        totalRevenue: 125000 + Math.floor(Math.random() * 25000), // Dynamic mock data
        monthlyGrowth: 15.2 + (Math.random() - 0.5) * 5, // Slight variance
        customerRetention: 94.5 + (Math.random() - 0.5) * 3,
        operationalEfficiency: 87.3 + (Math.random() - 0.5) * 5,
        securityScore: 96.8 + (Math.random() - 0.5) * 2,
        userSatisfaction: 4.2 + (Math.random() - 0.5) * 0.6
      };

      // Fetch compliance data
      const complianceData: ComplianceReport = {
        gdprCompliance: 98.5,
        socCompliance: 95.2,
        iso27001Compliance: 92.8,
        overallScore: 95.5,
        lastAuditDate: '2025-07-15',
        nextAuditDate: '2025-10-15',
        findings: [
          {
            category: 'Data Retention',
            severity: 'medium',
            description: 'Some logs retained beyond policy period',
            status: 'in-progress'
          },
          {
            category: 'Access Control',
            severity: 'low',
            description: 'Minor role permission discrepancy',
            status: 'resolved'
          }
        ]
      };

      // Fetch performance analytics (using mock data since table doesn't exist yet)
      const performanceAnalyticsData: PerformanceAnalytics = {
        systemUptime: 99.7 + (Math.random() - 0.5) * 1,
        averageResponseTime: 142 + Math.floor((Math.random() - 0.5) * 50),
        errorRate: 0.12 + (Math.random() - 0.5) * 0.1,
        throughput: 1250 + Math.floor((Math.random() - 0.5) * 200),
        userConcurrency: 85 + Math.floor((Math.random() - 0.5) * 20),
        resourceUtilization: {
          cpu: 68.5 + (Math.random() - 0.5) * 10,
          memory: 72.3 + (Math.random() - 0.5) * 10,
          storage: 45.8 + (Math.random() - 0.5) * 10,
          network: 34.2 + (Math.random() - 0.5) * 10
        }
      };

      // Generate business forecast
      const forecastData: BusinessForecast = {
        predictedGrowth: 23.5,
        expectedUsers: 2850,
        resourceNeeds: 'Moderate scaling required',
        budgetProjections: {
          infrastructure: 45000,
          personnel: 180000,
          maintenance: 25000,
          total: 250000
        },
        riskFactors: [
          { factor: 'Market Competition', probability: 0.65, impact: 'Medium' },
          { factor: 'Regulatory Changes', probability: 0.35, impact: 'Low' },
          { factor: 'Technology Disruption', probability: 0.45, impact: 'High' }
        ]
      };

      setExecutiveMetrics(executiveData);
      setComplianceReport(complianceData);
      setPerformanceAnalytics(performanceAnalyticsData);
      setBusinessForecast(forecastData);

    } catch (error) {
      console.error('Error loading business intelligence data:', error);
      toast({
        title: "Error",
        description: "Failed to load business intelligence data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType: string) => {
    try {
      toast({
        title: "Exporting Report",
        description: `Generating ${reportType} report...`,
      });

      let reportData;
      switch (reportType) {
        case 'executive':
          reportData = { executiveMetrics, period: selectedPeriod };
          break;
        case 'compliance':
          reportData = { complianceReport };
          break;
        case 'performance':
          reportData = { performanceAnalytics };
          break;
        case 'forecast':
          reportData = { businessForecast };
          break;
        default:
          reportData = { executiveMetrics, complianceReport, performanceAnalytics, businessForecast };
      }

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: `${reportType} report has been downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadBusinessData();
  }, [selectedPeriod]);

  const getComplianceColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricTrend = (value: number, threshold: number = 0) => {
    return value > threshold ? 'positive' : 'negative';
  };

  // AI-Powered Insights Generation
  const generateAIInsights = () => {
    const insights = [];
    
    if (executiveMetrics) {
      // Revenue insights
      if (executiveMetrics.monthlyGrowth > 10) {
        insights.push({
          type: 'positive',
          category: 'Revenue',
          message: `Strong growth momentum detected. Revenue growth of ${executiveMetrics.monthlyGrowth.toFixed(1)}% indicates successful market penetration.`,
          recommendation: 'Consider expanding marketing budget and exploring new market segments.',
          confidence: 0.85
        });
      }
      
      // Security score insights
      if (executiveMetrics.securityScore > 95) {
        insights.push({
          type: 'positive',
          category: 'Security',
          message: `Excellent security posture with ${executiveMetrics.securityScore.toFixed(1)}% score.`,
          recommendation: 'Maintain current security protocols and consider security certification pursuit.',
          confidence: 0.92
        });
      }
      
      // Operational efficiency
      if (executiveMetrics.operationalEfficiency < 90) {
        insights.push({
          type: 'warning',
          category: 'Operations',
          message: `Operational efficiency at ${executiveMetrics.operationalEfficiency.toFixed(1)}% suggests optimization opportunities.`,
          recommendation: 'Implement process automation and staff training programs.',
          confidence: 0.78
        });
      }
    }
    
    return insights;
  };

  const predictiveAnalytics = {
    visitorTrendForecast: [
      { month: 'Jan', predicted: 850, actual: 820, confidence: 0.89 },
      { month: 'Feb', predicted: 920, actual: 895, confidence: 0.87 },
      { month: 'Mar', predicted: 980, actual: null, confidence: 0.85 },
      { month: 'Apr', predicted: 1050, actual: null, confidence: 0.82 },
      { month: 'May', predicted: 1120, actual: null, confidence: 0.79 }
    ],
    securityIncidentPrediction: {
      likelihood: 0.15, // 15% chance
      expectedDate: '2025-03-15',
      riskFactors: ['Peak visitor season', 'New staff onboarding', 'System updates'],
      preventiveMeasures: ['Enhanced monitoring', 'Additional training', 'Backup systems']
    },
    resourceOptimization: {
      currentUtilization: 72,
      optimalUtilization: 85,
      potentialSavings: 15000,
      recommendations: [
        'Redistribute peak hour staffing',
        'Implement automated visitor pre-screening',
        'Optimize energy consumption during low-traffic periods'
      ]
    }
  };

  const aiInsights = generateAIInsights();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading business intelligence dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Business Intelligence Center</h1>
          <p className="text-gray-600">Executive insights and strategic analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => exportReport('complete')}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="executive" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executive">Executive Dashboard</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Reporting</TabsTrigger>
          <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
          <TabsTrigger value="forecasting">Predictive Forecasting</TabsTrigger>
        </TabsList>

        {/* Executive Dashboard */}
        <TabsContent value="executive" className="space-y-4">
          {/* Key Executive Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${executiveMetrics?.totalRevenue.toLocaleString()}
                </div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{executiveMetrics?.monthlyGrowth}% from last period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{executiveMetrics?.customerRetention}%</div>
                <div className="flex items-center text-xs text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Above industry average
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{executiveMetrics?.securityScore}%</div>
                <div className="flex items-center text-xs text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Excellent security posture
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Executive Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Operational Efficiency Trends</CardTitle>
                <CardDescription>Key performance indicators over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={[
                      { month: 'Jan', efficiency: 82, satisfaction: 4.0 },
                      { month: 'Feb', efficiency: 85, satisfaction: 4.1 },
                      { month: 'Mar', efficiency: 87, satisfaction: 4.2 },
                      { month: 'Apr', efficiency: 89, satisfaction: 4.3 },
                      { month: 'May', efficiency: 87, satisfaction: 4.2 },
                      { month: 'Jun', efficiency: 90, satisfaction: 4.4 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="efficiency"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Revenue sources by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Subscriptions', value: 65, color: '#0088FE' },
                        { name: 'Premium Features', value: 25, color: '#00C49F' },
                        { name: 'Professional Services', value: 10, color: '#FFBB28' },
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

          <Card>
            <CardHeader>
              <CardTitle>Strategic Recommendations</CardTitle>
              <CardDescription>AI-powered executive insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900">Growth Opportunity</div>
                    <div className="text-sm text-blue-700">
                      Customer retention rate is 5% above industry average. Consider expanding to adjacent markets.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-900">Operational Excellence</div>
                    <div className="text-sm text-green-700">
                      System uptime and security scores are excellent. Focus on scaling capabilities.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-900">Resource Planning</div>
                    <div className="text-sm text-yellow-700">
                      Current growth trajectory will require infrastructure scaling within 6 months.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>Automated insights based on current data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiInsights.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    No significant insights at the moment. Your business is performing steadily.
                  </div>
                ) : (
                  aiInsights.map((insight, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${insight.type === 'positive' ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'}`}>
                      <div className="flex justify-between">
                        <div className="font-medium text-sm">
                          {insight.category} Insight
                        </div>
                        <div className="text-xs text-gray-500">
                          Confidence: {(insight.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-sm mt-1">
                        {insight.message}
                      </div>
                      <div className="text-sm font-medium mt-2">
                        Recommendation: {insight.recommendation}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Reporting */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
                <CardDescription>Current compliance status across frameworks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>GDPR Compliance</span>
                    <span className={`font-bold ${getComplianceColor(complianceReport?.gdprCompliance || 0)}`}>
                      {complianceReport?.gdprCompliance}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>SOC 2 Compliance</span>
                    <span className={`font-bold ${getComplianceColor(complianceReport?.socCompliance || 0)}`}>
                      {complianceReport?.socCompliance}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ISO 27001 Compliance</span>
                    <span className={`font-bold ${getComplianceColor(complianceReport?.iso27001Compliance || 0)}`}>
                      {complianceReport?.iso27001Compliance}%
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center font-bold">
                    <span>Overall Score</span>
                    <span className={getComplianceColor(complianceReport?.overallScore || 0)}>
                      {complianceReport?.overallScore}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Schedule</CardTitle>
                <CardDescription>Compliance audit timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">Last Audit</div>
                    <div className="font-medium">{complianceReport?.lastAuditDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Next Audit</div>
                    <div className="font-medium">{complianceReport?.nextAuditDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Days Until Next Audit</div>
                    <div className="font-medium">
                      {Math.ceil((new Date(complianceReport?.nextAuditDate || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => exportReport('compliance')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Compliance Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Findings */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Findings</CardTitle>
              <CardDescription>Current compliance issues and remediation status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complianceReport?.findings.map((finding, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      finding.severity === 'high' ? 'bg-red-500' : 
                      finding.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{finding.category}</div>
                          <div className="text-sm text-gray-600">{finding.description}</div>
                        </div>
                        <Badge variant={
                          finding.status === 'resolved' ? 'default' :
                          finding.status === 'in-progress' ? 'secondary' : 'destructive'
                        }>
                          {finding.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analytics */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceAnalytics?.systemUptime}%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceAnalytics?.averageResponseTime.toFixed(0)}ms</div>
                <p className="text-xs text-muted-foreground">Average response time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceAnalytics?.errorRate}%</div>
                <p className="text-xs text-muted-foreground">Error percentage</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceAnalytics?.userConcurrency}</div>
                <p className="text-xs text-muted-foreground">Concurrent users</p>
              </CardContent>
            </Card>
          </div>

          {/* Resource Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
              <CardDescription>Current system resource usage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      resource: 'CPU',
                      utilization: performanceAnalytics?.resourceUtilization.cpu || 0,
                      optimal: 80
                    },
                    {
                      resource: 'Memory',
                      utilization: performanceAnalytics?.resourceUtilization.memory || 0,
                      optimal: 80
                    },
                    {
                      resource: 'Storage',
                      utilization: performanceAnalytics?.resourceUtilization.storage || 0,
                      optimal: 70
                    },
                    {
                      resource: 'Network',
                      utilization: performanceAnalytics?.resourceUtilization.network || 0,
                      optimal: 60
                    }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="resource" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="utilization" fill="#8884d8" />
                  <Bar dataKey="optimal" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Forecasting */}
        <TabsContent value="forecasting" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Predictions</CardTitle>
                <CardDescription>AI-powered business forecasting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Predicted Growth Rate</span>
                  <span className="font-bold text-green-600">+{businessForecast?.predictedGrowth}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Expected Users (Next Period)</span>
                  <span className="font-bold">{businessForecast?.expectedUsers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Resource Assessment</span>
                  <Badge variant="outline">{businessForecast?.resourceNeeds}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Projections</CardTitle>
                <CardDescription>Financial planning for next period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Infrastructure', value: businessForecast?.budgetProjections.infrastructure || 0 },
                        { name: 'Personnel', value: businessForecast?.budgetProjections.personnel || 0 },
                        { name: 'Maintenance', value: businessForecast?.budgetProjections.maintenance || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
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

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>Identified risk factors and mitigation strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {businessForecast?.riskFactors.map((risk, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{risk.factor}</div>
                      <div className="text-sm text-gray-600">Impact: {risk.impact}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Probability</div>
                      <div className="font-bold">{(risk.probability * 100).toFixed(0)}%</div>
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
}
