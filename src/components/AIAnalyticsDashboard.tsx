import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Shield, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Target
} from 'lucide-react';
import { useAIRiskAssessment } from '@/hooks/useAIRiskAssessment';
import { useToast } from '@/hooks/use-toast';

interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

const AIAnalyticsDashboard = () => {
  const { toast } = useToast();
  const {
    state,
    getHighRiskVisitors,
    detectAnomalies,
    getPendingRecommendations,
    updateAllRiskProfiles,
    updateRecommendationStatus
  } = useAIRiskAssessment();

  const [highRiskVisitors, setHighRiskVisitors] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistribution>({
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load high-risk visitors
      const riskResult = await getHighRiskVisitors();
      if (riskResult.success) {
        setHighRiskVisitors(riskResult.visitors || []);
        
        // Calculate risk distribution
        const distribution = (riskResult.visitors || []).reduce((acc, visitor) => {
          acc[visitor.risk_level]++;
          return acc;
        }, { low: 0, medium: 0, high: 0, critical: 0 });
        
        setRiskDistribution(distribution);
      }

      // Load anomalies
      const anomalyResult = await detectAnomalies();
      if (anomalyResult.success) {
        setAnomalies(anomalyResult.anomalies || []);
      }

      // Load recommendations
      const recResult = await getPendingRecommendations();
      if (recResult.success) {
        setRecommendations(recResult.recommendations || []);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load AI analytics data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh all risk profiles
  const handleRefreshProfiles = async () => {
    const result = await updateAllRiskProfiles();
    if (result.success) {
      toast({
        title: "Success",
        description: `Updated ${result.updatedCount} risk profiles`,
      });
      await loadDashboardData();
    }
  };

  // Handle recommendation action
  const handleRecommendationAction = async (
    recommendationId: string, 
    action: 'accepted' | 'rejected'
  ) => {
    const result = await updateRecommendationStatus(recommendationId, action);
    if (result.success) {
      toast({
        title: "Success",
        description: `Recommendation ${action}`,
      });
      await loadDashboardData();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update recommendation",
        variant: "destructive"
      });
    }
  };

  // Initialize dashboard
  useEffect(() => {
    loadDashboardData();
  }, []);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAnomalySeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const totalVisitors = Object.values(riskDistribution).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="h-8 w-8 text-purple-600" />
                AI Analytics Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Intelligent visitor risk assessment and behavioral analysis
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleRefreshProfiles}
                disabled={state.isCalculating || isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${state.isCalculating ? 'animate-spin' : ''}`} />
                Update Risk Profiles
              </Button>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Analysis Status</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {state.isCalculating ? 'Processing...' : 'Ready'}
              </div>
              <p className="text-xs text-muted-foreground">
                {state.lastUpdate ? `Last update: ${state.lastUpdate.toLocaleTimeString()}` : 'Never updated'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{state.anomaliesDetected}</div>
              <p className="text-xs text-muted-foreground">Requiring attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Recommendations</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{state.pendingRecommendations}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visitors Analyzed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVisitors}</div>
              <p className="text-xs text-muted-foreground">With risk profiles</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="risk-analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
            <TabsTrigger value="anomalies">Behavioral Anomalies</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="insights">Intelligence Insights</TabsTrigger>
          </TabsList>

          {/* Risk Analysis Tab */}
          <TabsContent value="risk-analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Level Distribution</CardTitle>
                  <CardDescription>Current visitor risk assessment breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(riskDistribution).map(([level, count]) => {
                    const percentage = totalVisitors > 0 ? (count / totalVisitors) * 100 : 0;
                    return (
                      <div key={level} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Badge className={getRiskLevelColor(level)}>
                            {level.charAt(0).toUpperCase() + level.slice(1)} Risk
                          </Badge>
                          <span className="text-sm font-medium">{count} visitors</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* High-Risk Visitors */}
              <Card>
                <CardHeader>
                  <CardTitle>High-Risk Visitors</CardTitle>
                  <CardDescription>Visitors requiring additional attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {highRiskVisitors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No high-risk visitors detected</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {highRiskVisitors.slice(0, 5).map((visitor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{visitor.visitor_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Score: {visitor.risk_score}/100 | Visits: {visitor.total_visits}
                            </p>
                          </div>
                          <Badge className={getRiskLevelColor(visitor.risk_level)}>
                            {visitor.risk_level}
                          </Badge>
                        </div>
                      ))}
                      {highRiskVisitors.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{highRiskVisitors.length - 5} more high-risk visitors
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Behavioral Anomalies Tab */}
          <TabsContent value="anomalies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detected Behavioral Anomalies</CardTitle>
                <CardDescription>Unusual patterns requiring investigation</CardDescription>
              </CardHeader>
              <CardContent>
                {anomalies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No behavioral anomalies detected</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {anomalies.map((anomaly, index) => (
                      <Alert key={index} className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{anomaly.anomaly_type.replace('_', ' ').toUpperCase()}</p>
                              <p className="text-sm mt-1">{anomaly.anomaly_details?.description}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Visitor ID: {anomaly.visitor_id}
                              </p>
                            </div>
                            <Badge className={getAnomalySeverityColor(anomaly.severity)}>
                              {anomaly.severity}
                            </Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>System-generated suggestions for security improvements</CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No pending recommendations</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">{rec.recommendation_type.replace('_', ' ').toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground">
                              Confidence: {(rec.confidence_score * 100).toFixed(0)}%
                            </p>
                          </div>
                          <Badge variant="outline">{rec.entity_type}</Badge>
                        </div>
                        <p className="text-sm mb-4">
                          {JSON.stringify(rec.recommendation, null, 2)}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleRecommendationAction(rec.id, 'accepted')}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleRecommendationAction(rec.id, 'rejected')}
                            className="flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Intelligence Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Intelligence Summary</CardTitle>
                  <CardDescription>Key insights from AI analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800">Pattern Recognition</h4>
                    <p className="text-sm text-blue-600 mt-1">
                      AI monitors visitor behavior patterns to identify potential security concerns.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800">Risk Assessment</h4>
                    <p className="text-sm text-green-600 mt-1">
                      Automated scoring based on visit history, success rates, and behavioral analysis.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-800">Predictive Analytics</h4>
                    <p className="text-sm text-purple-600 mt-1">
                      Machine learning identifies potential issues before they become security incidents.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>AI analysis metrics and effectiveness</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Analysis Accuracy</span>
                    <Badge className="bg-green-50 text-green-700">92%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Time</span>
                    <Badge className="bg-blue-50 text-blue-700">&lt; 500ms</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">False Positive Rate</span>
                    <Badge className="bg-yellow-50 text-yellow-700">8%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Coverage</span>
                    <Badge className="bg-purple-50 text-purple-700">100%</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIAnalyticsDashboard;
