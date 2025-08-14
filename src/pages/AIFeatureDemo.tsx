import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  BarChart3,
  Shield,
  Clock
} from "lucide-react";

// Demo data for AI features
const demoRiskProfiles = [
  {
    id: 1,
    visitor_name: "John Doe",
    risk_level: "low",
    risk_score: 25,
    confidence_level: 85,
    visit_frequency: 12,
    last_visit: "2024-08-10",
    risk_factors: {
      visit_history: "Regular visitor",
      time_patterns: "Normal business hours",
      incident_history: "No incidents"
    },
    behavioral_notes: "Consistent visitor pattern, always accompanied by host"
  },
  {
    id: 2,
    visitor_name: "Jane Smith",
    risk_level: "medium",
    risk_score: 55,
    confidence_level: 92,
    visit_frequency: 3,
    last_visit: "2024-08-13",
    risk_factors: {
      visit_history: "Infrequent visitor",
      time_patterns: "Late evening visits",
      incident_history: "Minor access violation"
    },
    behavioral_notes: "Unusual visit times, sometimes arrives without prior appointment"
  },
  {
    id: 3,
    visitor_name: "Mike Johnson",
    risk_level: "high",
    risk_score: 78,
    confidence_level: 96,
    visit_frequency: 1,
    last_visit: "2024-08-14",
    risk_factors: {
      visit_history: "First-time visitor",
      time_patterns: "After-hours access",
      incident_history: "Flagged by security"
    },
    behavioral_notes: "Attempted unauthorized access to restricted areas during previous visit"
  }
];

const demoAnomalies = [
  {
    id: 1,
    type: "unusual_timing",
    description: "Multiple visitors arriving after 10 PM",
    severity: "medium",
    detected_at: "2024-08-14 22:30:00",
    visitor_count: 5
  },
  {
    id: 2,
    type: "repeat_failures",
    description: "Same visitor failed access verification 3 times",
    severity: "high",
    detected_at: "2024-08-14 14:15:00",
    visitor_name: "Unknown Visitor"
  },
  {
    id: 3,
    type: "pattern_deviation",
    description: "Unusual clustering of visits from new visitors",
    severity: "low",
    detected_at: "2024-08-14 09:00:00",
    visitor_count: 8
  }
];

const demoRecommendations = [
  {
    id: 1,
    type: "security_enhancement",
    title: "Enhanced Verification for High-Risk Visitors",
    description: "Implement additional verification steps for visitors with risk scores above 70",
    priority: "high",
    implementation_effort: "medium"
  },
  {
    id: 2,
    type: "process_optimization",
    title: "Optimize Peak Hour Scheduling",
    description: "Spread visitor appointments more evenly to reduce congestion during 2-4 PM",
    priority: "medium",
    implementation_effort: "low"
  },
  {
    id: 3,
    type: "behavioral_monitoring",
    title: "Monitor Late Evening Access Patterns",
    description: "Review security protocols for visitors accessing after 8 PM",
    priority: "medium",
    implementation_effort: "high"
  }
];

