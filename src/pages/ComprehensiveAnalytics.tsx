import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Brain,
  FileText,
  TrendingUp,
  Shield,
  Activity,
  Users,
  Target
} from 'lucide-react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import PredictiveAnalyticsDashboard from '@/components/PredictiveAnalyticsDashboard';
import BusinessIntelligenceDashboard from '@/components/BusinessIntelligenceDashboard';

const ComprehensiveAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive Analytics</h1>
          <p className="text-muted-foreground">
            Advanced business intelligence, predictive analytics, and comprehensive reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Real-time
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            AI-Powered
          </Badge>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('overview')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Intelligence</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Advanced</div>
            <p className="text-xs text-muted-foreground">
              Compliance & Executive Reports
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('predictive')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictive Analytics</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AI-Driven</div>
            <p className="text-xs text-muted-foreground">
              Forecasting & Risk Assessment
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('security')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Analytics</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Real-time</div>
            <p className="text-xs text-muted-foreground">
              Threat Detection & Response
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('performance')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Optimized</div>
            <p className="text-xs text-muted-foreground">
              System Health & Metrics
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Business Intelligence
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Detailed Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <PredictiveAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <BusinessIntelligenceDashboard />
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Security Analytics</CardTitle>
                <CardDescription>
                  Deep-dive security analysis with machine learning insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">Anomaly Detection</div>
                      <div className="text-sm text-muted-foreground">AI-powered threat identification</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">Behavioral Analysis</div>
                      <div className="text-sm text-muted-foreground">Pattern recognition and risk scoring</div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">Predictive Security</div>
                      <div className="text-sm text-muted-foreground">Future threat forecasting</div>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Optimization</CardTitle>
                <CardDescription>
                  System performance analysis and optimization recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">Response Time Analysis</div>
                      <div className="text-sm text-muted-foreground">Average: 245ms (Target: &lt;200ms)</div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Needs Attention</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">Resource Utilization</div>
                      <div className="text-sm text-muted-foreground">CPU: 68%, Memory: 72%</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Optimal</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">Error Rate Monitoring</div>
                      <div className="text-sm text-muted-foreground">0.02% (Target: &lt;0.1%)</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Frequently used analytics operations and reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 w-full">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">Generate Report</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Create comprehensive compliance or executive reports
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 w-full">
                <Brain className="h-5 w-5" />
                <span className="font-semibold">Run Predictions</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Execute AI models for visitor forecasting and risk assessment
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 w-full">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Security Audit</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Perform comprehensive security analysis and recommendations
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveAnalytics;
