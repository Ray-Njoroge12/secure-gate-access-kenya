import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Globe,
  Server,
  Key,
  Shield,
  Zap,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Activity,
  Code,
  Terminal,
  Cloud,
  Network,
  Database,
  BarChart3,
  Send,
  Webhook,
  ListChecks,
  FileText,
  Lock,
  Unlock,
  Link,
  Version,
  GitBranch,
  GitMerge,
  GitCommit,
  Filter,
  Search,
  Settings,
  MoreHorizontal,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Building,
  Cable
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ApiEndpoint {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  category: string;
  version: string;
  description: string;
  authRequired: boolean;
  rateLimit: number; // requests per minute
  status: 'active' | 'deprecated' | 'beta' | 'retired';
  lastUsed: Date;
  averageLatency: number;
  successRate: number;
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: Date;
  lastUsed?: Date;
  status: 'active' | 'revoked' | 'expired';
  usage: {
    totalCalls: number;
    last24h: number;
    errors: number;
    quotaRemaining: number;
  };
  restrictions: {
    ipAddresses?: string[];
    referrers?: string[];
    expiration?: Date;
    rateLimitOverride?: number;
  };
}

interface WebhookSubscription {
  id: string;
  name: string;
  url: string;
  description?: string;
  events: string[];
  secret: string;
  status: 'active' | 'paused' | 'disabled';
  failures: number;
  lastDelivery?: Date;
  successRate: number;
  version: string;
  retries: number;
  deliveryFormat: 'json' | 'cloudevents';
}

interface ApiVersion {
  id: string;
  name: string;
  status: 'current' | 'deprecated' | 'sunset' | 'beta';
  releaseDate: Date;
  sunsetDate?: Date;
  deprecationDate?: Date;
  endpoints: number;
  breakingChanges: number;
  documentationUrl?: string;
  adoptionRate: number;
}

interface SdkPackage {
  id: string;
  language: string;
  version: string;
  repository: string;
  downloads: number;
  lastUpdated: Date;
  status: 'stable' | 'beta' | 'deprecated';
  examples: number;
  maintainer: string;
}

interface ApiMetricSnapshot {
  timestamp: Date;
  totalRequests: number;
  avgLatency: number;
  errorRate: number;
  activeKeys: number;
  webhooksDelivered: number;
}

