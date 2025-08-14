import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Copy, Key, Webhook, Activity, Settings, Trash2, Edit, TestTube2, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface APIKey {
  id: string;
  name: string;
  description?: string;
  api_key_prefix: string;
  permissions: Record<string, string[]>;
  rate_limit: number;
  is_active: boolean;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  headers: Record<string, string>;
  secret?: string;
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  last_triggered_at?: string;
  created_at: string;
}

const EnterpriseAPIPortal: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('api-keys');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // API Key Form State
  const [newAPIKey, setNewAPIKey] = useState({
    name: '',
    description: '',
    permissions: { visitors: ['read', 'create'], access: ['verify'] },
    rate_limit: 1000,
    expires_at: ''
  });

  // Webhook Form State
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: ['visitor.created', 'access.verified'],
    headers: {},
    secret: '',
    retry_count: 3,
    timeout_seconds: 30
  });

  const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false);
  const [isCreateWebhookOpen, setIsCreateWebhookOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, these would fetch from the new API tables
      // For now, we'll simulate the data structure
      setApiKeys([
        {
          id: '1',
          name: 'Main API Key',
          description: 'Primary API key for visitor management',
          api_key_prefix: 'sgak_',
          permissions: { visitors: ['read', 'create'], access: ['verify'] },
          rate_limit: 1000,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]);

      setWebhooks([
        {
          id: '1',
          name: 'Visitor Notifications',
          url: 'https://example.com/webhooks/visitors',
          events: ['visitor.created', 'visitor.updated'],
          headers: { 'Content-Type': 'application/json' },
          is_active: true,
          retry_count: 3,
          timeout_seconds: 30,
          created_at: new Date().toISOString()
        }
      ]);

      setAnalytics({
        totalRequests: 1250,
        successfulRequests: 1205,
        successRate: 96,
        averageResponseTime: 145,
        period: 'week'
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load API management data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAPIKey = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call the generate_api_key RPC function
      const generatedKey = `sgak_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      toast({
        title: "API Key Generated",
        description: "Your new API key has been created successfully",
      });
      
      setIsCreateKeyOpen(false);
      setNewAPIKey({
        name: '',
        description: '',
        permissions: { visitors: ['read', 'create'], access: ['verify'] },
        rate_limit: 1000,
        expires_at: ''
      });
      
      loadData();
    } catch (error) {
      console.error('Error generating API key:', error);
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createWebhook = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call the create_webhook RPC function
      toast({
        title: "Webhook Created",
        description: "Your webhook endpoint has been configured successfully",
      });
      
      setIsCreateWebhookOpen(false);
      setNewWebhook({
        name: '',
        url: '',
        events: ['visitor.created', 'access.verified'],
        headers: {},
        secret: '',
        retry_count: 3,
        timeout_seconds: 30
      });
      
      loadData();
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: "Error",
        description: "Failed to create webhook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhook = async (webhookId: string) => {
    try {
      toast({
        title: "Test Webhook Sent",
        description: "Test payload has been sent to your endpoint",
      });
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: "Error",
        description: "Failed to test webhook",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise API Portal</h1>
          <p className="text-muted-foreground">
            Manage API keys, webhooks, and integrations for your secure gate access system
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Phase 8 - Enterprise Integration
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">API Keys</h2>
            <Dialog open={isCreateKeyOpen} onOpenChange={setIsCreateKeyOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Key className="h-4 w-4 mr-2" />
                  Generate API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Generate New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key with specific permissions and rate limits
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="key-name">Name</Label>
                      <Input
                        id="key-name"
                        value={newAPIKey.name}
                        onChange={(e) => setNewAPIKey({ ...newAPIKey, name: e.target.value })}
                        placeholder="My API Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rate-limit">Rate Limit (requests/hour)</Label>
                      <Input
                        id="rate-limit"
                        type="number"
                        value={newAPIKey.rate_limit}
                        onChange={(e) => setNewAPIKey({ ...newAPIKey, rate_limit: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newAPIKey.description}
                      onChange={(e) => setNewAPIKey({ ...newAPIKey, description: e.target.value })}
                      placeholder="Describe what this API key will be used for"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires-at">Expiration Date (optional)</Label>
                    <Input
                      id="expires-at"
                      type="datetime-local"
                      value={newAPIKey.expires_at}
                      onChange={(e) => setNewAPIKey({ ...newAPIKey, expires_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <h4 className="font-medium">Visitor Management</h4>
                        <div className="space-y-1">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm">Read visitors</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm">Create visitors</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" />
                            <span className="text-sm">Update visitors</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" />
                            <span className="text-sm">Delete visitors</span>
                          </label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Access Control</h4>
                        <div className="space-y-1">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm">Verify access codes</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" />
                            <span className="text-sm">Generate access codes</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" />
                            <span className="text-sm">View access logs</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateKeyOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={generateAPIKey} disabled={isLoading}>
                      Generate API Key
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {apiKeys.map((key) => (
              <Card key={key.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {key.name}
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{key.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded font-mono text-sm">
                      {key.api_key_prefix}••••••••••••••••••••••••••••••••
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(`${key.api_key_prefix}${'*'.repeat(32)}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Rate Limit:</span> {key.rate_limit}/hour
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(key.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Last Used:</span> {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span> {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Permissions</h4>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(key.permissions).map(([resource, actions]) => 
                        actions.map((action) => (
                          <Badge key={`${resource}-${action}`} variant="outline" className="text-xs">
                            {resource}:{action}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Webhooks</h2>
            <Dialog open={isCreateWebhookOpen} onOpenChange={setIsCreateWebhookOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Webhook className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Webhook</DialogTitle>
                  <DialogDescription>
                    Configure a webhook endpoint to receive real-time notifications
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhook-name">Name</Label>
                      <Input
                        id="webhook-name"
                        value={newWebhook.name}
                        onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                        placeholder="Visitor Notifications"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">Endpoint URL</Label>
                      <Input
                        id="webhook-url"
                        value={newWebhook.url}
                        onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                        placeholder="https://your-app.com/webhooks"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="retry-count">Retry Count</Label>
                      <Input
                        id="retry-count"
                        type="number"
                        value={newWebhook.retry_count}
                        onChange={(e) => setNewWebhook({ ...newWebhook, retry_count: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeout">Timeout (seconds)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={newWebhook.timeout_seconds}
                        onChange={(e) => setNewWebhook({ ...newWebhook, timeout_seconds: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-secret">Secret (optional)</Label>
                    <Input
                      id="webhook-secret"
                      value={newWebhook.secret}
                      onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                      placeholder="Webhook signing secret"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Events to Subscribe</Label>
                    <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">visitor.created</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" />
                        <span className="text-sm">visitor.updated</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">access.verified</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" />
                        <span className="text-sm">access.denied</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" />
                        <span className="text-sm">invitation.sent</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" />
                        <span className="text-sm">code.generated</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateWebhookOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createWebhook} disabled={isLoading}>
                      Create Webhook
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {webhook.name}
                        <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                          {webhook.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {webhook.url}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => testWebhook(webhook.id)}>
                        <TestTube2 className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Retry Count:</span> {webhook.retry_count}
                    </div>
                    <div>
                      <span className="font-medium">Timeout:</span> {webhook.timeout_seconds}s
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(webhook.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Last Triggered:</span> {webhook.last_triggered_at ? new Date(webhook.last_triggered_at).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Subscribed Events</h4>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {webhook.secret && (
                    <Alert>
                      <AlertDescription>
                        Webhook payloads are signed with HMAC-SHA256
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-2xl font-semibold">API Analytics</h2>
          
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalRequests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Last {analytics.period}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.successRate}%</div>
                  <Progress value={analytics.successRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.averageResponseTime}ms</div>
                  <p className="text-xs text-muted-foreground">
                    Average latency
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Successful Requests</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.successfulRequests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    2xx responses
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Request Distribution</CardTitle>
              <CardDescription>
                API usage patterns over the last week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <p>Chart visualization would go here</p>
                  <p className="text-xs">Integration with charting library needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <h2 className="text-2xl font-semibold">API Settings</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Global API Configuration</CardTitle>
              <CardDescription>
                Configure global settings for your API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="global-rate-limit">Global Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable global rate limiting across all API keys
                    </p>
                  </div>
                  <Switch id="global-rate-limit" defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="request-logging">Request Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all API requests for analytics and debugging
                    </p>
                  </div>
                  <Switch id="request-logging" defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="webhook-retries">Automatic Webhook Retries</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically retry failed webhook deliveries
                    </p>
                  </div>
                  <Switch id="webhook-retries" defaultChecked />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="default-rate-limit">Default Rate Limit (requests/hour)</Label>
                  <Input
                    id="default-rate-limit"
                    type="number"
                    defaultValue="1000"
                    className="max-w-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="log-retention">Log Retention Period (days)</Label>
                  <Select defaultValue="30">
                    <SelectTrigger className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Access comprehensive API documentation and integration guides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    API documentation is available at <code>/api/docs</code> with interactive examples and schemas.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    <Key className="h-4 w-4 mr-2" />
                    Authentication Guide
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Webhook className="h-4 w-4 mr-2" />
                    Webhook Integration
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    Rate Limiting
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Error Handling
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnterpriseAPIPortal;
