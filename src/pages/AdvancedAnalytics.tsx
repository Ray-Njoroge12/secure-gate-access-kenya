import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  Shield,
  Users,
  Clock,
  BarChart3,
  Activity,
  Eye
} from 'lucide-react';

interface PredictiveModel {
  modelId: string;
  name: string;
  accuracy: number;
  lastTraining: string;
  predictions: Array<{
    date: string;
    predicted: number;
    confidence: number;
    category: string;
  }>;
}

interface AnomalyDetection {
  timestamp: string;
  anomalyType: 'security' | 'performance' | 'usage' | 'behavioral';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedSystems: string[];
  recommendedActions: string[];
  confidence: number;
}

interface PatternAnalysis {
  patternType: string;
  frequency: number;
  timeOfDay: string;
  weekdays: string[];
  seasonality: string;
  correlation: number;
  businessImpact: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff0000'];

export function AdvancedAnalytics() {
  const [predictiveModels, setPredictiveModels] = useState<PredictiveModel[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [patterns, setPatterns] = useState<PatternAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('visitor-traffic');
  const { toast } = useToast();

  const loadAdvancedAnalytics = async () => {
    try {
      setLoading(true);

      // Mock advanced analytics data
      const models: PredictiveModel[] = [
        {
          modelId: 'visitor-traffic',
          name: 'Visitor Traffic Prediction',
          accuracy: 89.5,
          lastTraining: '2025-01-20T10:00:00Z',
          predictions: [
            { date: '2025-01-22', predicted: 145, confidence: 0.89, category: 'daily_visitors' },
            { date: '2025-01-23', predicted: 162, confidence: 0.87, category: 'daily_visitors' },
            { date: '2025-01-24', predicted: 138, confidence: 0.91, category: 'daily_visitors' },
            { date: '2025-01-25', predicted: 95, confidence: 0.85, category: 'daily_visitors' },
            { date: '2025-01-26', predicted: 78, confidence: 0.83, category: 'daily_visitors' }
          ]
        },
        {
          modelId: 'security-incidents',
          name: 'Security Incident Prediction',
          accuracy: 92.3,
          lastTraining: '2025-01-19T14:30:00Z',
          predictions: [
            { date: '2025-01-22', predicted: 0.05, confidence: 0.92, category: 'incident_probability' },
            { date: '2025-01-23', predicted: 0.12, confidence: 0.88, category: 'incident_probability' },
            { date: '2025-01-24', predicted: 0.08, confidence: 0.90, category: 'incident_probability' },
            { date: '2025-01-25', predicted: 0.03, confidence: 0.94, category: 'incident_probability' },
            { date: '2025-01-26', predicted: 0.02, confidence: 0.95, category: 'incident_probability' }
          ]
        },
        {
          modelId: 'resource-optimization',
          name: 'Resource Optimization Model',
          accuracy: 85.7,
          lastTraining: '2025-01-18T09:15:00Z',
          predictions: [
            { date: '2025-01-22', predicted: 75, confidence: 0.86, category: 'utilization_percent' },
            { date: '2025-01-23', predicted: 82, confidence: 0.84, category: 'utilization_percent' },
            { date: '2025-01-24', predicted: 68, confidence: 0.88, category: 'utilization_percent' },
            { date: '2025-01-25', predicted: 45, confidence: 0.81, category: 'utilization_percent' },
            { date: '2025-01-26', predicted: 38, confidence: 0.79, category: 'utilization_percent' }
          ]
        }
      ];

      const anomalyData: AnomalyDetection[] = [
        {
          timestamp: '2025-01-21T14:22:00Z',
          anomalyType: 'security',
          severity: 'medium',
          description: 'Unusual access pattern detected from IP range 192.168.1.x',
          affectedSystems: ['Access Control', 'Visitor Management'],
          recommendedActions: ['Monitor IP range', 'Review access logs', 'Consider rate limiting'],
          confidence: 0.78
        },
        {
          timestamp: '2025-01-21T11:45:00Z',
          anomalyType: 'performance',
          severity: 'low',
          description: 'Response time spike detected during peak hours',
          affectedSystems: ['API Gateway', 'Database'],
          recommendedActions: ['Scale infrastructure', 'Optimize database queries'],
          confidence: 0.85
        },
        {
          timestamp: '2025-01-21T09:15:00Z',
          anomalyType: 'behavioral',
          severity: 'high',
          description: 'Abnormal visitor check-in pattern indicates potential security concern',
          affectedSystems: ['Visitor Registration', 'Security Monitoring'],
          recommendedActions: ['Immediate security review', 'Contact security personnel', 'Verify visitor identity'],
          confidence: 0.92
        }
      ];

      const patternData: PatternAnalysis[] = [
        {
          patternType: 'Peak Visitor Hours',
          frequency: 85,
          timeOfDay: '09:00-11:00, 14:00-16:00',
          weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
          seasonality: 'Higher during Q1 and Q3',
          correlation: 0.89,
          businessImpact: 'High - affects staffing and resource allocation'
        },
        {
          patternType: 'Security Alert Clusters',
          frequency: 23,
          timeOfDay: '22:00-02:00',
          weekdays: ['Friday', 'Saturday'],
          seasonality: 'Consistent year-round',
          correlation: 0.67,
          businessImpact: 'Medium - requires night shift security protocols'
        },
        {
          patternType: 'System Maintenance Windows',
          frequency: 12,
          timeOfDay: '02:00-04:00',
          weekdays: ['Sunday'],
          seasonality: 'Monthly cycle',
          correlation: 0.94,
          businessImpact: 'Low - scheduled downtime with minimal user impact'
        }
      ];

      setPredictiveModels(models);
      setAnomalies(anomalyData);
      setPatterns(patternData);

    } catch (error) {
      console.error('Error loading advanced analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load advanced analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvancedAnalytics();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAnomalyTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return <Shield className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'usage': return <Users className="h-4 w-4" />;
      case 'behavioral': return <Eye className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const selectedModelData = predictiveModels.find(m => m.modelId === selectedModel);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Advanced Analytics & AI
          </h1>
          <p className="text-gray-600">Predictive models, anomaly detection, and pattern analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Target className="h-4 w-4 mr-2" />
            Retrain Models
          </Button>
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Live Monitor
          </Button>
        </div>
      </div>

      {/* Model Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {predictiveModels.map(model => (
          <Card key={model.modelId} className={`cursor-pointer transition-all ${selectedModel === model.modelId ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelectedModel(model.modelId)}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{model.name}</CardTitle>
              <CardDescription>Accuracy: {model.accuracy}%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={model.accuracy} className="h-2" />
                <div className="text-sm text-gray-500">
                  Last training: {new Date(model.lastTraining).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Predictive Model Visualization */}
      {selectedModelData && (
        <Card>
          <CardHeader>
            <CardTitle>Predictions: {selectedModelData.name}</CardTitle>
            <CardDescription>
              Model accuracy: {selectedModelData.accuracy}% | Next 5-day forecast
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={selectedModelData.predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(2) : value, 
                    name === 'predicted' ? 'Predicted Value' : name
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke="#82ca9d" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Anomaly Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Anomalies
          </CardTitle>
          <CardDescription>AI-detected unusual patterns and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {anomalies.map((anomaly, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getAnomalyTypeIcon(anomaly.anomalyType)}
                    <span className="font-medium capitalize">{anomaly.anomalyType} Anomaly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(anomaly.severity)} variant="outline">
                      {anomaly.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(anomaly.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm">{anomaly.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Affected Systems:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {anomaly.affectedSystems.map((system, i) => (
                        <li key={i}>{system}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Recommended Actions:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {anomaly.recommendedActions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">
                    Confidence: {(anomaly.confidence * 100).toFixed(1)}%
                  </span>
                  <Button size="sm" variant="outline">
                    Investigate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pattern Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Pattern Analysis
          </CardTitle>
          <CardDescription>Discovered behavioral and operational patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {patterns.map((pattern, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{pattern.patternType}</h3>
                  <Badge variant="outline">{pattern.frequency}% frequency</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <strong>Time:</strong> {pattern.timeOfDay}
                  </div>
                  <div>
                    <strong>Days:</strong> {pattern.weekdays.join(', ')}
                  </div>
                  <div>
                    <strong>Seasonality:</strong> {pattern.seasonality}
                  </div>
                  <div>
                    <strong>Correlation:</strong> {(pattern.correlation * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <strong className="text-sm">Business Impact:</strong>
                  <p className="text-sm text-gray-600 mt-1">{pattern.businessImpact}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