const AIFeatureDemo: React.FC = () => {
  const [selectedRiskProfile, setSelectedRiskProfile] = useState(demoRiskProfiles[0]);
  const [aiProcessingProgress, setAiProcessingProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simulate AI processing
  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAiProcessingProgress(prev => {
          if (prev >= 100) {
            setIsAnalyzing(false);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const startAIAnalysis = () => {
    setIsAnalyzing(true);
    setAiProcessingProgress(0);
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'critical': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'high': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            AI & Automation Features Demo
          </h1>
          <p className="mt-2 text-gray-600">
            Demonstration of Phase 7 AI-powered security enhancement features
          </p>
        </div>

        {/* AI Analysis Control Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              AI Analysis Engine
            </CardTitle>
            <CardDescription>
              Real-time AI processing and behavioral analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={startAIAnalysis} 
                  disabled={isAnalyzing}
                  className="flex items-center gap-2"
                >
                  <Brain className="h-4 w-4" />
                  {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
                </Button>
                <Badge variant="outline">
                  {isAnalyzing ? 'Processing' : 'Ready'}
                </Badge>
              </div>
              
              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>AI Processing Progress</span>
                    <span>{aiProcessingProgress}%</span>
                  </div>
                  <Progress value={aiProcessingProgress} className="w-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="risk-assessment" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="risk-assessment">Risk Assessment</TabsTrigger>
            <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="insights">Behavioral Insights</TabsTrigger>
          </TabsList>

          {/* Risk Assessment Tab */}
          <TabsContent value="risk-assessment" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Visitor Risk Profiles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Visitor Risk Profiles
                  </CardTitle>
                  <CardDescription>
                    AI-calculated risk assessments for recent visitors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {demoRiskProfiles.map((profile) => (
                    <div 
                      key={profile.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRiskProfile.id === profile.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedRiskProfile(profile)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{profile.visitor_name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeVariant(profile.risk_level)}`}>
                          {profile.risk_level.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Risk Score: {profile.risk_score}/100</span>
                        <span>Confidence: {profile.confidence_level}%</span>
                      </div>
                      <div className="mt-2">
                        <Progress value={profile.risk_score} className="h-2" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Selected Risk Profile Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Risk Profile Details
                  </CardTitle>
                  <CardDescription>
                    Detailed analysis for {selectedRiskProfile.visitor_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Visit Frequency:</span>
                      <p className="text-gray-600">{selectedRiskProfile.visit_frequency} visits</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Visit:</span>
                      <p className="text-gray-600">{selectedRiskProfile.last_visit}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Risk Factors Analysis</h5>
                    <div className="space-y-2">
                      {Object.entries(selectedRiskProfile.risk_factors).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                          <span className="text-gray-800 font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Behavioral Notes</h5>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {selectedRiskProfile.behavioral_notes}
                    </p>
                  </div>

                  <Alert className={`border-${selectedRiskProfile.risk_level === 'high' ? 'red' : selectedRiskProfile.risk_level === 'medium' ? 'yellow' : 'green'}-200 bg-${selectedRiskProfile.risk_level === 'high' ? 'red' : selectedRiskProfile.risk_level === 'medium' ? 'yellow' : 'green'}-50`}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>AI Recommendation:</strong> {
                        selectedRiskProfile.risk_level === 'high' 
                          ? 'Requires additional verification and security escort'
                          : selectedRiskProfile.risk_level === 'medium'
                          ? 'Standard verification with extra attention to unusual patterns'
                          : 'Standard verification process is sufficient'
                      }
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Anomaly Detection Tab */}
          <TabsContent value="anomalies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Behavioral Anomaly Detection
                </CardTitle>
                <CardDescription>
                  AI-powered detection of unusual patterns and security concerns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoAnomalies.map((anomaly) => (
                    <div key={anomaly.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(anomaly.severity)}
                          <h4 className="font-medium">{anomaly.description}</h4>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeVariant(anomaly.severity)}`}>
                          {anomaly.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Detected:</span> {anomaly.detected_at}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {anomaly.type.replace('_', ' ')}
                        </div>
                        {anomaly.visitor_count && (
                          <div>
                            <span className="font-medium">Affected Visitors:</span> {anomaly.visitor_count}
                          </div>
                        )}
                        {anomaly.visitor_name && (
                          <div>
                            <span className="font-medium">Visitor:</span> {anomaly.visitor_name}
                          </div>
                        )}
                      </div>
                    </div>
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
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  AI-Generated Recommendations
                </CardTitle>
                <CardDescription>
                  Intelligent suggestions for security improvements and process optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoRecommendations.map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{rec.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeVariant(rec.priority)}`}>
                          {rec.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{rec.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Type:</span>
                          <Badge variant="outline">{rec.type.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Effort:</span>
                          <Badge variant="outline">{rec.implementation_effort}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavioral Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Pattern Analysis
                  </CardTitle>
                  <CardDescription>
                    AI insights into visitor behavior patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Peak Visit Hours</span>
                        <span className="text-sm text-gray-600">2-4 PM</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Regular Visitors</span>
                        <span className="text-sm text-gray-600">68%</span>
                      </div>
                      <Progress value={68} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">After-hours Access</span>
                        <span className="text-sm text-gray-600">12%</span>
                      </div>
                      <Progress value={12} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    Predictive Analytics
                  </CardTitle>
                  <CardDescription>
                    AI predictions for upcoming security events
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Tomorrow's Prediction:</strong> Expected 23% increase in visitor volume between 2-3 PM
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Risk Alert:</strong> 3 high-risk visitors scheduled for this week
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Optimization:</strong> Implementing AI recommendations could reduce wait times by 35%
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIFeatureDemo;
