import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Router, 
  Cpu, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  Power, 
  PowerOff, 
  RefreshCw, 
  Download, 
  Upload, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield, 
  Key, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Network, 
  Zap, 
  Activity, 
  Monitor, 
  Bell, 
  BellOff, 
  Calendar, 
  Timer, 
  FileText, 
  Archive, 
  History, 
  Info, 
  Plus, 
  Minus, 
  Search, 
  Filter, 
  Copy, 
  Edit, 
  Trash2, 
  RotateCcw,
  Code,
  Database,
  Cloud,
  Server,
  Terminal
} from 'lucide-react';

interface DeviceConfiguration {
  id: string;
  device_id: string;
  device_name: string;
  device_type: 'gate_controller' | 'camera' | 'sensor' | 'access_reader' | 'intercom' | 'alarm';
  status: 'online' | 'offline' | 'configuring' | 'error';
  config_version: string;
  last_updated: string;
  configuration: {
    network: {
      ip_address: string;
      subnet_mask: string;
      gateway: string;
      dns_primary: string;
      dns_secondary: string;
      wifi_ssid?: string;
      wifi_security?: string;
      static_ip?: boolean;
    };
    security: {
      encryption_enabled: boolean;
      ssl_enabled: boolean;
      authentication_method: string;
      password_policy: string;
      access_level: string;
      certificate_valid_until?: string;
    };
    operation: {
      auto_start: boolean;
      heartbeat_interval: number;
      retry_attempts: number;
      timeout_seconds: number;
      log_level: string;
      maintenance_mode: boolean;
    };
    features: Record<string, any>;
    alerts: {
      enabled: boolean;
      email_notifications: boolean;
      sms_notifications: boolean;
      webhook_url?: string;
      alert_thresholds: Record<string, number>;
    };
  };
}

interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  device_types: string[];
  template_config: any;
  is_default: boolean;
  created_at: string;
}

interface ConfigurationHistory {
  id: string;
  device_id: string;
  config_version: string;
  changes_summary: string;
  changed_by: string;
  timestamp: string;
  rollback_available: boolean;
}

