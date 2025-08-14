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
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Building2, 
  Settings, 
  Trash2, 
  Edit, 
  TestTube2, 
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Cloud,
  Shield
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  type: 'whatsapp' | 'sms' | 'email' | 'property_management' | 'calendar' | 'security';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  description: string;
  settings: Record<string, any>;
  last_sync: string;
  created_at: string;
  endpoints?: string[];
  features?: string[];
}

const ThirdPartyIntegrations: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  // Configuration form state
  const [config, setConfig] = useState({
    type: '',
    name: '',
    settings: {} as Record<string, any>
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      // Simulate loading integrations
      setIntegrations([
        {
          id: '1',
          name: 'WhatsApp Business',
          type: 'whatsapp',
          status: 'connected',
          description: 'Send visitor notifications via WhatsApp',
          settings: {
            account_id: 'wa_123456789',
            phone_number: '+254700123456',
            webhook_url: 'https://api.whatsapp.com/webhook'
          },
          last_sync: new Date().toISOString(),
          created_at: new Date().toISOString(),
          endpoints: ['/send-message', '/get-status'],
          features: ['Send Messages', 'Receive Status', 'Media Support']
        },
        {
          id: '2',
          name: 'Twilio SMS',
          type: 'sms',
          status: 'connected',
          description: 'SMS notifications for access codes',
          settings: {
            account_sid: 'AC123456789',
            auth_token: '***hidden***',
            phone_number: '+254700654321'
          },
          last_sync: new Date().toISOString(),
          created_at: new Date().toISOString(),
          endpoints: ['/send-sms'],
          features: ['Send SMS', 'Delivery Status']
        },
        {
          id: '3',
          name: 'SendGrid Email',
          type: 'email',
          status: 'connected',
          description: 'Email invitations and notifications',
          settings: {
            api_key: '***hidden***',
            from_email: 'noreply@securegatekenya.com',
            template_id: 'd-123456789'
          },
          last_sync: new Date().toISOString(),
          created_at: new Date().toISOString(),
          endpoints: ['/send-email'],
          features: ['Send Emails', 'Templates', 'Analytics']
        },
        {
          id: '4',
          name: 'Property Management Pro',
          type: 'property_management',
          status: 'pending',
          description: 'Sync with property management system',
          settings: {
            api_url: 'https://pmp.example.com/api',
            api_key: '***hidden***'
          },
          last_sync: '',
          created_at: new Date().toISOString(),
          endpoints: ['/residents', '/properties', '/leases'],
          features: ['Resident Sync', 'Property Data', 'Lease Management']
        }
      ]);
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast({
        title: "Error",
        description: "Failed to load integrations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const configureIntegration = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would save to the database
      toast({
        title: "Integration Configured",
        description: "Integration settings have been saved successfully",
      });
      
      setIsConfigureOpen(false);
      setConfig({ type: '', name: '', settings: {} });
      loadIntegrations();
    } catch (error) {
      console.error('Error configuring integration:', error);
      toast({
        title: "Error",
        description: "Failed to configure integration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testIntegration = async (integrationId: string) => {
    try {
      // In a real implementation, this would test the integration
      toast({
        title: "Test Successful",
        description: "Integration test completed successfully",
      });
    } catch (error) {
      console.error('Error testing integration:', error);
      toast({
        title: "Test Failed",
        description: "Integration test failed",
        variant: "destructive",
      });
    }
  };

  const syncIntegration = async (integrationId: string) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would trigger a sync
      toast({
        title: "Sync Started",
        description: "Integration sync has been initiated",
      });
      loadIntegrations();
    } catch (error) {
      console.error('Error syncing integration:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync integration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <MessageSquare className="h-5 w-5 text-green-600" />;
      case 'sms':
        return <Phone className="h-5 w-5 text-blue-600" />;
      case 'email':
        return <Mail className="h-5 w-5 text-purple-600" />;
      case 'property_management':
        return <Building2 className="h-5 w-5 text-orange-600" />;
      case 'calendar':
        return <Clock className="h-5 w-5 text-indigo-600" />;
      case 'security':
        return <Shield className="h-5 w-5 text-red-600" />;
      default:
        return <Cloud className="h-5 w-5 text-gray-600" />;
    }
  };

  const connectedIntegrations = integrations.filter(i => i.status === 'connected');
  const pendingIntegrations = integrations.filter(i => i.status === 'pending');
  const errorIntegrations = integrations.filter(i => i.status === 'error');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Third-Party Integrations</h1>
          <p className="text-muted-foreground">
            Connect and manage external services for enhanced functionality
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Phase 8 - Enterprise Integration
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="property" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Property Systems
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security & Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{connectedIntegrations.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active integrations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingIntegrations.length}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting configuration
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{errorIntegrations.length}</div>
                <p className="text-xs text-muted-foreground">
                  Need attention
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getIntegrationIcon(integration.type)}
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {integration.name}
                          {getStatusIcon(integration.status)}
                        </CardTitle>
                        <CardDescription>{integration.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => testIntegration(integration.id)}
                      >
                        <TestTube2 className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => syncIntegration(integration.id)}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Sync
                      </Button>
                      <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                        {integration.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Last Sync:</span>{' '}
                      {integration.last_sync 
                        ? new Date(integration.last_sync).toLocaleString()
                        : 'Never'
                      }
                    </div>
                  </div>
                  
                  {integration.features && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {integration.endpoints && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Available Endpoints</h4>
                      <div className="space-y-1">
                        {integration.endpoints.map((endpoint) => (
                          <code key={endpoint} className="block text-xs bg-muted p-1 rounded">
                            {endpoint}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add New Integration</CardTitle>
              <CardDescription>
                Connect a new third-party service to enhance your gate access system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-xs">WhatsApp</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Phone className="h-5 w-5" />
                  <span className="text-xs">SMS Gateway</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Mail className="h-5 w-5" />
                  <span className="text-xs">Email Service</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Building2 className="h-5 w-5" />
                  <span className="text-xs">Property Mgmt</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <h2 className="text-2xl font-semibold">Communication Integrations</h2>
          
          <div className="grid gap-4">
            {integrations
              .filter(i => ['whatsapp', 'sms', 'email'].includes(i.type))
              .map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getIntegrationIcon(integration.type)}
                        <div>
                          <CardTitle>{integration.name}</CardTitle>
                          <CardDescription>{integration.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(integration.settings).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>{' '}
                            <span className="font-mono text-xs">
                              {typeof value === 'string' && value.includes('***') 
                                ? value 
                                : value
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <Alert>
                        <AlertDescription>
                          This integration automatically sends notifications for visitor arrivals, 
                          access code generation, and security alerts.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
              <CardDescription>
                Customize notification templates for different communication channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visitor-arrival">Visitor Arrival Notification</Label>
                <Textarea
                  id="visitor-arrival"
                  defaultValue="Hi {{resident_name}}, your visitor {{visitor_name}} has arrived at the gate. Access code: {{access_code}}"
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="access-granted">Access Granted Notification</Label>
                <Textarea
                  id="access-granted"
                  defaultValue="Access granted to {{visitor_name}} at {{timestamp}}. Gate entry logged successfully."
                  className="min-h-[60px]"
                />
              </div>
              <div className="flex justify-end">
                <Button>Save Templates</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="property" className="space-y-6">
          <h2 className="text-2xl font-semibold">Property Management Systems</h2>
          
          <div className="grid gap-4">
            {integrations
              .filter(i => i.type === 'property_management')
              .map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getIntegrationIcon(integration.type)}
                        <div>
                          <CardTitle>{integration.name}</CardTitle>
                          <CardDescription>{integration.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert>
                        <AlertDescription>
                          Sync resident data, property information, and lease details 
                          to automatically manage access permissions.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <h4 className="font-medium">Sync Settings</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="auto-sync">Automatic Sync</Label>
                            <Switch id="auto-sync" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="sync-residents">Sync Residents</Label>
                            <Switch id="sync-residents" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="sync-properties">Sync Properties</Label>
                            <Switch id="sync-properties" defaultChecked />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sync-frequency">Sync Frequency</Label>
                        <Select defaultValue="hourly">
                          <SelectTrigger className="max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">Real-time</SelectItem>
                            <SelectItem value="hourly">Every hour</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Data Mapping</CardTitle>
              <CardDescription>
                Configure how property management data maps to your gate access system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Property System Field</Label>
                  <Select defaultValue="tenant_name">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant_name">tenant_name</SelectItem>
                      <SelectItem value="resident_name">resident_name</SelectItem>
                      <SelectItem value="occupant_name">occupant_name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gate System Field</Label>
                  <Select defaultValue="resident_name">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resident_name">resident_name</SelectItem>
                      <SelectItem value="full_name">full_name</SelectItem>
                      <SelectItem value="display_name">display_name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Save Mapping</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <h2 className="text-2xl font-semibold">Security & Access Integrations</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Available Security Integrations</CardTitle>
              <CardDescription>
                Connect with security systems and access control devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Shield className="h-6 w-6" />
                  <span className="text-sm">CCTV Systems</span>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Zap className="h-6 w-6" />
                  <span className="text-sm">Alarm Systems</span>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Building2 className="h-6 w-6" />
                  <span className="text-sm">Gate Controllers</span>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Event Forwarding</CardTitle>
              <CardDescription>
                Configure how security events are forwarded to external systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="forward-access-events">Forward Access Events</Label>
                  <Switch id="forward-access-events" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="forward-security-alerts">Forward Security Alerts</Label>
                  <Switch id="forward-security-alerts" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="forward-visitor-logs">Forward Visitor Logs</Label>
                  <Switch id="forward-visitor-logs" />
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All security events are encrypted and transmitted over secure channels.
                  Event forwarding helps maintain comprehensive security audit trails.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ThirdPartyIntegrations;
