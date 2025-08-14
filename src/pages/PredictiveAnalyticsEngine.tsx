import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Calendar, 
  Users, 
  Shield, 
  Clock, 
  AlertTriangle,
  BarChart3,
  Target,
  Zap,
  Lightbulb,
  Activity,
  RefreshCw,
  Settings,
  Download,
  CheckCircle,
  XCircle,
  Timer,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PredictiveModel {
  id: string;
  name: string;
  type: 'visitor_prediction' | 'security_risk' | 'capacity_planning' | 'maintenance_forecast';
  accuracy: number;
  lastTrained: Date;
  status: 'active' | 'training' | 'inactive';
  description: string;
}

interface Prediction {
  id: string;
  modelId: string;
  type: string;
  prediction: any;
  confidence: number;
  timeframe: string;
  impact: 'High' | 'Medium' | 'Low';
  createdAt: Date;
  status: 'pending' | 'validated' | 'dismissed';
}

interface CapacityForecast {
  date: string;
  expectedVisitors: number;
  confidence: number;
  peakHours: Array<{ hour: number; visitors: number }>;
  recommendations: string[];
}

interface SecurityRiskAnalysis {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  score: number;
  factors: Array<{
    factor: string;
    weight: number;
    description: string;
  }>;
  recommendations: string[];
  trendAnalysis: {
    direction: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
  };
}

interface MaintenanceForecast {
  system: string;
  component: string;
  predictedFailureDate: Date;
  confidence: number;
  maintenanceWindow: string;
  cost: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

const PredictiveAnalyticsEngine: React.FC = () => {
  const [models, setModels] = useState<PredictiveModel[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [capacityForecast, setCapacityForecast] = useState<CapacityForecast[]>([]);
  const [securityAnalysis, setSecurityAnalysis] = useState<SecurityRiskAnalysis | null>(null);
  const [maintenanceForecasts, setMaintenanceForecasts] = useState<MaintenanceForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('week');

  const initializePredictiveModels = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate AI model initialization and data loading
      const mockModels: PredictiveModel[] = [
        {
          id: 'vm-001',
          name: 'Visitor Volume Predictor',
          type: 'visitor_prediction',
          accuracy: 87.3,
          lastTrained: new Date('2025-08-10'),
          status: 'active',
          description: 'Predicts visitor volume based on historical patterns, weather, and events'
        },
        {
          id: 'sr-001',
          name: 'Security Risk Assessor',
          type: 'security_risk',
          accuracy: 92.1,
          lastTrained: new Date('2025-08-11'),
          status: 'active',
          description: 'Analyzes patterns to identify potential security risks and threats'
        },
        {
          id: 'cp-001',
          name: 'Capacity Planner',
          type: 'capacity_planning',
          accuracy: 84.7,
          lastTrained: new Date('2025-08-09'),
          status: 'active',
          description: 'Optimizes resource allocation and capacity planning'
        },
        {
          id: 'mf-001',
          name: 'Maintenance Forecaster',
          type: 'maintenance_forecast',
          accuracy: 78.9,
          lastTrained: new Date('2025-08-08'),
          status: 'training',
          description: 'Predicts equipment maintenance needs and failure points'
        }
      ];

      const mockPredictions: Prediction[] = [
        {
          id: 'pred-001',
          modelId: 'vm-001',
          type: 'Visitor Surge',
          prediction: {
            date: '2025-08-14',
            expectedIncrease: '35%',
            reason: 'School reopening and community event'
          },
          confidence: 89,
          timeframe: 'Next 24 hours',
          impact: 'High',
          createdAt: new Date(),
          status: 'pending'
        },
        {
          id: 'pred-002',
          modelId: 'sr-001',
          type: 'Security Risk',
          prediction: {
            area: 'Gate 2',
            riskType: 'Unauthorized access pattern',
            severity: 'Medium'
          },
          confidence: 76,
          timeframe: 'Next 3 days',
          impact: 'Medium',
          createdAt: new Date(),
          status: 'pending'
        },
        {
          id: 'pred-003',
          modelId: 'mf-001',
          type: 'Maintenance Required',
          prediction: {
            equipment: 'Access Control System - Gate 1',
            issue: 'Card reader calibration drift',
            urgency: 'Schedule within 2 weeks'
          },
          confidence: 82,
          timeframe: 'Next 2 weeks',
          impact: 'Medium',
          createdAt: new Date(),
          status: 'pending'
        }
      ];

      const mockCapacityForecast: CapacityForecast[] = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return {
          date: date.toISOString().split('T')[0],
          expectedVisitors: Math.floor(Math.random() * 50) + 30,
          confidence: Math.floor(Math.random() * 20) + 80,
          peakHours: [
            { hour: 9, visitors: Math.floor(Math.random() * 15) + 5 },
            { hour: 14, visitors: Math.floor(Math.random() * 20) + 10 },
            { hour: 18, visitors: Math.floor(Math.random() * 12) + 8 }
          ],
          recommendations: [
            'Consider additional guard during peak hours',
            'Prepare visitor parking management'
          ]
        };
      });