const DeviceConfigurationPanel: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('devices');
  const [deviceConfigs, setDeviceConfigs] = useState<DeviceConfiguration[]>([]);
  const [templates, setTemplates] = useState<ConfigurationTemplate[]>([]);
  const [configHistory, setConfigHistory] = useState<ConfigurationHistory[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    loadConfigurationData();
  }, []);

  const loadConfigurationData = async () => {
    try {
      // Mock device configuration data
      const mockConfigs: DeviceConfiguration[] = [
        {
          id: 'config-1',
          device_id: 'gate-1',
          device_name: 'Main Gate Controller',
          device_type: 'gate_controller',
          status: 'online',
          config_version: '2.4.1',
          last_updated: new Date(Date.now() - 86400000).toISOString(),
          configuration: {
            network: {
              ip_address: '192.168.1.100',
              subnet_mask: '255.255.255.0',
              gateway: '192.168.1.1',
              dns_primary: '8.8.8.8',
              dns_secondary: '8.8.4.4',
              wifi_ssid: 'SecureGate_WiFi',
              wifi_security: 'WPA3',
              static_ip: true
            },
            security: {
              encryption_enabled: true,
              ssl_enabled: true,
              authentication_method: 'certificate',
              password_policy: 'strong',
              access_level: 'admin',
              certificate_valid_until: new Date(Date.now() + 31536000000).toISOString()
            },
            operation: {
              auto_start: true,
              heartbeat_interval: 30,
              retry_attempts: 3,
              timeout_seconds: 60,
              log_level: 'info',
              maintenance_mode: false
            },
            features: {
              auto_close_enabled: true,
              auto_close_delay: 30,
              emergency_override: true,
              visitor_detection: true,
              backup_power: true
            },
            alerts: {
              enabled: true,
              email_notifications: true,
              sms_notifications: false,
              webhook_url: 'https://api.example.com/webhooks/gate-alerts',
              alert_thresholds: {
                temperature: 45,
                battery_low: 20,
                connection_timeout: 120
              }
            }
          }
        },
        {
          id: 'config-2',
          device_id: 'cam-1',
          device_name: 'Main Gate Camera',
          device_type: 'camera',
          status: 'online',
          config_version: '1.8.3',
          last_updated: new Date(Date.now() - 172800000).toISOString(),
          configuration: {
            network: {
              ip_address: '192.168.1.101',
              subnet_mask: '255.255.255.0',
              gateway: '192.168.1.1',
              dns_primary: '8.8.8.8',
              dns_secondary: '8.8.4.4',
              static_ip: true
            },
            security: {
              encryption_enabled: true,
              ssl_enabled: true,
              authentication_method: 'password',
              password_policy: 'medium',
              access_level: 'operator'
            },
            operation: {
              auto_start: true,
              heartbeat_interval: 60,
              retry_attempts: 5,
              timeout_seconds: 30,
              log_level: 'warning',
              maintenance_mode: false
            },
            features: {
              resolution: '1080p',
              fps: 30,
              night_vision: true,
              motion_detection: true,
              facial_recognition: true,
              recording_enabled: true,
              stream_quality: 'high'
            },
            alerts: {
              enabled: true,
              email_notifications: true,
              sms_notifications: true,
              alert_thresholds: {
                motion_sensitivity: 75,
                storage_full: 90,
                connection_lost: 300
              }
            }
          }
        },
        {
          id: 'config-3',
          device_id: 'env-1',
          device_name: 'Environmental Sensor',
          device_type: 'sensor',
          status: 'configuring',
          config_version: '2.1.0',
          last_updated: new Date(Date.now() - 3600000).toISOString(),
          configuration: {
            network: {
              ip_address: '192.168.1.102',
              subnet_mask: '255.255.255.0',
              gateway: '192.168.1.1',
              dns_primary: '8.8.8.8',
              dns_secondary: '8.8.4.4',
              static_ip: false
            },
            security: {
              encryption_enabled: true,
              ssl_enabled: false,
              authentication_method: 'token',
              password_policy: 'basic',
              access_level: 'user'
            },
            operation: {
              auto_start: true,
              heartbeat_interval: 120,
              retry_attempts: 2,
              timeout_seconds: 45,
              log_level: 'debug',
              maintenance_mode: true
            },
            features: {
              sampling_rate: 60,
              temperature_enabled: true,
              humidity_enabled: true,
              air_quality_enabled: true,
              noise_monitoring: true,
              calibration_interval: 86400
            },
            alerts: {
              enabled: true,
              email_notifications: false,
              sms_notifications: false,
              alert_thresholds: {
                temperature_high: 35,
                temperature_low: 5,
                humidity_high: 80,
                air_quality_poor: 150
              }
            }
          }
        }
      ];

      setDeviceConfigs(mockConfigs);
      
      if (!selectedDevice) {
        setSelectedDevice(mockConfigs[0]);
      }

      // Mock configuration templates
      setTemplates([
        {
          id: 'template-1',
          name: 'Default Gate Controller',
          description: 'Standard configuration for gate controllers',
          device_types: ['gate_controller'],
          template_config: {
            operation: { auto_start: true, heartbeat_interval: 30 },
            features: { auto_close_enabled: true, auto_close_delay: 30 }
          },
          is_default: true,
          created_at: new Date(Date.now() - 2592000000).toISOString()
        },
        {
          id: 'template-2',
          name: 'High Security Camera',
          description: 'Enhanced security settings for critical cameras',
          device_types: ['camera'],
          template_config: {
            security: { encryption_enabled: true, ssl_enabled: true },
            features: { facial_recognition: true, recording_enabled: true }
          },
          is_default: false,
          created_at: new Date(Date.now() - 1296000000).toISOString()
        }
      ]);

      // Mock configuration history
      setConfigHistory([
        {
          id: 'history-1',
          device_id: 'gate-1',
          config_version: '2.4.1',
          changes_summary: 'Updated auto-close delay from 20s to 30s',
          changed_by: 'Admin User',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          rollback_available: true
        },
        {
          id: 'history-2',
          device_id: 'cam-1',
          config_version: '1.8.3',
          changes_summary: 'Enabled facial recognition feature',
          changed_by: 'Security Manager',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          rollback_available: true
        },
        {
          id: 'history-3',
          device_id: 'env-1',
          config_version: '2.1.0',
          changes_summary: 'Calibration interval updated, maintenance mode enabled',
          changed_by: 'System Admin',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          rollback_available: false
        }
      ]);

    } catch (error) {
      console.error('Error loading configuration data:', error);
      toast({
        title: "Error",
        description: "Failed to load device configuration data",
        variant: "destructive",
      });
    }
  };

  const saveConfiguration = async () => {
    if (!selectedDevice) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would call the device configuration API
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update config version and last updated
      setSelectedDevice(prev => prev ? {
        ...prev,
        config_version: `${prev.config_version.split('.').slice(0, -1).join('.')}.${parseInt(prev.config_version.split('.').pop() || '0') + 1}`,
        last_updated: new Date().toISOString(),
        status: 'online'
      } : null);

      // Add to history
      const newHistory: ConfigurationHistory = {
        id: Date.now().toString(),
        device_id: selectedDevice.device_id,
        config_version: selectedDevice.config_version,
        changes_summary: 'Configuration updated via Device Configuration Panel',
        changed_by: 'Current User',
        timestamp: new Date().toISOString(),
        rollback_available: true
      };
      
      setConfigHistory(prev => [newHistory, ...prev.slice(0, 9)]);
      setUnsavedChanges(false);

      toast({
        title: "Configuration Saved",
        description: "Device configuration has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save device configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyTemplate = async (templateId: string) => {
    if (!selectedDevice) return;
    
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setSelectedDevice(prev => prev ? {
      ...prev,
      configuration: {
        ...prev.configuration,
        ...template.template_config
      }
    } : null);

    setUnsavedChanges(true);
    
    toast({
      title: "Template Applied",
      description: `${template.name} template has been applied to the device`,
    });
  };

  const rollbackConfiguration = async (historyId: string) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would restore the previous configuration
      toast({
        title: "Configuration Rolled Back",
        description: "Device configuration has been restored to previous version",
      });
    } catch (error) {
      toast({
        title: "Rollback Failed",
        description: "Failed to rollback device configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateDeviceConfig = (path: string[], value: any) => {
    if (!selectedDevice) return;
    
    setSelectedDevice(prev => {
      if (!prev) return null;
      
      const newConfig = { ...prev };
      let current: any = newConfig.configuration;
      
      // Navigate to the nested property
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      // Set the value
      current[path[path.length - 1]] = value;
      
      return newConfig;
    });
    
    setUnsavedChanges(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'configuring': return <Settings className="h-4 w-4 text-blue-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Router className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case 'gate_controller': return <Shield className="h-5 w-5" />;
      case 'camera': return <Monitor className="h-5 w-5" />;
      case 'sensor': return <Activity className="h-5 w-5" />;
      case 'access_reader': return <Key className="h-5 w-5" />;
      case 'intercom': return <Network className="h-5 w-5" />;
      case 'alarm': return <Bell className="h-5 w-5" />;
      default: return <Router className="h-5 w-5" />;
    }
  };

  const filteredDevices = deviceConfigs.filter(device => {
    const matchesSearch = device.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.device_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || device.device_type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Device Configuration Panel</h1>
          <p className="text-muted-foreground">
            Configure and manage IoT device settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Phase 9 - Smart Infrastructure
          </Badge>
          {unsavedChanges && (
            <Badge variant="destructive" className="text-sm">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={loadConfigurationData} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Router className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-6">
          {/* Device Selection and Search */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Device Types</SelectItem>
                <SelectItem value="gate_controller">Gate Controllers</SelectItem>
                <SelectItem value="camera">Cameras</SelectItem>
                <SelectItem value="sensor">Sensors</SelectItem>
                <SelectItem value="access_reader">Access Readers</SelectItem>
                <SelectItem value="intercom">Intercoms</SelectItem>
                <SelectItem value="alarm">Alarms</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Device List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Device List</CardTitle>
                  <CardDescription>
                    Select a device to configure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredDevices.map((device) => (
                      <div
                        key={device.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedDevice?.id === device.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedDevice(device)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getDeviceTypeIcon(device.device_type)}
                            <span className="font-medium">{device.device_name}</span>
                          </div>
                          {getStatusIcon(device.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Type: {device.device_type.replace('_', ' ')}</div>
                          <div>Version: {device.config_version}</div>
                          <div>Updated: {new Date(device.last_updated).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuration Panel */}
            <div className="lg:col-span-2">
              {selectedDevice ? (
                <div className="space-y-6">
                  {/* Device Info Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getDeviceTypeIcon(selectedDevice.device_type)}
                          <div>
                            <CardTitle>{selectedDevice.device_name}</CardTitle>
                            <CardDescription>
                              {selectedDevice.device_type.replace('_', ' ')} - Version {selectedDevice.config_version}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedDevice.status)}
                          <Badge variant={selectedDevice.status === 'online' ? 'default' : 'secondary'}>
                            {selectedDevice.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Configuration Sections */}
                  <Tabs defaultValue="network" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="network">Network</TabsTrigger>
                      <TabsTrigger value="security">Security</TabsTrigger>
                      <TabsTrigger value="operation">Operation</TabsTrigger>
                      <TabsTrigger value="features">Features</TabsTrigger>
                    </TabsList>

                    <TabsContent value="network" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Network Configuration</CardTitle>
                          <CardDescription>
                            Configure network settings and connectivity
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="ip-address">IP Address</Label>
                              <Input
                                id="ip-address"
                                value={selectedDevice.configuration.network.ip_address}
                                onChange={(e) => updateDeviceConfig(['network', 'ip_address'], e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="subnet-mask">Subnet Mask</Label>
                              <Input
                                id="subnet-mask"
                                value={selectedDevice.configuration.network.subnet_mask}
                                onChange={(e) => updateDeviceConfig(['network', 'subnet_mask'], e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="gateway">Gateway</Label>
                              <Input
                                id="gateway"
                                value={selectedDevice.configuration.network.gateway}
                                onChange={(e) => updateDeviceConfig(['network', 'gateway'], e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="dns-primary">Primary DNS</Label>
                              <Input
                                id="dns-primary"
                                value={selectedDevice.configuration.network.dns_primary}
                                onChange={(e) => updateDeviceConfig(['network', 'dns_primary'], e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor="static-ip">Static IP Address</Label>
                            <Switch
                              id="static-ip"
                              checked={selectedDevice.configuration.network.static_ip || false}
                              onCheckedChange={(checked) => updateDeviceConfig(['network', 'static_ip'], checked)}
                            />
                          </div>

                          {selectedDevice.configuration.network.wifi_ssid && (
                            <div className="space-y-4 pt-4 border-t">
                              <h4 className="font-medium">WiFi Configuration</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="wifi-ssid">WiFi SSID</Label>
                                  <Input
                                    id="wifi-ssid"
                                    value={selectedDevice.configuration.network.wifi_ssid}
                                    onChange={(e) => updateDeviceConfig(['network', 'wifi_ssid'], e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="wifi-security">Security</Label>
                                  <Select
                                    value={selectedDevice.configuration.network.wifi_security}
                                    onValueChange={(value) => updateDeviceConfig(['network', 'wifi_security'], value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="WPA3">WPA3</SelectItem>
                                      <SelectItem value="WPA2">WPA2</SelectItem>
                                      <SelectItem value="WEP">WEP (Not Recommended)</SelectItem>
                                      <SelectItem value="Open">Open (Not Recommended)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Security Configuration</CardTitle>
                          <CardDescription>
                            Configure security and authentication settings
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="encryption">Encryption Enabled</Label>
                              <Switch
                                id="encryption"
                                checked={selectedDevice.configuration.security.encryption_enabled}
                                onCheckedChange={(checked) => updateDeviceConfig(['security', 'encryption_enabled'], checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="ssl">SSL/TLS Enabled</Label>
                              <Switch
                                id="ssl"
                                checked={selectedDevice.configuration.security.ssl_enabled}
                                onCheckedChange={(checked) => updateDeviceConfig(['security', 'ssl_enabled'], checked)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="auth-method">Authentication Method</Label>
                              <Select
                                value={selectedDevice.configuration.security.authentication_method}
                                onValueChange={(value) => updateDeviceConfig(['security', 'authentication_method'], value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="certificate">Certificate</SelectItem>
                                  <SelectItem value="password">Password</SelectItem>
                                  <SelectItem value="token">Token</SelectItem>
                                  <SelectItem value="biometric">Biometric</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="password-policy">Password Policy</Label>
                              <Select
                                value={selectedDevice.configuration.security.password_policy}
                                onValueChange={(value) => updateDeviceConfig(['security', 'password_policy'], value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="strong">Strong</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="basic">Basic</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="access-level">Access Level</Label>
                            <Select
                              value={selectedDevice.configuration.security.access_level}
                              onValueChange={(value) => updateDeviceConfig(['security', 'access_level'], value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrator</SelectItem>
                                <SelectItem value="operator">Operator</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="readonly">Read Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {selectedDevice.configuration.security.certificate_valid_until && (
                            <Alert>
                              <Shield className="h-4 w-4" />
                              <AlertDescription>
                                Certificate expires on {new Date(selectedDevice.configuration.security.certificate_valid_until).toLocaleDateString()}
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="operation" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Operation Configuration</CardTitle>
                          <CardDescription>
                            Configure operational behavior and system settings
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="auto-start">Auto Start on Boot</Label>
                              <Switch
                                id="auto-start"
                                checked={selectedDevice.configuration.operation.auto_start}
                                onCheckedChange={(checked) => updateDeviceConfig(['operation', 'auto_start'], checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                              <Switch
                                id="maintenance-mode"
                                checked={selectedDevice.configuration.operation.maintenance_mode}
                                onCheckedChange={(checked) => updateDeviceConfig(['operation', 'maintenance_mode'], checked)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="heartbeat-interval">
                                Heartbeat Interval: {selectedDevice.configuration.operation.heartbeat_interval}s
                              </Label>
                              <Slider
                                id="heartbeat-interval"
                                min={10}
                                max={300}
                                step={10}
                                value={[selectedDevice.configuration.operation.heartbeat_interval]}
                                onValueChange={(value) => updateDeviceConfig(['operation', 'heartbeat_interval'], value[0])}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="timeout-seconds">
                                Timeout: {selectedDevice.configuration.operation.timeout_seconds}s
                              </Label>
                              <Slider
                                id="timeout-seconds"
                                min={10}
                                max={180}
                                step={5}
                                value={[selectedDevice.configuration.operation.timeout_seconds]}
                                onValueChange={(value) => updateDeviceConfig(['operation', 'timeout_seconds'], value[0])}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="retry-attempts">Retry Attempts</Label>
                              <Input
                                id="retry-attempts"
                                type="number"
                                min="1"
                                max="10"
                                value={selectedDevice.configuration.operation.retry_attempts}
                                onChange={(e) => updateDeviceConfig(['operation', 'retry_attempts'], parseInt(e.target.value))}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="log-level">Log Level</Label>
                              <Select
                                value={selectedDevice.configuration.operation.log_level}
                                onValueChange={(value) => updateDeviceConfig(['operation', 'log_level'], value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="debug">Debug</SelectItem>
                                  <SelectItem value="info">Info</SelectItem>
                                  <SelectItem value="warning">Warning</SelectItem>
                                  <SelectItem value="error">Error</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="features" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Feature Configuration</CardTitle>
                          <CardDescription>
                            Configure device-specific features and capabilities
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-4">
                            {Object.entries(selectedDevice.configuration.features).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between">
                                <Label htmlFor={key} className="capitalize">
                                  {key.replace(/_/g, ' ')}
                                </Label>
                                {typeof value === 'boolean' ? (
                                  <Switch
                                    id={key}
                                    checked={value}
                                    onCheckedChange={(checked) => updateDeviceConfig(['features', key], checked)}
                                  />
                                ) : typeof value === 'number' ? (
                                  <Input
                                    id={key}
                                    type="number"
                                    value={value}
                                    onChange={(e) => updateDeviceConfig(['features', key], parseInt(e.target.value))}
                                    className="w-24"
                                  />
                                ) : (
                                  <Input
                                    id={key}
                                    value={value}
                                    onChange={(e) => updateDeviceConfig(['features', key], e.target.value)}
                                    className="w-48"
                                  />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Alert Configuration */}
                          <div className="pt-4 border-t">
                            <h4 className="font-medium mb-4">Alert Configuration</h4>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="alerts-enabled">Alerts Enabled</Label>
                                <Switch
                                  id="alerts-enabled"
                                  checked={selectedDevice.configuration.alerts.enabled}
                                  onCheckedChange={(checked) => updateDeviceConfig(['alerts', 'enabled'], checked)}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Label htmlFor="email-notifications">Email Notifications</Label>
                                <Switch
                                  id="email-notifications"
                                  checked={selectedDevice.configuration.alerts.email_notifications}
                                  onCheckedChange={(checked) => updateDeviceConfig(['alerts', 'email_notifications'], checked)}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                                <Switch
                                  id="sms-notifications"
                                  checked={selectedDevice.configuration.alerts.sms_notifications}
                                  onCheckedChange={(checked) => updateDeviceConfig(['alerts', 'sms_notifications'], checked)}
                                />
                              </div>

                              {selectedDevice.configuration.alerts.webhook_url && (
                                <div className="space-y-2">
                                  <Label htmlFor="webhook-url">Webhook URL</Label>
                                  <Input
                                    id="webhook-url"
                                    value={selectedDevice.configuration.alerts.webhook_url}
                                    onChange={(e) => updateDeviceConfig(['alerts', 'webhook_url'], e.target.value)}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>

                  {/* Action Buttons */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Select onValueChange={applyTemplate}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Apply template..." />
                            </SelectTrigger>
                            <SelectContent>
                              {templates
                                .filter(t => t.device_types.includes(selectedDevice.device_type))
                                .map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" disabled={isLoading}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                          </Button>
                          <Button 
                            onClick={saveConfiguration} 
                            disabled={isLoading || !unsavedChanges}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {isLoading ? 'Saving...' : 'Save Configuration'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <Settings className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-lg font-medium">No Device Selected</p>
                      <p className="text-sm">Select a device from the list to configure its settings</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Configuration Templates</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {template.name}
                      {template.is_default && (
                        <Badge variant="default" className="text-xs">Default</Badge>
                      )}
                    </CardTitle>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Compatible with:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.device_types.map((type) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <h2 className="text-2xl font-semibold">Configuration History</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Changes</CardTitle>
              <CardDescription>
                Track configuration changes and rollback if needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {configHistory.map((history) => (
                  <div key={history.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">
                          {deviceConfigs.find(d => d.device_id === history.device_id)?.device_name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          v{history.config_version}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {history.changes_summary}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Changed by: {history.changed_by}</span>
                        <span>{new Date(history.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {history.rollback_available && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => rollbackConfiguration(history.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Rollback
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <h2 className="text-2xl font-semibold">Advanced Configuration</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Raw Configuration</CardTitle>
              <CardDescription>
                Direct JSON configuration editing for advanced users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDevice ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Warning: Editing raw configuration can break device functionality. 
                      Only proceed if you understand the implications.
                    </AlertDescription>
                  </Alert>
                  
                  <Textarea
                    value={JSON.stringify(selectedDevice.configuration, null, 2)}
                    onChange={(e) => {
                      try {
                        const newConfig = JSON.parse(e.target.value);
                        setSelectedDevice(prev => prev ? { ...prev, configuration: newConfig } : null);
                        setUnsavedChanges(true);
                      } catch (error) {
                        // Invalid JSON, don't update
                      }
                    }}
                    className="min-h-[400px] font-mono text-sm"
                  />
                  
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Configuration
                    </Button>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Configuration
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Code className="h-12 w-12 mx-auto mb-4" />
                  <p>Select a device to view raw configuration</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeviceConfigurationPanel;
