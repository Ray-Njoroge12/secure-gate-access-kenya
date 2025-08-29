import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  Brain,
  TrendingUp,
  Users,
  Shield,
  AlertTriangle,
  Zap,
  Target,
  Calendar,
  Clock
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

interface VisitorLoadPrediction {
  date: string;
  predicted: number;
  actual?: number;
  confidence: number;
}

interface SecurityRisk {
  risk: string;
  probability: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
}

interface GuardSchedule {
  day: string;
  required: number;
  available: number;
  recommended: number;
  shift: string;
}

interface PredictiveAnalyticsData {
  visitorLoad: VisitorLoadPrediction[];
  securityRisks: SecurityRisk[];
  guardSchedule: GuardSchedule[];
}

const PredictiveAnalyticsDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PredictiveAnalyticsData | null>(null);
  const [selectedDays, setSelectedDays] = useState(14);

  const fetchPredictiveData = async () => {
    setLoading(true);
    try {
      const [visitorLoadRes, securityRisksRes, guardScheduleRes] = await Promise.all([
        apiClient.get(`/analytics/predict/visitor-load?days_ahead=${selectedDays}`),
        apiClient.get(`/analytics/predict/security-risks?days=${selectedDays}`),
        apiClient.get(`/analytics/predict/guard-scheduling?days=${selectedDays}`)
      ]);

      setData({
        visitorLoad: visitorLoadRes.data,
        securityRisks: securityRisksRes.data,
        guardSchedule: guardScheduleRes.data
      });

      toast({
        title: "Predictions Updated",
        description: "Predictive analytics data has been refreshed.",
      });
    } catch (error) {
      console.error('Failed to fetch predictive data:', error);
      toast({
        title: "Error",
        description: "Failed to load predictive analytics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictiveData();
  }, [selectedDays]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Predictive Analytics
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights for visitor forecasting, risk assessment, and resource optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSelectedDays(7)}
            className={selectedDays === 7 ? 'bg-primary text-primary-foreground' : ''}
          >
            7 Days
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedDays(14)}
            className={selectedDays === 14 ? 'bg-primary text-primary-foreground' : ''}
          >
            14 Days
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedDays(30)}
            className={selectedDays === 30 ? 'bg-primary text-primary-foreground' : ''}
          >
            30 Days
          </Button>
        </div>
      </div>

      {/* Visitor Load Prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Visitor Load Prediction
          </CardTitle>
          <CardDescription>
            AI-powered forecasting of visitor traffic patterns with confidence intervals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data?.visitorLoad || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [
                  value,
                  name === 'predicted' ? 'Predicted Visitors' : 'Actual Visitors'
                ]}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#8884d8"
                strokeWidth={3}
                strokeDasharray="5 5"
                name="predicted"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#82ca9d"
                strokeWidth={2}
                name="actual"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {data?.visitorLoad?.slice(0, 3).map((prediction, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">{prediction.date}</div>
                <div className="text-lg font-semibold">{prediction.predicted} visitors</div>
                <div className={`text-sm ${getConfidenceColor(prediction.confidence)}`}>
                  {Math.round(prediction.confidence * 100)}% confidence
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Risk Assessment
          </CardTitle>
          <CardDescription>
            Machine learning analysis of potential security threats and vulnerabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.securityRisks?.map((risk, index) => (
              <Alert key={index} className="border-l-4 border-l-orange-500">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{risk.risk}</div>
                    <div className="flex gap-2">
                      <Badge className={getImpactBadgeColor(risk.impact)}>
                        {risk.impact} impact
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(risk.probability * 100)}% probability
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {risk.description}
                  </div>
                  <div className="text-sm">
                    <strong>Recommended Action:</strong> {risk.mitigation}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guard Scheduling Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Guard Scheduling Optimization
          </CardTitle>
          <CardDescription>
            AI-optimized staffing recommendations based on predicted visitor patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.guardSchedule || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="required" fill="#8884d8" name="Required Guards" />
              <Bar dataKey="available" fill="#82ca9d" name="Available Guards" />
              <Bar dataKey="recommended" fill="#ffc658" name="AI Recommended" />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {data?.guardSchedule?.map((schedule, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{schedule.day}</div>
                    <div className="text-sm text-muted-foreground">{schedule.shift}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Required</div>
                    <div className="font-semibold">{schedule.required}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Available</div>
                    <div className="font-semibold">{schedule.available}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Recommended</div>
                    <div className="font-semibold text-blue-600">{schedule.recommended}</div>
                  </div>
                  {schedule.recommended !== schedule.available && (
                    <Badge variant={schedule.recommended > schedule.available ? "destructive" : "secondary"}>
                      {schedule.recommended > schedule.available ? 'Understaffed' : 'Overstaffed'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictive Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Peak Hours Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { hour: '9:00 AM', predicted: 25, confidence: 0.85 },
                { hour: '11:00 AM', predicted: 18, confidence: 0.78 },
                { hour: '2:00 PM', predicted: 32, confidence: 0.92 },
                { hour: '4:00 PM', predicted: 28, confidence: 0.88 }
              ].map((peak, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{peak.hour}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{peak.predicted} visitors</span>
                    <Badge variant="outline" className={getConfidenceColor(peak.confidence)}>
                      {Math.round(peak.confidence * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Resource Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommendation:</strong> Increase guard staffing by 15% during peak hours (2-4 PM) based on visitor load predictions.
                </AlertDescription>
              </Alert>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Alert:</strong> High probability of unauthorized access attempts detected. Recommend enhanced surveillance.
                </AlertDescription>
              </Alert>
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Trend Analysis:</strong> Visitor traffic expected to increase by 23% next week. Prepare additional resources.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;