      const mockSecurityAnalysis: SecurityRiskAnalysis = {
        riskLevel: 'Medium',
        score: 65,
        factors: [
          {
            factor: 'Failed Access Attempts',
            weight: 0.3,
            description: 'Increased failed access attempts in past 48 hours'
          },
          {
            factor: 'Unusual Visit Patterns',
            weight: 0.25,
            description: 'Visitors accessing at irregular hours'
          },
          {
            factor: 'Weather Conditions',
            weight: 0.15,
            description: 'Poor visibility conditions increase security risks'
          },
          {
            factor: 'Staff Scheduling',
            weight: 0.2,
            description: 'Reduced guard coverage during shift changes'
          },
          {
            factor: 'System Performance',
            weight: 0.1,
            description: 'Minor delays in access control system'
          }
        ],
        recommendations: [
          'Increase security patrols during evening hours',
          'Review and update visitor access patterns',
          'Consider additional lighting for low-visibility areas',
          'Optimize guard shift schedules to minimize coverage gaps'
        ],
        trendAnalysis: {
          direction: 'increasing',
          confidence: 73
        }
      };

      const mockMaintenanceForecasts: MaintenanceForecast[] = [
        {
          system: 'Access Control',
          component: 'Gate 1 Card Reader',
          predictedFailureDate: new Date('2025-09-15'),
          confidence: 85,
          maintenanceWindow: '2-hour window during low traffic',
          cost: 1200,
          priority: 'High'
        },
        {
          system: 'CCTV System',
          component: 'Camera Array - Sector 3',
          predictedFailureDate: new Date('2025-10-22'),
          confidence: 72,
          maintenanceWindow: '4-hour window, overnight',
          cost: 800,
          priority: 'Medium'
        },
        {
          system: 'Communication',
          component: 'Intercom System',
          predictedFailureDate: new Date('2025-11-08'),
          confidence: 68,
          maintenanceWindow: '1-hour window',
          cost: 450,
          priority: 'Low'
        }
      ];

      setModels(mockModels);
      setPredictions(mockPredictions);
      setCapacityForecast(mockCapacityForecast);
      setSecurityAnalysis(mockSecurityAnalysis);
      setMaintenanceForecasts(mockMaintenanceForecasts);

