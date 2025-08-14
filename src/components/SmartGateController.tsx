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
import { useToast } from '@/hooks/use-toast';
import { 
  DoorOpen, 
  DoorClosed, 
  Lock, 
  Unlock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Clock, 
  Activity, 
  Eye, 
  Camera, 
  User, 
  Car, 
  Truck, 
  Bike,
  Timer,
  Gauge,
  Zap,
  History,
  BarChart3,
  MapPin,
  Wifi,
  WifiOff,
  Power,
  RefreshCw
} from 'lucide-react';

interface GateController {
  id: string;
  gate_name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  is_open: boolean;
  auto_mode: boolean;
  emergency_open: boolean;
  health_score: number;
  firmware_version: string;
  last_operation_at: string;
  operations_today: number;
  configuration: {
    auto_close_delay: number;
    emergency_code: string;
    max_open_duration: number;
    visitor_timeout: number;
    maintenance_mode: boolean;
  };
}

interface GateOperation {
  id: string;
  operation_type: 'open' | 'close' | 'emergency_open' | 'manual_override';
  initiated_by: string;
  visitor_id?: string;
  vehicle_type?: 'car' | 'truck' | 'motorcycle' | 'bicycle' | 'pedestrian';
  success: boolean;
  duration_seconds: number;
  created_at: string;
  notes?: string;
}

interface GateStats {
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  average_duration: number;
  peak_hours: { hour: number; count: number }[];
  vehicle_breakdown: Record<string, number>;
}

