import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Wifi, 
  WifiOff, 
  Camera, 
  DoorOpen, 
  DoorClosed, 
  Thermometer, 
  Eye, 
  Activity, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  MonitorSpeaker,
  Shield,
  Router,
  Radio,
  Cpu,
  HardDrive,
  Battery,
  Power,
  Gauge
} from 'lucide-react';

interface IoTDevice {
  id: string;
  device_name: string;
  device_type: 'gate_controller' | 'camera' | 'sensor' | 'access_reader' | 'intercom' | 'alarm';
  status: 'online' | 'offline' | 'maintenance' | 'error' | 'updating';
  health_score: number;
  firmware_version: string;
  last_seen_at: string;
  capabilities: Record<string, any>;
  configuration: Record<string, any>;
  location_description: string;
  is_critical: boolean;
}

interface DeviceEvent {
  id: string;
  event_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  created_at: string;
  device_name: string;
}

interface EnvironmentalReading {
  id: string;
  reading_type: string;
  value: number;
  unit: string;
  is_alert: boolean;
  alert_level: 'normal' | 'warning' | 'critical';
  created_at: string;
  device_name: string;
}

const IoTDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [recentEvents, setRecentEvents] = useState<DeviceEvent[]>([]);
  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalReading[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadIoTData();
    
    // Set up real-time refresh
    const interval = setInterval(loadIoTData, 10000); // Update every 10 seconds
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  const loadIoTData = async () => {
    try {
      // Simulate IoT device data
      setDevices([
        {
          id: '1',
          device_name: 'Main Gate Controller',
          device_type: 'gate_controller',
          status: 'online',
          health_score: 95,
          firmware_version: '2.4.1',
          last_seen_at: new Date().toISOString(),
          capabilities: { auto_open: true, emergency_open: true, sensor_integration: true },
          configuration: { auto_close_delay: 30, emergency_code: 'EMERGENCY123' },
          location_description: 'Main entrance gate',
          is_critical: true
        },
        {
          id: '2',
          device_name: 'Security Camera 01',
          device_type: 'camera',
          status: 'online',
          health_score: 88,
          firmware_version: '1.8.3',
          last_seen_at: new Date(Date.now() - 120000).toISOString(),
          capabilities: { facial_recognition: true, night_vision: true, motion_detection: true },
          configuration: { resolution: '1080p', fps: 30, recording_enabled: true },
          location_description: 'Main gate entrance view',
          is_critical: true
        },
        {
          id: '3',
          device_name: 'Environmental Sensor',
          device_type: 'sensor',
          status: 'online',
          health_score: 92,
          firmware_version: '1.2.0',
          last_seen_at: new Date(Date.now() - 30000).toISOString(),
          capabilities: { temperature: true, humidity: true, motion: true, sound: true },
          configuration: { temp_threshold: 35, humidity_threshold: 80 },
          location_description: 'Guard booth area',
          is_critical: false
        },
        {
          id: '4',
          device_name: 'Access Card Reader',
          device_type: 'access_reader',
          status: 'maintenance',
          health_score: 45,
          firmware_version: '3.1.2',
          last_seen_at: new Date(Date.now() - 600000).toISOString(),
          capabilities: { rfid: true, nfc: true, pin_entry: true },
          configuration: { read_distance: 10, encryption_enabled: true },
          location_description: 'Secondary entrance',
          is_critical: false
        },
        {
          id: '5',
          device_name: 'Backup Gate Controller',
          device_type: 'gate_controller',
          status: 'offline',
          health_score: 0,
          firmware_version: '2.3.8',
          last_seen_at: new Date(Date.now() - 3600000).toISOString(),
          capabilities: { auto_open: true, manual_override: true },
          configuration: { backup_mode: true },
          location_description: 'Secondary gate',
          is_critical: true
        }
      ]);

      setRecentEvents([
        {
          id: '1',
          event_type: 'status_change',
          severity: 'info',
          message: 'Main Gate Controller came online',
          created_at: new Date(Date.now() - 300000).toISOString(),
          device_name: 'Main Gate Controller'
        },
        {
          id: '2',
          event_type: 'alert',
          severity: 'high',
          message: 'Access Card Reader health score below 50%',
          created_at: new Date(Date.now() - 600000).toISOString(),
          device_name: 'Access Card Reader'
        },
        {
          id: '3',
          event_type: 'command_executed',
          severity: 'info',
          message: 'Gate opened for visitor access',
          created_at: new Date(Date.now() - 900000).toISOString(),
          device_name: 'Main Gate Controller'
        },
        {
          id: '4',
          event_type: 'error_occurred',
          severity: 'critical',
          message: 'Backup Gate Controller connection lost',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          device_name: 'Backup Gate Controller'
        }
      ]);

      setEnvironmentalData([
        {
          id: '1',
          reading_type: 'temperature',
          value: 28.5,
          unit: '°C',
          is_alert: false,
          alert_level: 'normal',
          created_at: new Date().toISOString(),
          device_name: 'Environmental Sensor'
        },
        {
          id: '2',
          reading_type: 'humidity',
          value: 65,
          unit: '%',
          is_alert: false,
          alert_level: 'normal',
          created_at: new Date().toISOString(),
          device_name: 'Environmental Sensor'
        },
        {
          id: '3',
          reading_type: 'sound_level',
          value: 45,
          unit: 'dB',
          is_alert: false,
          alert_level: 'normal',
          created_at: new Date().toISOString(),
          device_name: 'Environmental Sensor'
        }
      ]);

    } catch (error) {
      console.error('Error loading IoT data:', error);
      toast({
        title: "Error",
        description: "Failed to load IoT device data",
        variant: "destructive",
      });
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'gate_controller': return <DoorOpen className="h-5 w-5" />;
      case 'camera': return <Camera className="h-5 w-5" />;
      case 'sensor': return <Thermometer className="h-5 w-5" />;
      case 'access_reader': return <Radio className="h-5 w-5" />;
      case 'intercom': return <MonitorSpeaker className="h-5 w-5" />;
      case 'alarm': return <Shield className="h-5 w-5" />;
      default: return <Router className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'updating': return <Activity className="h-4 w-4 text-yellow-500" />;
      default: return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const onlineDevices = devices.filter(d => d.status === 'online');
  const offlineDevices = devices.filter(d => d.status === 'offline');
  const maintenanceDevices = devices.filter(d => d.status === 'maintenance');
  const criticalDevices = devices.filter(d => d.is_critical);
  const averageHealth = devices.length > 0 
    ? Math.round(devices.reduce((sum, d) => sum + d.health_score, 0) / devices.length)
    : 0;

  const sendCommand = async (deviceId: string, commandType: string) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call the IoT communication API
      toast({
        title: "Command Sent",
        description: `${commandType} command sent to device successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send command to device",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">IoT Device Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage smart infrastructure devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Phase 9 - Smart Infrastructure
          </Badge>
          <Button variant="outline" size="sm" onClick={loadIoTData} disabled={isLoading}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Router className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="control" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Control
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
                <Wifi className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{onlineDevices.length}</div>
                <p className="text-xs text-muted-foreground">
                  of {devices.length} total devices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getHealthColor(averageHealth)}`}>
                  {averageHealth}%
                </div>
                <Progress value={averageHealth} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Devices</CardTitle>
                <Shield className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{criticalDevices.length}</div>
                <p className="text-xs text-muted-foreground">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {recentEvents.filter(e => e.severity === 'critical' || e.severity === 'high').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  High priority alerts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Device Status Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Device Status Overview</CardTitle>
              <CardDescription>
                Real-time status of all connected IoT devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map((device) => (
                  <div key={device.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.device_type)}
                        <span className="font-medium">{device.device_name}</span>
                      </div>
                      {getStatusIcon(device.status)}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Health:</span>
                        <span className={getHealthColor(device.health_score)}>
                          {device.health_score}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                          {device.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Seen:</span>
                        <span>{new Date(device.last_seen_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    {device.is_critical && (
                      <Badge variant="destructive" className="mt-2 text-xs">
                        Critical Device
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Environmental Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle>Environmental Monitoring</CardTitle>
              <CardDescription>
                Real-time environmental sensor readings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {environmentalData.map((reading) => (
                  <div key={reading.id} className="text-center p-4 border rounded-lg">
                    <div className="text-sm font-medium capitalize mb-1">
                      {reading.reading_type.replace('_', ' ')}
                    </div>
                    <div className="text-2xl font-bold">
                      {reading.value}
                      <span className="text-sm font-normal ml-1">{reading.unit}</span>
                    </div>
                    <Badge 
                      variant={reading.is_alert ? 'destructive' : 'secondary'}
                      className="text-xs mt-2"
                    >
                      {reading.alert_level}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Device Management</h2>
            <Button>
              <Router className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </div>

          <div className="grid gap-4">
            {devices.map((device) => (
              <Card key={device.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getDeviceIcon(device.device_type)}
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {device.device_name}
                          {getStatusIcon(device.status)}
                          {device.is_critical && (
                            <Badge variant="destructive" className="text-xs">Critical</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{device.location_description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedDevice(device)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => sendCommand(device.id, 'reboot')}
                        disabled={device.status === 'offline'}
                      >
                        <Power className="h-4 w-4 mr-2" />
                        Reboot
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>
                      <p className="capitalize">{device.device_type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Firmware:</span>
                      <p>{device.firmware_version}</p>
                    </div>
                    <div>
                      <span className="font-medium">Health Score:</span>
                      <p className={getHealthColor(device.health_score)}>
                        {device.health_score}%
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Last Seen:</span>
                      <p>{new Date(device.last_seen_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Capabilities</h4>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(device.capabilities).map(([key, value]) => (
                        <Badge 
                          key={key} 
                          variant={value ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {key.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <h2 className="text-2xl font-semibold">System Monitoring</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Device Health Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Device Health Trends</CardTitle>
                <CardDescription>
                  Health score trends over the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2" />
                    <p>Health trend visualization</p>
                    <p className="text-xs">Chart integration needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Status */}
            <Card>
              <CardHeader>
                <CardTitle>Network Status</CardTitle>
                <CardDescription>
                  IoT network performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network Latency</span>
                    <span className="text-sm font-medium">12ms</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Packet Loss</span>
                    <span className="text-sm font-medium">0.2%</span>
                  </div>
                  <Progress value={2} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bandwidth Usage</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Environmental Monitoring Details */}
          <Card>
            <CardHeader>
              <CardTitle>Environmental Monitoring</CardTitle>
              <CardDescription>
                Detailed sensor readings and alert thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {environmentalData.map((reading) => (
                  <div key={reading.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Thermometer className="h-5 w-5" />
                      <div>
                        <p className="font-medium capitalize">
                          {reading.reading_type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {reading.device_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {reading.value} {reading.unit}
                      </p>
                      <Badge variant={reading.is_alert ? 'destructive' : 'secondary'}>
                        {reading.alert_level}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="control" className="space-y-6">
          <h2 className="text-2xl font-semibold">Device Control</h2>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common device control operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  className="h-20 flex-col gap-2"
                  onClick={() => sendCommand('gate-1', 'open_gate')}
                >
                  <DoorOpen className="h-6 w-6" />
                  <span className="text-sm">Open Gate</span>
                </Button>
                <Button 
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => sendCommand('gate-1', 'close_gate')}
                >
                  <DoorClosed className="h-6 w-6" />
                  <span className="text-sm">Close Gate</span>
                </Button>
                <Button 
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => sendCommand('camera-1', 'capture_photo')}
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-sm">Capture Photo</span>
                </Button>
                <Button 
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => sendCommand('all', 'health_check')}
                >
                  <Gauge className="h-6 w-6" />
                  <span className="text-sm">Health Check</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Device-Specific Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Device-Specific Controls</CardTitle>
              <CardDescription>
                Configure and control individual devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="device-select">Select Device</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a device..." />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.filter(d => d.status === 'online').map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.device_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="command-select">Command</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose command..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reboot">Reboot Device</SelectItem>
                        <SelectItem value="update">Update Firmware</SelectItem>
                        <SelectItem value="configure">Update Configuration</SelectItem>
                        <SelectItem value="test">Run Diagnostics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button disabled={isLoading}>
                  <Zap className="h-4 w-4 mr-2" />
                  Execute Command
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <h2 className="text-2xl font-semibold">System Events</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>
                Real-time system events and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-full ${getSeverityColor(event.severity)}`}>
                      {event.severity === 'critical' && <AlertTriangle className="h-4 w-4" />}
                      {event.severity === 'high' && <XCircle className="h-4 w-4" />}
                      {event.severity === 'medium' && <Clock className="h-4 w-4" />}
                      {(event.severity === 'low' || event.severity === 'info') && <CheckCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{event.message}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{event.device_name}</span>
                        <span>•</span>
                        <span>{new Date(event.created_at).toLocaleString()}</span>
                        <Badge variant="outline" className="text-xs">
                          {event.event_type}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={event.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {event.severity}
                    </Badge>
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

export default IoTDashboard;