      toast({
        title: "Predictive Models Loaded",
        description: "All AI models and predictions have been initialized.",
      });
    } catch (error) {
      console.error('Error initializing predictive models:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to load predictive models. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const retrainModel = async (modelId: string) => {
    try {
      toast({
        title: "Model Retraining Started",
        description: "AI model is being retrained with latest data...",
      });

      // Simulate model retraining
      setModels(prev => prev.map(model => 
        model.id === modelId 
          ? { ...model, status: 'training' as const }
          : model
      ));

      setTimeout(() => {
        setModels(prev => prev.map(model => 
          model.id === modelId 
            ? { 
                ...model, 
                status: 'active' as const,
                lastTrained: new Date(),
                accuracy: Math.min(model.accuracy + Math.random() * 3, 95)
              }
            : model
        ));

        toast({
          title: "Model Retrained",
          description: "AI model has been successfully retrained with improved accuracy.",
        });
      }, 3000);
    } catch (error) {
      toast({
        title: "Retraining Failed",
        description: "Failed to retrain the model. Please try again.",
        variant: "destructive"
      });
    }
  };

  const validatePrediction = async (predictionId: string, isValid: boolean) => {
    try {
      setPredictions(prev => prev.map(pred => 
        pred.id === predictionId 
          ? { ...pred, status: isValid ? 'validated' : 'dismissed' }
          : pred
      ));

      toast({
        title: isValid ? "Prediction Validated" : "Prediction Dismissed",
        description: `Feedback recorded to improve model accuracy.`,
      });
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Failed to record prediction feedback.",
        variant: "destructive"
      });
    }
  };

  const exportPredictiveReport = async (type: 'comprehensive' | 'summary') => {
    try {
      toast({
        title: "Export Started",
        description: `Generating ${type} predictive analytics report...`,
      });
      
      // Simulate export process
      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: `Predictive analytics report downloaded.`,
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
    initializePredictiveModels();
  }, [initializePredictiveModels]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'training': return 'bg-yellow-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-600';
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 animate-pulse" />
          <span>Initializing AI models...</span>
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
            <Brain className="h-8 w-8" />
            Predictive Analytics Engine
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights and intelligent forecasting
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={initializePredictiveModels}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Models
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPredictiveReport('comprehensive')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="security">Security Risk</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* AI Models Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Models Status
              </CardTitle>
              <CardDescription>Current status and performance of predictive models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {models.map((model) => (
                  <div key={model.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{model.name}</h3>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(model.status)}`}></div>
                        <span className="text-sm text-muted-foreground capitalize">{model.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{model.description}</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Accuracy</span>
                      <span className="text-sm font-medium">{model.accuracy}%</span>
                    </div>
                    <Progress value={model.accuracy} className="mb-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Last trained: {model.lastTrained.toLocaleDateString()}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => retrainModel(model.id)}
                        disabled={model.status === 'training'}
                      >
                        {model.status === 'training' ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Training
                          </>
                        ) : (
                          <>
                            <Zap className="h-3 w-3 mr-1" />
                            Retrain
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Predictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recent Predictions
              </CardTitle>
              <CardDescription>Latest AI-generated insights and forecasts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {predictions.slice(0, 5).map((prediction) => (
                  <div key={prediction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{prediction.type}</Badge>
                        <Badge 
                          variant={prediction.impact === 'High' ? 'destructive' : 
                                 prediction.impact === 'Medium' ? 'default' : 'secondary'}
                        >
                          {prediction.impact} Impact
                        </Badge>
                      </div>
                      <p className="text-sm">
                        {typeof prediction.prediction === 'object' 
                          ? Object.values(prediction.prediction).join(' - ')
                          : prediction.prediction}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Confidence: {prediction.confidence}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {prediction.timeframe}
                        </span>
                      </div>
                    </div>
                    {prediction.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => validatePrediction(prediction.id, true)}
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => validatePrediction(prediction.id, false)}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{predictions.length}</div>
                <p className="text-xs text-muted-foreground">Generated this period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Validated</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {predictions.filter(p => p.status === 'validated').length}
                </div>
                <p className="text-xs text-muted-foreground">Confirmed accurate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length)}%
                </div>
                <p className="text-xs text-muted-foreground">Model confidence</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Predictions</CardTitle>
              <CardDescription>Complete list of AI-generated predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((prediction) => (
                  <div key={prediction.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{prediction.type}</Badge>
                        <Badge 
                          variant={prediction.impact === 'High' ? 'destructive' : 
                                 prediction.impact === 'Medium' ? 'default' : 'secondary'}
                        >
                          {prediction.impact} Impact
                        </Badge>
                        <Badge 
                          variant={prediction.status === 'validated' ? 'default' : 
                                 prediction.status === 'dismissed' ? 'destructive' : 'secondary'}
                        >
                          {prediction.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {prediction.createdAt.toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <h4 className="font-medium mb-2">Prediction Details</h4>
                        {typeof prediction.prediction === 'object' ? (
                          <div className="space-y-1">
                            {Object.entries(prediction.prediction).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span> {value}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm">{prediction.prediction}</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Metrics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Confidence:</span>
                            <span>{prediction.confidence}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Timeframe:</span>
                            <span>{prediction.timeframe}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Model:</span>
                            <span>{models.find(m => m.id === prediction.modelId)?.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {prediction.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => validatePrediction(prediction.id, true)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Validate
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => validatePrediction(prediction.id, false)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capacity Tab */}
        <TabsContent value="capacity" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Capacity Forecasting</h2>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="week">Next Week</option>
              <option value="month">Next Month</option>
              <option value="quarter">Next Quarter</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Capacity Forecast</CardTitle>
                <CardDescription>Expected visitor volume and capacity utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {capacityForecast.slice(0, 7).map((forecast) => (
                    <div key={forecast.date} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">
                          {new Date(forecast.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <Badge variant="outline">{forecast.confidence}% confident</Badge>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Expected Visitors:</span>
                        <span className="font-medium">{forecast.expectedVisitors}</span>
                      </div>
                      <Progress 
                        value={Math.min((forecast.expectedVisitors / 100) * 100, 100)} 
                        className="mb-2" 
                      />
                      <div className="text-xs text-muted-foreground">
                        Peak hours: {forecast.peakHours.map(ph => `${ph.hour}:00 (${ph.visitors})`).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Capacity Recommendations</CardTitle>
                <CardDescription>AI-generated optimization suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {capacityForecast[0]?.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 mt-0.5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Optimization Insight</p>
                        <p className="text-sm text-blue-700">
                          Based on historical patterns, Tuesdays show 23% higher capacity utilization. 
                          Consider pre-scheduling additional resources.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Efficiency Tip</p>
                        <p className="text-sm text-green-700">
                          Current guard scheduling achieves 94% efficiency rating. 
                          Maintain current rotation patterns.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Risk Tab */}
        <TabsContent value="security" className="space-y-6">
          {securityAnalysis && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${getRiskLevelColor(securityAnalysis.riskLevel)}`}></div>
                      <div className="text-2xl font-bold">{securityAnalysis.riskLevel}</div>
                    </div>
                    <p className="text-xs text-muted-foreground">Risk Score: {securityAnalysis.score}/100</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Trend Direction</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">{securityAnalysis.trendAnalysis.direction}</div>
                    <p className="text-xs text-muted-foreground">
                      {securityAnalysis.trendAnalysis.confidence}% confidence
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Risk Factors</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{securityAnalysis.factors.length}</div>
                    <p className="text-xs text-muted-foreground">Active risk factors</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Factor Analysis</CardTitle>
                    <CardDescription>Detailed breakdown of security risk components</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {securityAnalysis.factors.map((factor, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{factor.factor}</span>
                            <Badge variant="outline">{Math.round(factor.weight * 100)}% weight</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{factor.description}</p>
                          <Progress value={factor.weight * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Security Recommendations</CardTitle>
                    <CardDescription>AI-powered security enhancement suggestions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {securityAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-start gap-2">
                            <Shield className="h-4 w-4 mt-0.5 text-blue-500" />
                            <p className="text-sm">{rec}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Maintenance</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{maintenanceForecasts.length}</div>
                <p className="text-xs text-muted-foreground">Predicted requirements</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {maintenanceForecasts.filter(f => f.priority === 'High' || f.priority === 'Critical').length}
                </div>
                <p className="text-xs text-muted-foreground">Urgent items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${maintenanceForecasts.reduce((acc, f) => acc + f.cost, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Estimated budget</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Forecasts</CardTitle>
              <CardDescription>Predictive maintenance schedule based on AI analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceForecasts.map((forecast, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">{forecast.system}</h3>
                        <p className="text-sm text-muted-foreground">{forecast.component}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getPriorityColor(forecast.priority)}>
                          {forecast.priority}
                        </Badge>
                        <Badge variant="outline">{forecast.confidence}% confident</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm font-medium">Predicted Failure Date</span>
                        <p className="text-sm text-muted-foreground">
                          {forecast.predictedFailureDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Maintenance Window</span>
                        <p className="text-sm text-muted-foreground">{forecast.maintenanceWindow}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Estimated Cost</span>
                        <p className="text-sm text-muted-foreground">${forecast.cost.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          Time until maintenance: {Math.ceil((forecast.predictedFailureDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                        <Button size="sm" variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
                      </div>
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

export default PredictiveAnalyticsEngine;