const SmartGateController: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('control');
  const [controllers, setControllers] = useState<GateController[]>([]);
  const [selectedController, setSelectedController] = useState<GateController | null>(null);
  const [recentOperations, setRecentOperations] = useState<GateOperation[]>([]);
  const [gateStats, setGateStats] = useState<GateStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emergencyCode, setEmergencyCode] = useState('');
  const [manualReason, setManualReason] = useState('');

  useEffect(() => {
    loadGateData();
    
    // Set up real-time refresh for gate status
    const interval = setInterval(loadGateData, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadGateData = async () => {
    try {
      // Simulate gate controller data
      const mockControllers: GateController[] = [
        {
          id: 'gate-1',
          gate_name: 'Main Entrance Gate',
          location: 'Main entrance checkpoint',
          status: 'online',
          is_open: false,
          auto_mode: true,
          emergency_open: false,
          health_score: 95,
          firmware_version: '2.4.1',
          last_operation_at: new Date(Date.now() - 300000).toISOString(),
          operations_today: 47,
          configuration: {
            auto_close_delay: 30,
            emergency_code: 'EMERGENCY123',
            max_open_duration: 300,
            visitor_timeout: 600,
            maintenance_mode: false
          }
        },
        {
          id: 'gate-2',
          gate_name: 'Secondary Gate',
          location: 'Service entrance',
          status: 'online',
          is_open: true,
          auto_mode: false,
          emergency_open: false,
          health_score: 78,
          firmware_version: '2.3.8',
          last_operation_at: new Date(Date.now() - 1800000).toISOString(),
          operations_today: 12,
          configuration: {
            auto_close_delay: 45,
            emergency_code: 'SERVICE456',
            max_open_duration: 600,
            visitor_timeout: 900,
            maintenance_mode: false
          }
        },
        {
          id: 'gate-3',
          gate_name: 'Emergency Exit',
          location: 'Emergency exit point',
          status: 'maintenance',
          is_open: false,
          auto_mode: false,
          emergency_open: true,
          health_score: 45,
          firmware_version: '2.2.1',
          last_operation_at: new Date(Date.now() - 7200000).toISOString(),
          operations_today: 2,
          configuration: {
            auto_close_delay: 15,
            emergency_code: 'EMERGENCY789',
            max_open_duration: 120,
            visitor_timeout: 300,
            maintenance_mode: true
          }
        }
      ];

      setControllers(mockControllers);
      
      if (!selectedController) {
        setSelectedController(mockControllers[0]);
      }

      // Mock recent operations
      setRecentOperations([
        {
          id: '1',
          operation_type: 'open',
          initiated_by: 'Visitor: John Doe',
          visitor_id: 'visitor-123',
          vehicle_type: 'car',
          success: true,
          duration_seconds: 25,
          created_at: new Date(Date.now() - 300000).toISOString(),
          notes: 'Scheduled appointment'
        },
        {
          id: '2',
          operation_type: 'close',
          initiated_by: 'Auto-close timer',
          success: true,
          duration_seconds: 12,
          created_at: new Date(Date.now() - 270000).toISOString()
        },
        {
          id: '3',
          operation_type: 'manual_override',
          initiated_by: 'Security Guard: Jane Smith',
          vehicle_type: 'truck',
          success: true,
          duration_seconds: 45,
          created_at: new Date(Date.now() - 1800000).toISOString(),
          notes: 'Delivery vehicle - oversized load'
        },
        {
          id: '4',
          operation_type: 'emergency_open',
          initiated_by: 'Emergency Protocol',
          success: true,
          duration_seconds: 8,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          notes: 'Fire drill activation'
        }
      ]);

      // Mock gate statistics
      setGateStats({
        total_operations: 342,
        successful_operations: 338,
        failed_operations: 4,
        average_duration: 28.5,
        peak_hours: [
          { hour: 8, count: 45 },
          { hour: 12, count: 38 },
          { hour: 17, count: 52 },
          { hour: 18, count: 41 }
        ],
        vehicle_breakdown: {
          car: 185,
          truck: 42,
          motorcycle: 28,
          bicycle: 15,
          pedestrian: 72
        }
      });

    } catch (error) {
      console.error('Error loading gate data:', error);
      toast({
        title: "Error",
        description: "Failed to load gate controller data",
        variant: "destructive",
      });
    }
  };

  const operateGate = async (operation: 'open' | 'close', reason?: string) => {
    if (!selectedController) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would call the smart-gate-controller API
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update local state
      setSelectedController(prev => prev ? {
        ...prev,
        is_open: operation === 'open',
        last_operation_at: new Date().toISOString(),
        operations_today: prev.operations_today + 1
      } : null);

      // Add to recent operations
      const newOperation: GateOperation = {
        id: Date.now().toString(),
        operation_type: operation,
        initiated_by: 'Manual Control',
        success: true,
        duration_seconds: Math.floor(Math.random() * 30) + 10,
        created_at: new Date().toISOString(),
        notes: reason
      };
      
      setRecentOperations(prev => [newOperation, ...prev.slice(0, 9)]);

      toast({
        title: "Gate Operation Successful",
        description: `Gate ${operation === 'open' ? 'opened' : 'closed'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Operation Failed",
        description: "Failed to operate gate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const emergencyOpen = async () => {
    if (!selectedController) return;
    
    if (emergencyCode !== selectedController.configuration.emergency_code) {
      toast({
        title: "Invalid Emergency Code",
        description: "Please enter the correct emergency code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Emergency override - bypasses normal safety checks
      setSelectedController(prev => prev ? {
        ...prev,
        is_open: true,
        emergency_open: true,
        last_operation_at: new Date().toISOString()
      } : null);

      const emergencyOperation: GateOperation = {
        id: Date.now().toString(),
        operation_type: 'emergency_open',
        initiated_by: 'Emergency Override',
        success: true,
        duration_seconds: 5,
        created_at: new Date().toISOString(),
        notes: 'Emergency access activated'
      };
      
      setRecentOperations(prev => [emergencyOperation, ...prev.slice(0, 9)]);
      setEmergencyCode('');

      toast({
        title: "Emergency Override Activated",
        description: "Gate opened via emergency protocol",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Emergency Override Failed",
        description: "Critical error - contact support immediately",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutoMode = async () => {
    if (!selectedController) return;
    
    setIsLoading(true);
    try {
      setSelectedController(prev => prev ? {
        ...prev,
        auto_mode: !prev.auto_mode
      } : null);

      toast({
        title: "Auto Mode Updated",
        description: `Auto mode ${selectedController.auto_mode ? 'disabled' : 'enabled'}`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update auto mode setting",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'maintenance': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getVehicleIcon = (type?: string) => {
    switch (type) {
      case 'car': return <Car className="h-4 w-4" />;
      case 'truck': return <Truck className="h-4 w-4" />;
      case 'motorcycle': return <Bike className="h-4 w-4" />;
      case 'bicycle': return <Bike className="h-4 w-4" />;
      case 'pedestrian': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const successRate = gateStats ? 
    ((gateStats.successful_operations / gateStats.total_operations) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Gate Controller</h1>
          <p className="text-muted-foreground">
            Manage and monitor automated gate operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Phase 9 - Smart Infrastructure
          </Badge>
          <Button variant="outline" size="sm" onClick={loadGateData} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Gate Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Gate Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {controllers.map((controller) => (
              <div
                key={controller.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedController?.id === controller.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedController(controller)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{controller.gate_name}</h3>
                  {getStatusIcon(controller.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{controller.location}</p>
                <div className="flex items-center justify-between text-sm">
                  <span>Health: <span className={getHealthColor(controller.health_score)}>
                    {controller.health_score}%
                  </span></span>
                  <Badge variant={controller.is_open ? 'destructive' : 'default'}>
                    {controller.is_open ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedController && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="control" className="flex items-center gap-2">
              <DoorOpen className="h-4 w-4" />
              Control
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="control" className="space-y-6">
            {/* Gate Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gate Status</CardTitle>
                  {selectedController.is_open ? 
                    <DoorOpen className="h-4 w-4 text-red-500" /> : 
                    <DoorClosed className="h-4 w-4 text-green-500" />
                  }
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${selectedController.is_open ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedController.is_open ? 'OPEN' : 'CLOSED'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedController.auto_mode ? 'Auto Mode' : 'Manual Mode'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Operations Today</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedController.operations_today}</div>
                  <p className="text-xs text-muted-foreground">
                    Last: {new Date(selectedController.last_operation_at).toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getHealthColor(selectedController.health_score)}`}>
                    {selectedController.health_score}%
                  </div>
                  <Progress value={selectedController.health_score} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Gate Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manual Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DoorOpen className="h-5 w-5" />
                    Manual Gate Control
                  </CardTitle>
                  <CardDescription>
                    Direct gate operation controls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => operateGate('open', manualReason)}
                      disabled={isLoading || selectedController.is_open || selectedController.status !== 'online'}
                      className="h-16 flex-col gap-2"
                      variant={selectedController.is_open ? 'secondary' : 'default'}
                    >
                      <DoorOpen className="h-6 w-6" />
                      Open Gate
                    </Button>
                    <Button
                      onClick={() => operateGate('close', manualReason)}
                      disabled={isLoading || !selectedController.is_open || selectedController.status !== 'online'}
                      className="h-16 flex-col gap-2"
                      variant={!selectedController.is_open ? 'secondary' : 'outline'}
                    >
                      <DoorClosed className="h-6 w-6" />
                      Close Gate
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="manual-reason">Reason (Optional)</Label>
                    <Textarea
                      id="manual-reason"
                      placeholder="Enter reason for manual operation..."
                      value={manualReason}
                      onChange={(e) => setManualReason(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedController.auto_mode}
                        onCheckedChange={toggleAutoMode}
                        disabled={isLoading}
                      />
                      <Label>Auto Mode</Label>
                    </div>
                    <Badge variant={selectedController.auto_mode ? 'default' : 'secondary'}>
                      {selectedController.auto_mode ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    Emergency Controls
                  </CardTitle>
                  <CardDescription>
                    Emergency override and safety controls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedController.emergency_open && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Emergency mode is currently active. Gate is in emergency open state.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergency-code">Emergency Code</Label>
                    <Input
                      id="emergency-code"
                      type="password"
                      placeholder="Enter emergency code..."
                      value={emergencyCode}
                      onChange={(e) => setEmergencyCode(e.target.value)}
                    />
                  </div>
                  
                  <Button
                    onClick={emergencyOpen}
                    disabled={isLoading || !emergencyCode || selectedController.status !== 'online'}
                    className="w-full h-16"
                    variant="destructive"
                  >
                    <Shield className="h-6 w-6 mr-2" />
                    Emergency Open
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Emergency open bypasses all safety checks and opens the gate immediately.
                    Use only in genuine emergencies.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    Real-time gate system monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connection Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedController.status)}
                      <span className={`text-sm font-medium ${getStatusColor(selectedController.status)}`}>
                        {selectedController.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Firmware Version</span>
                    <span className="text-sm font-medium">{selectedController.firmware_version}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto Close Timer</span>
                    <span className="text-sm font-medium">
                      {selectedController.configuration.auto_close_delay}s
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Maintenance Mode</span>
                    <Badge variant={selectedController.configuration.maintenance_mode ? 'destructive' : 'default'}>
                      {selectedController.configuration.maintenance_mode ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Gate operation statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {gateStats && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Success Rate</span>
                        <span className="text-sm font-medium text-green-600">{successRate}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Average Duration</span>
                        <span className="text-sm font-medium">{gateStats.average_duration}s</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Operations</span>
                        <span className="text-sm font-medium">{gateStats.total_operations}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Failed Operations</span>
                        <span className="text-sm font-medium text-red-600">{gateStats.failed_operations}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Operations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Operations</CardTitle>
                <CardDescription>
                  Latest gate operations and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOperations.slice(0, 5).map((operation) => (
                    <div key={operation.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {operation.operation_type === 'open' && <DoorOpen className="h-5 w-5 text-green-500" />}
                        {operation.operation_type === 'close' && <DoorClosed className="h-5 w-5 text-blue-500" />}
                        {operation.operation_type === 'emergency_open' && <Shield className="h-5 w-5 text-red-500" />}
                        {operation.operation_type === 'manual_override' && <Settings className="h-5 w-5 text-yellow-500" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium capitalize">
                            {operation.operation_type.replace('_', ' ')}
                          </p>
                          <div className="flex items-center gap-2">
                            {operation.vehicle_type && getVehicleIcon(operation.vehicle_type)}
                            <Badge variant={operation.success ? 'default' : 'destructive'}>
                              {operation.success ? 'Success' : 'Failed'}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{operation.initiated_by}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(operation.created_at).toLocaleString()}</span>
                          <span>Duration: {operation.duration_seconds}s</span>
                          {operation.notes && <span>Note: {operation.notes}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Operation Analytics
                </CardTitle>
                <CardDescription>
                  Historical gate operation data and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gateStats && (
                  <div className="space-y-6">
                    {/* Vehicle Type Breakdown */}
                    <div>
                      <h4 className="font-medium mb-3">Vehicle Type Distribution</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.entries(gateStats.vehicle_breakdown).map(([type, count]) => (
                          <div key={type} className="text-center p-3 border rounded-lg">
                            <div className="flex justify-center mb-2">
                              {getVehicleIcon(type)}
                            </div>
                            <div className="text-sm font-medium capitalize">{type}</div>
                            <div className="text-lg font-bold">{count}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Peak Hours */}
                    <div>
                      <h4 className="font-medium mb-3">Peak Usage Hours</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {gateStats.peak_hours.map((peak) => (
                          <div key={peak.hour} className="text-center p-3 border rounded-lg">
                            <div className="text-sm text-muted-foreground">
                              {peak.hour}:00 - {peak.hour + 1}:00
                            </div>
                            <div className="text-lg font-bold">{peak.count} ops</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* All Operations History */}
                    <div>
                      <h4 className="font-medium mb-3">Complete Operation History</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {recentOperations.map((operation) => (
                          <div key={operation.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                            <div className="flex items-center gap-3">
                              {operation.operation_type === 'open' && <DoorOpen className="h-4 w-4 text-green-500" />}
                              {operation.operation_type === 'close' && <DoorClosed className="h-4 w-4 text-blue-500" />}
                              {operation.operation_type === 'emergency_open' && <Shield className="h-4 w-4 text-red-500" />}
                              {operation.operation_type === 'manual_override' && <Settings className="h-4 w-4 text-yellow-500" />}
                              <div>
                                <div className="font-medium capitalize">
                                  {operation.operation_type.replace('_', ' ')}
                                </div>
                                <div className="text-muted-foreground">{operation.initiated_by}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div>{new Date(operation.created_at).toLocaleString()}</div>
                              <div className="text-muted-foreground">{operation.duration_seconds}s</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gate Configuration</CardTitle>
                <CardDescription>
                  Adjust gate controller settings and parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="auto-close-delay">Auto Close Delay (seconds)</Label>
                      <Input
                        id="auto-close-delay"
                        type="number"
                        value={selectedController.configuration.auto_close_delay}
                        onChange={(e) => {
                          const newDelay = parseInt(e.target.value);
                          setSelectedController(prev => prev ? {
                            ...prev,
                            configuration: { ...prev.configuration, auto_close_delay: newDelay }
                          } : null);
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="max-open-duration">Max Open Duration (seconds)</Label>
                      <Input
                        id="max-open-duration"
                        type="number"
                        value={selectedController.configuration.max_open_duration}
                        onChange={(e) => {
                          const newDuration = parseInt(e.target.value);
                          setSelectedController(prev => prev ? {
                            ...prev,
                            configuration: { ...prev.configuration, max_open_duration: newDuration }
                          } : null);
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="visitor-timeout">Visitor Timeout (seconds)</Label>
                      <Input
                        id="visitor-timeout"
                        type="number"
                        value={selectedController.configuration.visitor_timeout}
                        onChange={(e) => {
                          const newTimeout = parseInt(e.target.value);
                          setSelectedController(prev => prev ? {
                            ...prev,
                            configuration: { ...prev.configuration, visitor_timeout: newTimeout }
                          } : null);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergency-code">Emergency Override Code</Label>
                      <Input
                        id="emergency-code"
                        type="password"
                        value={selectedController.configuration.emergency_code}
                        onChange={(e) => {
                          setSelectedController(prev => prev ? {
                            ...prev,
                            configuration: { ...prev.configuration, emergency_code: e.target.value }
                          } : null);
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                      <Switch
                        id="maintenance-mode"
                        checked={selectedController.configuration.maintenance_mode}
                        onCheckedChange={(checked) => {
                          setSelectedController(prev => prev ? {
                            ...prev,
                            configuration: { ...prev.configuration, maintenance_mode: checked }
                          } : null);
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-mode">Automatic Operation</Label>
                      <Switch
                        id="auto-mode"
                        checked={selectedController.auto_mode}
                        onCheckedChange={toggleAutoMode}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button disabled={isLoading}>
                    <Settings className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                  <Button variant="outline" disabled={isLoading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SmartGateController;