const APIManagementPortal: React.FC = () => {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [versions, setVersions] = useState<ApiVersion[]>([]);
  const [sdks, setSdks] = useState<SdkPackage[]>([]);
  const [metrics, setMetrics] = useState<ApiMetricSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [showDeprecated, setShowDeprecated] = useState(false);
  const [activeTab, setActiveTab] = useState('endpoints');

  const fetchApiData = useCallback(async () => {
    setLoading(true);
    try {
      const mockEndpoints: ApiEndpoint[] = [
        {
          id: 'ep-001',
            name: 'List Invitations',
            path: '/api/v1/invitations',
            method: 'GET',
            category: 'Invitations',
            version: 'v1',
            description: 'Retrieve a list of visit invitations with optional filters',
            authRequired: true,
            rateLimit: 120,
            status: 'active',
            lastUsed: new Date('2025-08-14T10:30:00'),
            averageLatency: 124,
            successRate: 99.2
        },
        {
          id: 'ep-002',
            name: 'Create Invitation',
            path: '/api/v1/invitations',
            method: 'POST',
            category: 'Invitations',
            version: 'v1',
            description: 'Create a new visit invitation with visitor details',
            authRequired: true,
            rateLimit: 60,
            status: 'active',
            lastUsed: new Date('2025-08-14T10:32:00'),
            averageLatency: 210,
            successRate: 98.7
        },
        {
          id: 'ep-003',
            name: 'Verify Access Code',
            path: '/api/v1/access/verify',
            method: 'POST',
            category: 'Access Control',
            version: 'v1',
            description: 'Verify a visitor access code for gate entry',
            authRequired: true,
            rateLimit: 300,
            status: 'active',
            lastUsed: new Date('2025-08-14T10:35:00'),
            averageLatency: 98,
            successRate: 99.8
        },
        {
          id: 'ep-004',
            name: 'Generate Access Code',
            path: '/api/v1/access/generate',
            method: 'POST',
            category: 'Access Control',
            version: 'v1',
            description: 'Generate a secure access code for a visitor',
            authRequired: true,
            rateLimit: 45,
            status: 'active',
            lastUsed: new Date('2025-08-14T10:33:00'),
            averageLatency: 156,
            successRate: 97.9
        },
        {
          id: 'ep-005',
            name: 'Get Visitor Data',
            path: '/api/v1/visitors/:id',
            method: 'GET',
            category: 'Visitors',
            version: 'v1',
            description: 'Retrieve visitor profile and visit history',
            authRequired: true,
            rateLimit: 240,
            status: 'active',
            lastUsed: new Date('2025-08-14T10:29:00'),
            averageLatency: 180,
            successRate: 98.3
        },
        {
          id: 'ep-006',
            name: 'List Invitations (Legacy)',
            path: '/api/v0/invitations',
            method: 'GET',
            category: 'Invitations',
            version: 'v0',
            description: 'Legacy endpoint for listing invitations',
            authRequired: true,
            rateLimit: 100,
            status: 'deprecated',
            lastUsed: new Date('2025-08-10T08:00:00'),
            averageLatency: 190,
            successRate: 94.1
        }
      ];

      const mockKeys: ApiKey[] = [
        {
          id: 'key-001',
          name: 'Production Backend',
          prefix: 'prod_bk_9f3a',
          scopes: ['invitations.read', 'invitations.write', 'access.verify', 'visitors.read'],
          createdAt: new Date('2025-06-01T10:00:00'),
          lastUsed: new Date('2025-08-14T10:30:00'),
          status: 'active',
          usage: {
            totalCalls: 142345,
            last24h: 3489,
            errors: 23,
            quotaRemaining: 82340
          },
          restrictions: {
            ipAddresses: ['192.168.1.10', '192.168.1.11'],
            rateLimitOverride: 600
          }
        },
        {
          id: 'key-002',
          name: 'Mobile App',
          prefix: 'mob_app_d3e1',
          scopes: ['invitations.read', 'access.verify'],
          createdAt: new Date('2025-07-10T09:00:00'),
          lastUsed: new Date('2025-08-14T10:34:00'),
          status: 'active',
          usage: {
            totalCalls: 48321,
            last24h: 985,
            errors: 12,
            quotaRemaining: 19234
          },
          restrictions: {
            referrers: ['app.securegate.com'],
            rateLimitOverride: 300
          }
        },
        {
          id: 'key-003',
          name: 'Legacy Integration',
          prefix: 'legacy_c9a0',
          scopes: ['invitations.read'],
          createdAt: new Date('2025-02-01T12:00:00'),
          lastUsed: new Date('2025-08-01T05:00:00'),
          status: 'revoked',
          usage: {
            totalCalls: 80345,
            last24h: 0,
            errors: 902,
            quotaRemaining: 0
          },
          restrictions: {}
        }
      ];

      const mockWebhooks: WebhookSubscription[] = [
        {
          id: 'wh-001',
          name: 'Invitation Created',
          url: 'https://api.partner.com/hooks/invitations',
          description: 'Notify partner system of new invitations',
            events: ['invitation.created', 'invitation.updated'],
          secret: 'whsec_***********',
          status: 'active',
          failures: 2,
          lastDelivery: new Date('2025-08-14T10:30:00'),
          successRate: 99.1,
          version: 'v1',
          retries: 3,
          deliveryFormat: 'json'
        },
        {
          id: 'wh-002',
          name: 'Access Events Stream',
          url: 'https://security.partner.com/hooks/access',
          events: ['access.verified', 'access.denied'],
          secret: 'whsec_***********',
          status: 'paused',
          failures: 12,
          lastDelivery: new Date('2025-08-14T09:50:00'),
          successRate: 91.4,
          version: 'v1',
          retries: 5,
          deliveryFormat: 'cloudevents'
        }
      ];

      const mockVersions: ApiVersion[] = [
        {
          id: 'ver-001',
          name: 'v1',
          status: 'current',
          releaseDate: new Date('2025-05-01'),
          endpoints: 42,
          breakingChanges: 0,
          documentationUrl: 'https://docs.securegate.com/api/v1',
          adoptionRate: 82
        },
        {
          id: 'ver-000',
          name: 'v0',
          status: 'deprecated',
          releaseDate: new Date('2024-10-01'),
          deprecationDate: new Date('2025-07-01'),
          sunsetDate: new Date('2025-12-31'),
          endpoints: 39,
          breakingChanges: 12,
          documentationUrl: 'https://docs.securegate.com/api/v0',
          adoptionRate: 18
        }
      ];

      const mockSdks: SdkPackage[] = [
        {
          id: 'sdk-001',
          language: 'TypeScript / JavaScript',
          version: '1.4.2',
          repository: 'github.com/securegate/sdk-js',
          downloads: 12450,
          lastUpdated: new Date('2025-08-10'),
          status: 'stable',
          examples: 23,
          maintainer: 'devrel@securegate.com'
        },
        {
          id: 'sdk-002',
          language: 'Python',
          version: '0.9.1',
          repository: 'github.com/securegate/sdk-python',
          downloads: 2840,
          lastUpdated: new Date('2025-08-08'),
          status: 'beta',
          examples: 15,
          maintainer: 'devrel@securegate.com'
        }
      ];

      const now = Date.now();
      const mockMetrics: ApiMetricSnapshot[] = Array.from({ length: 12 }).map((_, i) => ({
        timestamp: new Date(now - (11 - i) * 3600 * 1000),
        totalRequests: 8000 + Math.round(Math.random() * 2000),
        avgLatency: 120 + Math.round(Math.random() * 40),
        errorRate: 0.5 + Math.random() * 0.7,
        activeKeys: 45 + Math.round(Math.random() * 5),
        webhooksDelivered: 200 + Math.round(Math.random() * 50)
      }));

      setEndpoints(mockEndpoints);
      setApiKeys(mockKeys);
      setWebhooks(mockWebhooks);
      setVersions(mockVersions);
      setSdks(mockSdks);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading API data', error);
      toast({
        title: 'Load Failed',
        description: 'Could not load API management data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiData();
  }, [fetchApiData]);

  const createApiKey = () => {
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: 'New Key',
      prefix: 'new_key_' + Math.random().toString(36).substring(2, 6),
      scopes: ['invitations.read'],
      createdAt: new Date(),
      status: 'active',
      usage: { totalCalls: 0, last24h: 0, errors: 0, quotaRemaining: 10000 },
      restrictions: {}
    };
    setApiKeys(prev => [newKey, ...prev]);
    toast({ title: 'API Key Created', description: 'New API key has been generated' });
  };

  const rotateKey = (id: string) => {
    toast({ title: 'Key Rotation', description: 'API key rotation simulated (mock)' });
  };

  const revokeKey = (id: string) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
    toast({ title: 'Key Revoked', description: 'API key revoked successfully' });
  };

  const filteredEndpoints = endpoints.filter(ep => {
    const matchesSearch = ep.name.toLowerCase().includes(searchTerm.toLowerCase()) || ep.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || ep.category === filterCategory;
    const matchesMethod = filterMethod === 'all' || ep.method === filterMethod;
    const matchesDeprecated = showDeprecated || ep.status !== 'deprecated';
    return matchesSearch && matchesCategory && matchesMethod && matchesDeprecated;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Server className="h-6 w-6 animate-pulse" />
          <span>Loading API Management Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Server className="h-8 w-8" />
            API Management Portal
          </h1>
          <p className="text-muted-foreground">Manage APIs, keys, webhooks, versions, and developer ecosystem</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchApiData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={createApiKey}>
            <Plus className="h-4 w-4 mr-2" />
            New API Key
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
            <CardDescription>Total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{endpoints.length}</div>
            <p className="text-xs text-muted-foreground">{endpoints.filter(e => e.status === 'deprecated').length} deprecated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <CardDescription>Active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.filter(k => k.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Total {apiKeys.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <CardDescription>Subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhooks.length}</div>
            <p className="text-xs text-muted-foreground">{webhooks.filter(w => w.status === 'paused').length} paused</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Versions</CardTitle>
            <CardDescription>Lifecycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{versions.length}</div>
            <p className="text-xs text-muted-foreground">{versions.filter(v => v.status === 'deprecated').length} deprecated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SDKs</CardTitle>
            <CardDescription>Languages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sdks.length}</div>
            <p className="text-xs text-muted-foreground">{sdks.filter(s => s.status === 'beta').length} beta</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="sdks">SDKs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search endpoints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {[...new Set(endpoints.map(e => e.category))].map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch checked={showDeprecated} onCheckedChange={setShowDeprecated} />
              <Label className="text-sm">Show Deprecated</Label>
            </div>
          </div>

          <div className="space-y-4">
            {filteredEndpoints.map(ep => (
              <Card key={ep.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`text-xs font-mono ${
                        ep.method === 'GET' ? 'border-blue-500 text-blue-600' :
                        ep.method === 'POST' ? 'border-green-500 text-green-600' :
                        ep.method === 'PUT' ? 'border-orange-500 text-orange-600' :
                        ep.method === 'DELETE' ? 'border-red-500 text-red-600' :
                        'border-purple-500 text-purple-600'
                      }`}>{ep.method}</Badge>
                      <div>
                        <CardTitle className="text-sm">{ep.name}</CardTitle>
                        <CardDescription className="text-xs font-mono">{ep.path}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{ep.version}</Badge>
                      <Badge variant="outline" className={`text-xs capitalize ${
                        ep.status === 'active' ? 'border-green-500 text-green-600' :
                        ep.status === 'deprecated' ? 'border-yellow-500 text-yellow-600' :
                        ep.status === 'beta' ? 'border-blue-500 text-blue-600' : 'border-gray-500 text-gray-600'
                      }`}>{ep.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div className="md:col-span-2">
                      <div className="text-muted-foreground">Description</div>
                      <div className="font-medium text-sm">{ep.description}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Rate Limit</div>
                      <div className="font-medium">{ep.rateLimit}/min</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Success Rate</div>
                      <div className="font-medium">{ep.successRate}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Latency</div>
                      <div className="font-medium">{ep.averageLatency} ms</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last Used</div>
                      <div className="font-medium">{ep.lastUsed.toLocaleTimeString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Auth</div>
                      <div className="font-medium">{ep.authRequired ? 'Required' : 'Open'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline"><Code className="h-3 w-3 mr-1" /> Docs</Button>
                    <Button size="sm" variant="outline"><Activity className="h-3 w-3 mr-1" /> Metrics</Button>
                    <Button size="sm" variant="outline"><Terminal className="h-3 w-3 mr-1" /> Try</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">API Keys</h3>
              <p className="text-sm text-muted-foreground">Manage authentication credentials</p>
            </div>
            <Button size="sm" onClick={createApiKey}><Plus className="h-4 w-4 mr-2" />Create Key</Button>
          </div>
          <div className="space-y-4">
            {apiKeys.map(key => (
              <Card key={key.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Key className="h-4 w-4" /> {key.name}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono">{key.prefix}********</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs capitalize ${
                        key.status === 'active' ? 'border-green-500 text-green-600' :
                        key.status === 'revoked' ? 'border-red-500 text-red-600' : 'border-gray-500 text-gray-600'
                      }`}>{key.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                    <div>
                      <div className="text-muted-foreground">Scopes</div>
                      <div className="font-medium">{key.scopes.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Calls (24h)</div>
                      <div className="font-medium">{key.usage.last24h}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Errors</div>
                      <div className="font-medium">{key.usage.errors}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Quota Remaining</div>
                      <div className="font-medium">{key.usage.quotaRemaining}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last Used</div>
                      <div className="font-medium">{key.lastUsed ? key.lastUsed.toLocaleTimeString() : 'Never'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" /> Reveal</Button>
                    <Button size="sm" variant="outline" onClick={() => rotateKey(key.id)} disabled={key.status !== 'active'}><RefreshCw className="h-3 w-3 mr-1" /> Rotate</Button>
                    <Button size="sm" variant="outline" onClick={() => revokeKey(key.id)} disabled={key.status !== 'active'}><XCircle className="h-3 w-3 mr-1" /> Revoke</Button>
                    <Button size="sm" variant="outline"><Copy className="h-3 w-3 mr-1" /> Copy</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Webhook Subscriptions</h3>
              <p className="text-sm text-muted-foreground">Event delivery configuration</p>
            </div>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Webhook</Button>
          </div>
          <div className="space-y-4">
            {webhooks.map(hook => (
              <Card key={hook.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Send className="h-4 w-4" /> {hook.name}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono truncate max-w-xs">{hook.url}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{hook.deliveryFormat}</Badge>
                      <Badge variant="outline" className={`text-xs capitalize ${
                        hook.status === 'active' ? 'border-green-500 text-green-600' :
                        hook.status === 'paused' ? 'border-yellow-500 text-yellow-600' : 'border-gray-500 text-gray-600'
                      }`}>{hook.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
                    <div className="md:col-span-2">
                      <div className="text-muted-foreground">Events</div>
                      <div className="font-medium">{hook.events.join(', ')}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Success Rate</div>
                      <div className="font-medium">{hook.successRate}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Failures</div>
                      <div className="font-medium">{hook.failures}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Retries</div>
                      <div className="font-medium">{hook.retries}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last Delivery</div>
                      <div className="font-medium">{hook.lastDelivery ? hook.lastDelivery.toLocaleTimeString() : 'Never'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline"><Activity className="h-3 w-3 mr-1" /> Replay</Button>
                    <Button size="sm" variant="outline"><Shield className="h-3 w-3 mr-1" /> Reveal Secret</Button>
                    <Button size="sm" variant="outline"><Edit className="h-3 w-3 mr-1" /> Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">API Versions</h3>
              <p className="text-sm text-muted-foreground">Lifecycle and adoption</p>
            </div>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />New Version</Button>
          </div>
          <div className="space-y-4">
            {versions.map(ver => (
              <Card key={ver.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <GitBranch className="h-4 w-4" /> {ver.name}
                      </CardTitle>
                      <CardDescription className="text-xs">Released {ver.releaseDate.toLocaleDateString()}</CardDescription>
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize ${
                      ver.status === 'current' ? 'border-green-500 text-green-600' :
                      ver.status === 'deprecated' ? 'border-yellow-500 text-yellow-600' :
                      ver.status === 'sunset' ? 'border-red-500 text-red-600' : 'border-blue-500 text-blue-600'
                    }`}>{ver.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                    <div>
                      <div className="text-muted-foreground">Endpoints</div>
                      <div className="font-medium">{ver.endpoints}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Breaking Changes</div>
                      <div className="font-medium">{ver.breakingChanges}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Adoption</div>
                      <div className="font-medium">{ver.adoptionRate}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Documentation</div>
                      <div className="font-medium">{ver.documentationUrl ? 'Available' : 'Missing'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Lifecycle</div>
                      <div className="font-medium">{ver.status === 'deprecated' && ver.sunsetDate ? `Sunsets ${ver.sunsetDate.toLocaleDateString()}` : ver.status === 'current' ? 'Stable' : 'Active'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline"><FileText className="h-3 w-3 mr-1" /> Changelog</Button>
                    <Button size="sm" variant="outline"><GitMerge className="h-3 w-3 mr-1" /> Diff</Button>
                    <Button size="sm" variant="outline"><AlertTriangle className="h-3 w-3 mr-1" /> Deprecate</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SDKs Tab */}
        <TabsContent value="sdks" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">SDK Packages</h3>
              <p className="text-sm text-muted-foreground">Developer tools and libraries</p>
            </div>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add SDK</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sdks.map(sdk => (
              <Card key={sdk.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{sdk.language}</CardTitle>
                      <CardDescription className="text-xs font-mono">{sdk.repository}</CardDescription>
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize ${
                      sdk.status === 'stable' ? 'border-green-500 text-green-600' :
                      sdk.status === 'beta' ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'
                    }`}>{sdk.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-muted-foreground">Version</div>
                      <div className="font-medium">{sdk.version}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Downloads</div>
                      <div className="font-medium">{sdk.downloads}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Examples</div>
                      <div className="font-medium">{sdk.examples}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last Updated</div>
                      <div className="font-medium">{sdk.lastUpdated.toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> Download</Button>
                    <Button size="sm" variant="outline"><Code className="h-3 w-3 mr-1" /> Samples</Button>
                    <Button size="sm" variant="outline"><Activity className="h-3 w-3 mr-1" /> Metrics</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Analytics Overview</CardTitle>
              <CardDescription>Performance and usage indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 text-xs">
                <div className="p-3 border rounded">
                  <div className="text-muted-foreground">Avg Latency</div>
                  <div className="font-medium text-lg">{Math.round(metrics.reduce((a, m) => a + m.avgLatency, 0) / metrics.length)} ms</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-muted-foreground">Requests (hr)</div>
                  <div className="font-medium text-lg">{metrics[metrics.length - 1]?.totalRequests}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-muted-foreground">Error Rate</div>
                  <div className="font-medium text-lg">{metrics[metrics.length - 1]?.errorRate.toFixed(2)}%</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-muted-foreground">Active Keys</div>
                  <div className="font-medium text-lg">{metrics[metrics.length - 1]?.activeKeys}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-muted-foreground">Webhook Events</div>
                  <div className="font-medium text-lg">{metrics[metrics.length - 1]?.webhooksDelivered}</div>
                </div>
              </div>
              <div className="space-y-4">
                {metrics.slice(-5).map(m => (
                  <div key={m.timestamp.toISOString()} className="flex items-center justify-between text-xs p-2 border rounded bg-muted/30">
                    <span>{m.timestamp.toLocaleTimeString()}</span>
                    <span>{m.totalRequests} req</span>
                    <span>{m.avgLatency} ms</span>
                    <span>{m.errorRate.toFixed(2)}% errors</span>
                    <span>{m.activeKeys} keys</span>
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

export default APIManagementPortal;
