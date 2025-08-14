import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Zap, 
  BarChart3, 
  Eye, 
  Settings, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Activity,
  Target,
  Bot,
  Shield,
  Lightbulb,
  RefreshCw
} from 'lucide-react';

interface AIModel {
  id: string;
  model_name: string;
  model_type: string;
  model_category: string;
  model_version: string;
  deployment_status: string;
  accuracy_score: number;
  inference_latency_ms: number;
  created_at: string;
}

interface AIDecisionRule {
  id: string;
  rule_name: string;
  rule_category: string;
  action_type: string;
  confidence_threshold: number;
  is_active: boolean;
  success_rate: number;
  rule_activation_count: number;
}

interface AIInsight {
  id: string;
  insight_type: string;
  insight_title: string;
  insight_description: string;
  confidence_score: number;
  impact_score: number;
  urgency_score: number;
  insight_status: string;
  generated_at: string;
}

const AIMLDashboard: React.FC = () => {
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [decisionRules, setDecisionRules] = useState<AIDecisionRule[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [inferenceResult, setInferenceResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load AI models
      const { data: models, error: modelsError } = await supabase
        .from('ai_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (modelsError) throw modelsError;
      setAiModels(models || []);

      // Load decision rules
      const { data: rules, error: rulesError } = await supabase
        .from('ai_decision_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (rulesError) throw rulesError;
      setDecisionRules(rules || []);

      // Load AI insights
      const { data: insights, error: insightsError } = await supabase
        .from('ai_insights_engine')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(10);

      if (insightsError) throw insightsError;
      setAiInsights(insights || []);

    } catch (err) {
      console.error('Error loading AI dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const runAIInference = async (modelId: string, inputData: any) => {
    try {
      setIsProcessing(true);
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-ml-processing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'ai_inference',
          modelId,
          inputData,
          requireExplanation: true,
          confidenceThreshold: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('AI inference failed');
      }

      const result = await response.json();
      setInferenceResult(result);
      
    } catch (err) {
      console.error('Error running AI inference:', err);
      setError(err instanceof Error ? err.message : 'AI inference failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDecisionRule = async (ruleId: string, inputData: any) => {
    try {
      setIsProcessing(true);
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-ml-processing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'ai_decision',
          ruleId,
          inputData,
          testMode: true
        })
      });

      if (!response.ok) {
        throw new Error('Decision execution failed');
      }

      const result = await response.json();
      console.log('Decision result:', result);
      
      // Refresh dashboard data
      loadDashboardData();
      
    } catch (err) {
      console.error('Error executing decision rule:', err);
      setError(err instanceof Error ? err.message : 'Decision execution failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeText = async (text: string) => {
    try {
      setIsProcessing(true);
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-ml-processing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'text_analysis',
          text,
          analysisTypes: ['sentiment', 'entities', 'topics', 'intent']
        })
      });

      if (!response.ok) {
        throw new Error('Text analysis failed');
      }

      const result = await response.json();
      setInferenceResult(result);
      
    } catch (err) {
      console.error('Error analyzing text:', err);
      setError(err instanceof Error ? err.message : 'Text analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading AI/ML Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI/ML Dashboard</h1>
          <p className="text-muted-foreground">
            Advanced machine learning models and AI-powered automation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            <Brain className="h-3 w-3 mr-1" />
            {aiModels.filter(m => m.deployment_status === 'production').length} Models Active
          </Badge>
          <Button onClick={loadDashboardData} size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* AI Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active AI Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aiModels.filter(m => m.deployment_status === 'production').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {aiModels.length} total models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decision Rules</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {decisionRules.filter(r => r.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {decisionRules.length} total rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Model Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aiModels.length > 0 
                ? Math.round(aiModels.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) / aiModels.length * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Production models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Insights</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aiInsights.filter(i => i.insight_status === 'new').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending review
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="decisions">Decision Rules</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="playground">AI Playground</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Registry</CardTitle>
              <CardDescription>
                Manage and monitor deployed AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {aiModels.map((model) => (
                  <Card key={model.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{model.model_name}</CardTitle>
                        <Badge variant={model.deployment_status === 'production' ? "default" : "secondary"}>
                          {model.deployment_status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {model.model_type} • {model.model_category}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Accuracy:</span>
                        <span className="font-medium">
                          {model.accuracy_score ? Math.round(model.accuracy_score * 100) : 0}%
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Performance</span>
                          <span>{model.accuracy_score ? Math.round(model.accuracy_score * 100) : 0}%</span>
                        </div>
                        <Progress value={model.accuracy_score ? model.accuracy_score * 100 : 0} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Latency: {model.inference_latency_ms || 0}ms</span>
                        <span>v{model.model_version}</span>
                      </div>

                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedModel(model.id);
                          runAIInference(model.id, { test: true, value: 0.8 });
                        }}
                        disabled={isProcessing || model.deployment_status !== 'production'}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Test Model
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Decision Rules</CardTitle>
              <CardDescription>
                Automated decision-making rules and outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {decisionRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{rule.rule_name}</h4>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {rule.rule_category}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Action:</span> {rule.action_type}
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span> {Math.round(rule.confidence_threshold * 100)}%
                        </div>
                        <div>
                          <span className="font-medium">Executions:</span> {rule.rule_activation_count || 0}
                        </div>
                      </div>

                      {rule.success_rate && (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Success Rate</span>
                            <span>{Math.round(rule.success_rate * 100)}%</span>
                          </div>
                          <Progress value={rule.success_rate * 100} className="h-2" />
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Button
                        size="sm"
                        onClick={() => executeDecisionRule(rule.id, { test_execution: true })}
                        disabled={isProcessing || !rule.is_active}
                      >
                        <Bot className="h-3 w-3 mr-1" />
                        Test Rule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>
                Automated insights and recommendations from AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiInsights.map((insight) => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium mb-1">{insight.insight_title}</h4>
                        <Badge variant="outline" className="mb-2">
                          {insight.insight_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={insight.insight_status === 'new' ? "default" : "secondary"}>
                          {insight.insight_status}
                        </Badge>
                        {insight.urgency_score > 0.7 && (
                          <Badge variant="destructive">High Priority</Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {insight.insight_description}
                    </p>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Confidence:</span>
                        <div className="flex items-center mt-1">
                          <Progress value={insight.confidence_score * 100} className="h-2 flex-1" />
                          <span className="ml-2 text-xs">{Math.round(insight.confidence_score * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Impact:</span>
                        <div className="flex items-center mt-1">
                          <Progress value={insight.impact_score * 100} className="h-2 flex-1" />
                          <span className="ml-2 text-xs">{Math.round(insight.impact_score * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Urgency:</span>
                        <div className="flex items-center mt-1">
                          <Progress value={insight.urgency_score * 100} className="h-2 flex-1" />
                          <span className="ml-2 text-xs">{Math.round(insight.urgency_score * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        Generated: {new Date(insight.generated_at).toLocaleDateString()}
                      </span>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Implement
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playground" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI Model Testing</CardTitle>
                <CardDescription>Test AI models with custom input</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Model</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={selectedModel || ''}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    <option value="">Choose a model...</option>
                    {aiModels.filter(m => m.deployment_status === 'production').map(model => (
                      <option key={model.id} value={model.id}>
                        {model.model_name} (v{model.model_version})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Test Input (JSON)</label>
                  <textarea
                    className="w-full p-3 border rounded-md h-32"
                    placeholder='{"visitor_risk_score": 0.3, "access_time": "09:00"}'
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full"
                  onClick={() => {
                    if (selectedModel && testInput) {
                      try {
                        const inputData = JSON.parse(testInput);
                        runAIInference(selectedModel, inputData);
                      } catch (e) {
                        setError('Invalid JSON input');
                      }
                    }
                  }}
                  disabled={!selectedModel || !testInput || isProcessing}
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Run Inference
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Text Analysis</CardTitle>
                <CardDescription>Analyze text with NLP models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Text to Analyze</label>
                  <textarea
                    className="w-full p-3 border rounded-md h-32"
                    placeholder="Enter text for sentiment analysis, entity extraction, etc."
                    onChange={(e) => setTestInput(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full"
                  onClick={() => {
                    if (testInput.trim()) {
                      analyzeText(testInput);
                    }
                  }}
                  disabled={!testInput.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Analyze Text
                </Button>
              </CardContent>
            </Card>
          </div>

          {inferenceResult && (
            <Card>
              <CardHeader>
                <CardTitle>AI Processing Result</CardTitle>
                <CardDescription>Latest inference or analysis result</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96">
                  {JSON.stringify(inferenceResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>AI/ML system status and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall System Health</span>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Model Performance</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Inference Success Rate</span>
                    <span>98%</span>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Decision Accuracy</span>
                    <span>89%</span>
                  </div>
                  <Progress value={89} className="h-2" />
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>AI/ML infrastructure metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Cpu className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU Usage</span>
                        <span>65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Database className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>GPU Utilization</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Avg Response Time</span>
                        <span>245ms</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIMLDashboard;
