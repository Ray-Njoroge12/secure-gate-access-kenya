import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  Zap,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle
} from "lucide-react";

const AIFeaturesDemo = () => {
  const [demoData, setDemoData] = useState({
    riskAnalysis: {
      totalVisitors: 150,
      highRisk: 12,
      mediumRisk: 23,
      lowRisk: 115,
      criticalRisk: 3
    },
    recentAnalysis: [
      {
        id: 1,
        visitorName: "John Smith",
        riskLevel: "high",
        riskScore: 78,
        confidence: 89,
        factors: ["Multiple failed attempts", "Unusual time pattern", "No prior history"],
        timestamp: "2025-08-14 14:30"
      },
      {
        id: 2,
        visitorName: "Sarah Johnson",
        riskLevel: "medium",
        riskScore: 45,
        confidence: 72,
        factors: ["First-time visitor", "Late evening visit"],
        timestamp: "2025-08-14 14:15"
      },
      {
        id: 3,
        visitorName: "Mike Chen",
        riskLevel: "low",
        riskScore: 15,
        confidence: 95,
        factors: ["Regular visitor", "Consistent behavior", "High success rate"],
        timestamp: "2025-08-14 14:00"
      }
    ],
    anomalies: [
      {
        id: 1,
        type: "Unusual Time Pattern",
        description: "Visitor access attempts outside normal hours increased by 340%",
        severity: "high",
        affectedVisitors: 8,
        timestamp: "2025-08-14 13:45"
      },
      {
        id: 2,
        type: "Failed Access Spike",
        description: "Multiple failed access attempts from same IP range",
        severity: "critical",
        affectedVisitors: 5,
        timestamp: "2025-08-14 13:30"
      }
    ],
    recommendations: [
      {
        id: 1,
        type: "Security Enhancement",
        title: "Implement additional verification for high-risk visitors",
        description: "Consider requiring photo ID verification for visitors with risk scores above 70",
        priority: "high",
        estimatedImpact: "Reduce security incidents by 35%"
      },
      {
        id: 2,
        type: "Process Optimization", 
        title: "Optimize visitor flow during peak hours",
        description: "Analysis shows 23% faster processing possible with staggered appointment slots",
        priority: "medium",
        estimatedImpact: "Reduce wait times by 23%"
      }
    ],
    smartScheduling: {
      optimalTimes: ["09:00-11:00", "14:00-16:00"],
      peakLoad: "12:00-13:00",
      recommendedSlots: 8,
      efficiency: 87
    }
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-10 w-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI & Automation Features Demo
              </h1>
              <p className="text-gray-600">
                Phase 7 Implementation - Intelligent Visitor Risk Assessment System
              </p>
            </div>
          </div>
          
          <Alert className="border-blue-200 bg-blue-50">
            <Zap className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              🚀 <strong>Phase 7 Status:</strong> AI foundation implemented with intelligent risk assessment, 
              behavioral analysis, anomaly detection, and smart recommendations system.
            </AlertDescription>
          </Alert>
        </div>

        <Tabs defaultValue="risk-analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
            <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="scheduling">Smart Scheduling</TabsTrigger>
            <TabsTrigger value="insights">Behavioral Insights</TabsTrigger>
          </TabsList>

          {/* Risk Analysis Tab */}
          <TabsContent value="risk-analysis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{demoData.riskAnalysis.totalVisitors}</div>
                  <p className="text-xs text-muted-foreground">Analyzed today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{demoData.riskAnalysis.highRisk}</div>
                  <p className="text-xs text-muted-foreground">Require attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
                  <Shield className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{demoData.riskAnalysis.criticalRisk}</div>
                  <p className="text-xs text-muted-foreground">Immediate action</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Risk</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{demoData.riskAnalysis.lowRisk}</div>
                  <p className="text-xs text-muted-foreground">Safe to proceed</p>
                </CardContent>
              </Card>
            </div>

            {/* Risk Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Level Distribution</CardTitle>
                <CardDescription>Current visitor risk assessment breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Critical Risk</span>
                      <span>{demoData.riskAnalysis.criticalRisk} visitors</span>
                    </div>
                    <Progress value={(demoData.riskAnalysis.criticalRisk / demoData.riskAnalysis.totalVisitors) * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>High Risk</span>
                      <span>{demoData.riskAnalysis.highRisk} visitors</span>
                    </div>
                    <Progress value={(demoData.riskAnalysis.highRisk / demoData.riskAnalysis.totalVisitors) * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Medium Risk</span>
                      <span>{demoData.riskAnalysis.mediumRisk} visitors</span>
                    </div>
                    <Progress value={(demoData.riskAnalysis.mediumRisk / demoData.riskAnalysis.totalVisitors) * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Low Risk</span>
                      <span>{demoData.riskAnalysis.lowRisk} visitors</span>
                    </div>
                    <Progress value={(demoData.riskAnalysis.lowRisk / demoData.riskAnalysis.totalVisitors) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Risk Assessments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Risk Assessments</CardTitle>
                <CardDescription>Latest AI-powered visitor risk evaluations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoData.recentAnalysis.map((analysis) => (
                    <div key={analysis.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{analysis.visitorName}</h4>
                          <Badge className={getRiskBadgeColor(analysis.riskLevel)}>
                            {analysis.riskLevel.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{analysis.timestamp}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Risk Score:</span> {analysis.riskScore}/100
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span> {analysis.confidence}%
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Risk Factors:</span>
                        <ul className="mt-1 text-sm text-muted-foreground">
                          {analysis.factors.map((factor, index) => (
                            <li key={index}>• {factor}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Anomaly Detection Tab */}
          <TabsContent value="anomalies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-red-500" />
                  Behavioral Anomalies Detected
                </CardTitle>
                <CardDescription>
                  AI-powered pattern recognition has identified unusual activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoData.anomalies.map((anomaly) => (
                    <Alert key={anomaly.id} className={
                      anomaly.severity === 'critical' ? 'border-red-200 bg-red-50' :
                      anomaly.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                      'border-yellow-200 bg-yellow-50'
                    }>
                      <AlertTriangle className={`h-4 w-4 ${
                        anomaly.severity === 'critical' ? 'text-red-600' :
                        anomaly.severity === 'high' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`} />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{anomaly.type}</div>
                            <div className="flex items-center gap-2">
                              <Badge className={
                                anomaly.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                anomaly.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-yellow-100 text-yellow-800'
                              }>
                                {anomaly.severity.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{anomaly.timestamp}</span>
                            </div>
                          </div>
                          <p className="text-sm">{anomaly.description}</p>
                          <p className="text-sm font-medium">
                            Affected Visitors: {anomaly.affectedVisitors}
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  AI-Generated Recommendations
                </CardTitle>
                <CardDescription>
                  Smart suggestions to enhance security and efficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoData.recommendations.map((rec) => (
                    <Card key={rec.id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{rec.title}</CardTitle>
                          <Badge className={
                            rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {rec.priority.toUpperCase()} PRIORITY
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <Badge variant="outline">{rec.type}</Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-3">{rec.description}</p>
                        <div className="bg-blue-50 p-3 rounded border-l-4 border-l-blue-400">
                          <p className="text-sm font-medium text-blue-800">
                            💡 Estimated Impact: {rec.estimatedImpact}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smart Scheduling Tab */}
          <TabsContent value="scheduling" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-500" />
                    Optimal Visit Times
                  </CardTitle>
                  <CardDescription>AI-recommended time slots for maximum efficiency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {demoData.smartScheduling.optimalTimes.map((time, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded border">
                        <span className="font-medium">{time}</span>
                        <Badge className="bg-green-100 text-green-800">OPTIMAL</Badge>
                      </div>
                    ))}
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded border">
                      <span className="font-medium">{demoData.smartScheduling.peakLoad}</span>
                      <Badge className="bg-red-100 text-red-800">PEAK LOAD</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Scheduling Efficiency</CardTitle>
                  <CardDescription>Current system performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Efficiency</span>
                        <span>{demoData.smartScheduling.efficiency}%</span>
                      </div>
                      <Progress value={demoData.smartScheduling.efficiency} className="h-2" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>• Recommended appointment slots: {demoData.smartScheduling.recommendedSlots}</p>
                      <p>• Average processing time: 3.2 minutes</p>
                      <p>• Queue optimization: 94% effective</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Behavioral Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  Behavioral Pattern Analysis
                </CardTitle>
                <CardDescription>
                  Deep insights from visitor behavior patterns and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Key Insights</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-50 rounded border-l-4 border-l-purple-400">
                        <p className="text-sm font-medium">Visitor Retention Pattern</p>
                        <p className="text-sm text-muted-foreground">
                          85% of visitors maintain consistent access patterns over time
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border-l-4 border-l-blue-400">
                        <p className="text-sm font-medium">Peak Activity Correlation</p>
                        <p className="text-sm text-muted-foreground">
                          Tuesday-Thursday 10-11 AM shows highest success rates
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded border-l-4 border-l-green-400">
                        <p className="text-sm font-medium">Security Trend</p>
                        <p className="text-sm text-muted-foreground">
                          23% reduction in security incidents with AI monitoring
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Predictive Analytics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm">Tomorrow's Expected Visitors</span>
                        <Badge>142</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm">High-Risk Probability</span>
                        <Badge className="bg-orange-100 text-orange-800">8%</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm">Optimal Staff Level</span>
                        <Badge className="bg-green-100 text-green-800">3 Guards</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIFeaturesDemo;
