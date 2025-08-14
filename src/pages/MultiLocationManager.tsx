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
  Building,
  MapPin,
  Globe,
  Users,
  Shield,
  Settings,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Database,
  Server,
  Network,
  Wifi,
  WifiOff,
  MonitorSpeaker,
  Camera,
  Lock,
  Unlock,
  Key,
  UserPlus,
  UserMinus,
  FileText,
  Share,
  ArrowUpDown,
  ArrowRight,
  Filter,
  Search,
  MoreHorizontal,
  Layers,
  Building2,
  Home,
  MapIcon as Map,
  Navigation,
  Compass,
  Target,
  Crosshair
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Location {
  id: string;
  name: string;
  code: string;
  type: 'headquarters' | 'branch' | 'facility' | 'warehouse' | 'remote';
  status: 'active' | 'inactive' | 'maintenance' | 'closed';
  parentId?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: { lat: number; lng: number };
  };
  contact: {
    phone?: string;
    email?: string;
    manager?: string;
    emergencyContact?: string;
  };
  configuration: {
    timezone: string;
    currency: string;
    language: string;
    businessHours: {
      [key: string]: { open: string; close: string; closed?: boolean };
    };
    capacity: {
      maxVisitors: number;
      maxStaff: number;
      parkingSpaces: number;
    };
  };
  systems: {
    accessControl: boolean;
    cameras: boolean;
    alarms: boolean;
    fireSystem: boolean;
    hvac: boolean;
    lighting: boolean;
  };
  statistics: {
    totalUsers: number;
    activeUsers: number;
    dailyVisitors: number;
    monthlyVisitors: number;
    securityIncidents: number;
    systemUptime: number;
    lastSync: Date;
  };
  permissions: {
    administrators: string[];
    managers: string[];
    staff: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface LocationPolicy {
  id: string;
  name: string;
  description: string;
  type: 'access' | 'security' | 'operational' | 'compliance' | 'emergency';
  scope: 'global' | 'regional' | 'location';
  appliedLocations: string[];
  rules: Array<{
    condition: string;
    action: string;
    priority: number;
    enabled: boolean;
  }>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface CrossLocationTransfer {
  id: string;
  type: 'user' | 'resource' | 'policy' | 'data';
  fromLocation: string;
  toLocation: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  initiatedBy: string;
  scheduledAt?: Date;
  completedAt?: Date;
  items: Array<{
    id: string;
    type: string;
    name: string;
    status: string;
  }>;
  approval?: {
    required: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    notes?: string;
  };
  progress: number;
  error?: string;
}

interface LocationAnalytics {
  locationId: string;
  period: 'day' | 'week' | 'month' | 'year';
  metrics: {
    visitorTraffic: number;
    securityEvents: number;
    systemAlerts: number;
    resourceUtilization: number;
    energyConsumption: number;
    operationalCosts: number;
  };
  trends: {
    visitorTrend: number;
    securityTrend: number;
    uptimeTrend: number;
    efficiencyTrend: number;
  };
  comparisons: {
    comparedTo: string;
    performanceIndex: number;
    ranking: number;
    totalLocations: number;
  };
}

const MultiLocationManager: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [policies, setPolicies] = useState<LocationPolicy[]>([]);
  const [transfers, setTransfers] = useState<CrossLocationTransfer[]>([]);
  const [analytics, setAnalytics] = useState<LocationAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [hierarchyView, setHierarchyView] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  const fetchLocationData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate fetching location data
      const mockLocations: Location[] = [
        {
          id: 'loc-001',
          name: 'SecureGate Headquarters',
          code: 'HQ-001',
          type: 'headquarters',
          status: 'active',
          address: {
            street: '123 Innovation Drive',
            city: 'Nairobi',
            state: 'Nairobi County',
            country: 'Kenya',
            postalCode: '00100',
            coordinates: { lat: -1.2921, lng: 36.8219 }
          },
          contact: {
            phone: '+254-700-123456',
            email: 'hq@securegate.com',
            manager: 'John Kimani',
            emergencyContact: '+254-700-999888'
          },
          configuration: {
            timezone: 'Africa/Nairobi',
            currency: 'KES',
            language: 'en',
            businessHours: {
              monday: { open: '08:00', close: '18:00' },
              tuesday: { open: '08:00', close: '18:00' },
              wednesday: { open: '08:00', close: '18:00' },
              thursday: { open: '08:00', close: '18:00' },
              friday: { open: '08:00', close: '18:00' },
              saturday: { open: '09:00', close: '14:00' },
              sunday: { closed: true, open: '', close: '' }
            },
            capacity: {
              maxVisitors: 500,
              maxStaff: 200,
              parkingSpaces: 150
            }
          },
          systems: {
            accessControl: true,
            cameras: true,
            alarms: true,
            fireSystem: true,
            hvac: true,
            lighting: true
          },
          statistics: {
            totalUsers: 245,
            activeUsers: 198,
            dailyVisitors: 127,
            monthlyVisitors: 2847,
            securityIncidents: 3,
            systemUptime: 99.7,
            lastSync: new Date('2025-08-13T10:30:00')
          },
          permissions: {
            administrators: ['admin@securegate.com', 'john.kimani@securegate.com'],
            managers: ['manager1@securegate.com', 'manager2@securegate.com'],
            staff: ['staff1@securegate.com', 'staff2@securegate.com']
          },
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-08-13')
        },
        {
          id: 'loc-002',
          name: 'Westlands Branch',
          code: 'WL-002',
          type: 'branch',
          status: 'active',
          parentId: 'loc-001',
          address: {
            street: '456 Westlands Avenue',
            city: 'Nairobi',
            state: 'Nairobi County',
            country: 'Kenya',
            postalCode: '00600',
            coordinates: { lat: -1.2676, lng: 36.8108 }
          },
          contact: {
            phone: '+254-700-123457',
            email: 'westlands@securegate.com',
            manager: 'Mary Wanjiku',
            emergencyContact: '+254-700-999889'
          },
          configuration: {
            timezone: 'Africa/Nairobi',
            currency: 'KES',
            language: 'en',
            businessHours: {
              monday: { open: '08:30', close: '17:30' },
              tuesday: { open: '08:30', close: '17:30' },
              wednesday: { open: '08:30', close: '17:30' },
              thursday: { open: '08:30', close: '17:30' },
              friday: { open: '08:30', close: '17:30' },
              saturday: { closed: true, open: '', close: '' },
              sunday: { closed: true, open: '', close: '' }
            },
            capacity: {
              maxVisitors: 200,
              maxStaff: 75,
              parkingSpaces: 50
            }
          },
          systems: {
            accessControl: true,
            cameras: true,
            alarms: true,
            fireSystem: true,
            hvac: false,
            lighting: true
          },
          statistics: {
            totalUsers: 89,
            activeUsers: 76,
            dailyVisitors: 45,
            monthlyVisitors: 1023,
            securityIncidents: 1,
            systemUptime: 98.3,
            lastSync: new Date('2025-08-13T10:25:00')
          },
          permissions: {
            administrators: ['admin@securegate.com', 'mary.wanjiku@securegate.com'],
            managers: ['westlands.manager@securegate.com'],
            staff: ['westlands.staff1@securegate.com', 'westlands.staff2@securegate.com']
          },
          createdAt: new Date('2025-03-10'),
          updatedAt: new Date('2025-08-13')
        },
        {
          id: 'loc-003',
          name: 'Mombasa Regional Office',
          code: 'MSA-003',
          type: 'branch',
          status: 'active',
          parentId: 'loc-001',
          address: {
            street: '789 Moi Avenue',
            city: 'Mombasa',
            state: 'Mombasa County',
            country: 'Kenya',
            postalCode: '80100',
            coordinates: { lat: -4.0435, lng: 39.6682 }
          },
          contact: {
            phone: '+254-700-123458',
            email: 'mombasa@securegate.com',
            manager: 'Ahmed Hassan',
            emergencyContact: '+254-700-999890'
          },
          configuration: {
            timezone: 'Africa/Nairobi',
            currency: 'KES',
            language: 'en',
            businessHours: {
              monday: { open: '08:00', close: '17:00' },
              tuesday: { open: '08:00', close: '17:00' },
              wednesday: { open: '08:00', close: '17:00' },
              thursday: { open: '08:00', close: '17:00' },
              friday: { open: '08:00', close: '17:00' },
              saturday: { open: '09:00', close: '13:00' },
              sunday: { closed: true, open: '', close: '' }
            },
            capacity: {
              maxVisitors: 150,
              maxStaff: 50,
              parkingSpaces: 30
            }
          },
          systems: {
            accessControl: true,
            cameras: true,
            alarms: true,
            fireSystem: true,
            hvac: true,
            lighting: true
          },
          statistics: {
            totalUsers: 67,
            activeUsers: 59,
            dailyVisitors: 32,
            monthlyVisitors: 745,
            securityIncidents: 0,
            systemUptime: 99.1,
            lastSync: new Date('2025-08-13T10:15:00')
          },
          permissions: {
            administrators: ['admin@securegate.com', 'ahmed.hassan@securegate.com'],
            managers: ['mombasa.manager@securegate.com'],
            staff: ['mombasa.staff1@securegate.com']
          },
          createdAt: new Date('2025-04-20'),
          updatedAt: new Date('2025-08-13')
        },
        {
          id: 'loc-004',
          name: 'Data Center Facility',
          code: 'DC-004',
          type: 'facility',
          status: 'maintenance',
          parentId: 'loc-001',
          address: {
            street: '321 Technology Park',
            city: 'Nairobi',
            state: 'Nairobi County',
            country: 'Kenya',
            postalCode: '00200',
            coordinates: { lat: -1.3032, lng: 36.8062 }
          },
          contact: {
            phone: '+254-700-123459',
            email: 'datacenter@securegate.com',
            manager: 'Peter Muthuri',
            emergencyContact: '+254-700-999891'
          },
          configuration: {
            timezone: 'Africa/Nairobi',
            currency: 'KES',
            language: 'en',
            businessHours: {
              monday: { open: '00:00', close: '23:59' },
              tuesday: { open: '00:00', close: '23:59' },
              wednesday: { open: '00:00', close: '23:59' },
              thursday: { open: '00:00', close: '23:59' },
              friday: { open: '00:00', close: '23:59' },
              saturday: { open: '00:00', close: '23:59' },
              sunday: { open: '00:00', close: '23:59' }
            },
            capacity: {
              maxVisitors: 20,
              maxStaff: 15,
              parkingSpaces: 10
            }
          },
          systems: {
            accessControl: true,
            cameras: true,
            alarms: true,
            fireSystem: true,
            hvac: true,
            lighting: true
          },
          statistics: {
            totalUsers: 18,
            activeUsers: 12,
            dailyVisitors: 5,
            monthlyVisitors: 134,
            securityIncidents: 0,
            systemUptime: 99.9,
            lastSync: new Date('2025-08-13T10:20:00')
          },
          permissions: {
            administrators: ['admin@securegate.com', 'peter.muthuri@securegate.com'],
            managers: ['datacenter.manager@securegate.com'],
            staff: ['datacenter.staff1@securegate.com']
          },
          createdAt: new Date('2025-02-28'),
          updatedAt: new Date('2025-08-13')
        }
      ];

      const mockPolicies: LocationPolicy[] = [
        {
          id: 'pol-001',
          name: 'Standard Access Control Policy',
          description: 'Default access control rules for all locations',
          type: 'access',
          scope: 'global',
          appliedLocations: ['loc-001', 'loc-002', 'loc-003', 'loc-004'],
          rules: [
            {
              condition: 'visitor.type === "VIP"',
              action: 'require_escort',
              priority: 1,
              enabled: true
            },
            {
              condition: 'time.hour < 8 || time.hour > 18',
              action: 'require_manager_approval',
              priority: 2,
              enabled: true
            },
            {
              condition: 'visitor.hasValidPass === false',
              action: 'deny_access',
              priority: 3,
              enabled: true
            }
          ],
          createdBy: 'admin@securegate.com',
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-08-01'),
          isActive: true
        },
        {
          id: 'pol-002',
          name: 'High Security Zone Policy',
          description: 'Enhanced security requirements for sensitive areas',
          type: 'security',
          scope: 'location',
          appliedLocations: ['loc-004'],
          rules: [
            {
              condition: 'area.securityLevel === "high"',
              action: 'require_biometric_verification',
              priority: 1,
              enabled: true
            },
            {
              condition: 'visitor.clearanceLevel < 3',
              action: 'deny_access',
              priority: 2,
              enabled: true
            },
            {
              condition: 'access.duration > 4hours',
              action: 'require_supervisor_approval',
              priority: 3,
              enabled: true
            }
          ],
          createdBy: 'security@securegate.com',
          createdAt: new Date('2025-02-28'),
          updatedAt: new Date('2025-08-05'),
          isActive: true
        }
      ];

      const mockTransfers: CrossLocationTransfer[] = [
        {
          id: 'trf-001',
          type: 'user',
          fromLocation: 'loc-002',
          toLocation: 'loc-003',
          status: 'completed',
          initiatedBy: 'hr@securegate.com',
          scheduledAt: new Date('2025-08-10T09:00:00'),
          completedAt: new Date('2025-08-10T15:30:00'),
          items: [
            {
              id: 'usr-001',
              type: 'employee',
              name: 'Jane Doe',
              status: 'transferred'
            },
            {
              id: 'acc-001',
              type: 'access_card',
              name: 'Employee Access Card #1234',
              status: 'transferred'
            }
          ],
          approval: {
            required: true,
            approvedBy: 'manager@securegate.com',
            approvedAt: new Date('2025-08-09T14:20:00'),
            notes: 'Approved for regional expansion'
          },
          progress: 100
        },
        {
          id: 'trf-002',
          type: 'policy',
          fromLocation: 'loc-001',
          toLocation: 'loc-002',
          status: 'in_progress',
          initiatedBy: 'admin@securegate.com',
          scheduledAt: new Date('2025-08-13T10:00:00'),
          items: [
            {
              id: 'pol-003',
              type: 'access_policy',
              name: 'Emergency Access Protocol',
              status: 'syncing'
            },
            {
              id: 'pol-004',
              type: 'security_policy',
              name: 'Visitor Screening Guidelines',
              status: 'pending'
            }
          ],
          approval: {
            required: false
          },
          progress: 65
        }
      ];

      const mockAnalytics: LocationAnalytics[] = [
        {
          locationId: 'loc-001',
          period: 'month',
          metrics: {
            visitorTraffic: 2847,
            securityEvents: 12,
            systemAlerts: 8,
            resourceUtilization: 78,
            energyConsumption: 45200,
            operationalCosts: 125000
          },
          trends: {
            visitorTrend: 12.5,
            securityTrend: -8.3,
            uptimeTrend: 2.1,
            efficiencyTrend: 5.7
          },
          comparisons: {
            comparedTo: 'network_average',
            performanceIndex: 112,
            ranking: 1,
            totalLocations: 4
          }
        },
        {
          locationId: 'loc-002',
          period: 'month',
          metrics: {
            visitorTraffic: 1023,
            securityEvents: 5,
            systemAlerts: 3,
            resourceUtilization: 65,
            energyConsumption: 18400,
            operationalCosts: 48000
          },
          trends: {
            visitorTrend: 8.2,
            securityTrend: -15.6,
            uptimeTrend: -1.2,
            efficiencyTrend: 3.1
          },
          comparisons: {
            comparedTo: 'network_average',
            performanceIndex: 95,
            ranking: 3,
            totalLocations: 4
          }
        }
      ];

      setLocations(mockLocations);
      setPolicies(mockPolicies);
      setTransfers(mockTransfers);
      setAnalytics(mockAnalytics);

    } catch (error) {
      console.error('Error fetching location data:', error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load location data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const syncLocation = async (locationId: string) => {
    try {
      toast({
        title: "Sync Started",
        description: "Synchronizing location data...",
      });

      setTimeout(() => {
        setLocations(prev => prev.map(loc => 
          loc.id === locationId 
            ? { ...loc, statistics: { ...loc.statistics, lastSync: new Date() } }
            : loc
        ));

        toast({
          title: "Sync Complete",
          description: "Location data synchronized successfully.",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize location data.",
        variant: "destructive"
      });
    }
  };

  const deployPolicy = async (policyId: string, locationIds: string[]) => {
    try {
      toast({
        title: "Deploying Policy",
        description: "Deploying policy to selected locations...",
      });

      setTimeout(() => {
        setPolicies(prev => prev.map(pol => 
          pol.id === policyId 
            ? { ...pol, appliedLocations: [...new Set([...pol.appliedLocations, ...locationIds])] }
            : pol
        ));

        toast({
          title: "Deployment Complete",
          description: `Policy deployed to ${locationIds.length} location(s).`,
        });
      }, 1500);
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy policy.",
        variant: "destructive"
      });
    }
  };

  const initiateTransfer = async (transferData: Partial<CrossLocationTransfer>) => {
    try {
      const newTransfer: CrossLocationTransfer = {
        id: `trf-${Date.now()}`,
        type: transferData.type || 'user',
        fromLocation: transferData.fromLocation || '',
        toLocation: transferData.toLocation || '',
        status: 'pending',
        initiatedBy: 'current-user@securegate.com',
        scheduledAt: new Date(),
        items: transferData.items || [],
        approval: { required: true },
        progress: 0
      };

      setTransfers(prev => [newTransfer, ...prev]);

      toast({
        title: "Transfer Initiated",
        description: "Transfer request has been created and is pending approval.",
      });
    } catch (error) {
      toast({
        title: "Transfer Failed",
        description: "Failed to initiate transfer.",
        variant: "destructive"
      });
    }
  };

  const toggleLocationStatus = async (locationId: string, newStatus: Location['status']) => {
    try {
      setLocations(prev => prev.map(loc => 
        loc.id === locationId ? { ...loc, status: newStatus } : loc
      ));

      toast({
        title: "Status Updated",
        description: `Location status changed to ${newStatus}.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update location status.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchLocationData();
  }, [fetchLocationData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'completed': return 'bg-green-500';
      case 'maintenance': case 'in_progress': case 'pending': return 'bg-yellow-500';
      case 'inactive': case 'failed': case 'cancelled': return 'bg-gray-500';
      case 'closed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'maintenance': case 'in_progress': case 'pending': return <Clock className="h-4 w-4" />;
      case 'inactive': case 'failed': case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'closed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'headquarters': return <Building className="h-5 w-5" />;
      case 'branch': return <Building2 className="h-5 w-5" />;
      case 'facility': return <Home className="h-5 w-5" />;
      case 'warehouse': return <Database className="h-5 w-5" />;
      case 'remote': return <Globe className="h-5 w-5" />;
      default: return <MapPin className="h-5 w-5" />;
    }
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || location.type === filterType;
    const matchesStatus = showInactive || location.status !== 'inactive';
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Building className="h-6 w-6 animate-pulse" />
          <span>Loading multi-location manager...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building className="h-8 w-8" />
            Multi-Location Manager
          </h1>
          <p className="text-muted-foreground">
            Centralized management for distributed locations and facilities
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={hierarchyView}
              onCheckedChange={setHierarchyView}
            />
            <Label className="text-sm">Hierarchy View</Label>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLocationData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>
      </div>

      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground">
              {locations.filter(l => l.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.reduce((sum, loc) => sum + loc.statistics.totalUsers, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {locations.reduce((sum, loc) => sum + loc.statistics.activeUsers, 0)} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Visitors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.reduce((sum, loc) => sum + loc.statistics.dailyVisitors, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.length > 0 
                ? (locations.reduce((sum, loc) => sum + loc.statistics.systemUptime, 0) / locations.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across network
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="locations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="headquarters">Headquarters</SelectItem>
                <SelectItem value="branch">Branch</SelectItem>
                <SelectItem value="facility">Facility</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label className="text-sm whitespace-nowrap">Show Inactive</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocations.map((location) => (
              <Card key={location.id} className={`${location.status === 'inactive' ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(location.type)}
                      <div>
                        <CardTitle className="text-sm">{location.name}</CardTitle>
                        <CardDescription className="text-xs">{location.code}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(location.status)}`}></div>
                      {getStatusIcon(location.status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs capitalize">{location.type}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{location.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-xs">
                      <div className="text-muted-foreground">Address:</div>
                      <div className="font-medium">{location.address.city}, {location.address.country}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Users:</span>
                        <div className="font-medium">{location.statistics.totalUsers}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Visitors:</span>
                        <div className="font-medium">{location.statistics.dailyVisitors}/day</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Uptime:</span>
                        <div className="font-medium">{location.statistics.systemUptime}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Incidents:</span>
                        <div className="font-medium">{location.statistics.securityIncidents}</div>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="text-muted-foreground">Manager:</span>
                      <div className="font-medium">{location.contact.manager}</div>
                    </div>

                    <div className="text-xs">
                      <span className="text-muted-foreground">Last Sync:</span>
                      <div className="font-medium">{location.statistics.lastSync.toLocaleString()}</div>
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => syncLocation(location.id)}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedLocation(location.id)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Hierarchy Tab */}
        <TabsContent value="hierarchy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location Hierarchy</CardTitle>
              <CardDescription>Organizational structure and relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Headquarters */}
                {locations.filter(l => l.type === 'headquarters').map((hq) => (
                  <div key={hq.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Building className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{hq.name}</div>
                        <div className="text-sm text-muted-foreground">{hq.code} • {hq.address.city}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(hq.status)} ml-auto`}></div>
                    </div>
                    
                    {/* Child Locations */}
                    <div className="ml-6 space-y-2">
                      {locations.filter(l => l.parentId === hq.id).map((child) => (
                        <div key={child.id} className="flex items-center gap-3 p-2 border rounded">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          {getTypeIcon(child.type)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{child.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {child.code} • {child.address.city} • {child.statistics.totalUsers} users
                            </div>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(child.status)}`}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Location Policies</h3>
              <p className="text-sm text-muted-foreground">Manage policies across locations</p>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </div>

          <div className="space-y-4">
            {policies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{policy.name}</CardTitle>
                      <CardDescription className="text-xs">{policy.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={policy.isActive ? "default" : "secondary"}>
                        {policy.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">{policy.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Scope:</span>
                        <div className="font-medium capitalize">{policy.scope}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Applied Locations:</span>
                        <div className="font-medium">{policy.appliedLocations.length}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rules:</span>
                        <div className="font-medium">{policy.rules.length}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <div className="font-medium">{policy.createdAt.toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium mb-2">Applied Locations:</div>
                      <div className="flex flex-wrap gap-1">
                        {policy.appliedLocations.map((locId) => {
                          const location = locations.find(l => l.id === locId);
                          return location ? (
                            <Badge key={locId} variant="secondary" className="text-xs">
                              {location.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share className="h-3 w-3 mr-1" />
                        Deploy
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-3 w-3 mr-1" />
                        Clone
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Cross-Location Transfers</h3>
              <p className="text-sm text-muted-foreground">Manage resource and data transfers</p>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Transfer
            </Button>
          </div>

          <div className="space-y-4">
            {transfers.map((transfer) => {
              const fromLocation = locations.find(l => l.id === transfer.fromLocation);
              const toLocation = locations.find(l => l.id === transfer.toLocation);
              
              return (
                <Card key={transfer.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm capitalize">{transfer.type} Transfer</CardTitle>
                        <CardDescription className="text-xs">
                          {fromLocation?.name} → {toLocation?.name}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(transfer.status)}`}></div>
                        <Badge variant="outline" className="text-xs capitalize">{transfer.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Initiated By:</span>
                          <div className="font-medium">{transfer.initiatedBy}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Items:</span>
                          <div className="font-medium">{transfer.items.length}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Progress:</span>
                          <div className="font-medium">{transfer.progress}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <div className="font-medium capitalize">{transfer.status}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-medium">Progress</div>
                        <Progress value={transfer.progress} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-medium">Transfer Items</div>
                        <div className="space-y-1">
                          {transfer.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded text-xs">
                              <span>{item.name}</span>
                              <Badge variant="outline" className="text-xs capitalize">{item.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {transfer.approval?.required && (
                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            {transfer.approval.approvedBy 
                              ? `Approved by ${transfer.approval.approvedBy}`
                              : "Approval required"
                            }
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Performance</CardTitle>
                <CardDescription>Comparative analysis across locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.map((analytic) => {
                    const location = locations.find(l => l.id === analytic.locationId);
                    return (
                      <div key={analytic.locationId} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm">{location?.name}</div>
                          <Badge variant="outline">Rank #{analytic.comparisons.ranking}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Visitors:</span>
                            <div className="font-medium flex items-center gap-1">
                              {analytic.metrics.visitorTraffic}
                              {analytic.trends.visitorTrend > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Utilization:</span>
                            <div className="font-medium">{analytic.metrics.resourceUtilization}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Security Events:</span>
                            <div className="font-medium">{analytic.metrics.securityEvents}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Performance Index:</span>
                            <div className="font-medium">{analytic.comparisons.performanceIndex}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Trends</CardTitle>
                <CardDescription>System-wide performance trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Total Network Users</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {locations.reduce((sum, loc) => sum + loc.statistics.totalUsers, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">+5.2% this month</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Daily Visitor Traffic</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {locations.reduce((sum, loc) => sum + loc.statistics.dailyVisitors, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">+8.7% this week</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Security Incidents</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {locations.reduce((sum, loc) => sum + loc.statistics.securityIncidents, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">-12.3% this month</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Average Uptime</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {locations.length > 0 
                          ? (locations.reduce((sum, loc) => sum + loc.statistics.systemUptime, 0) / locations.length).toFixed(1)
                          : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">+0.3% this quarter</div>
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

export default MultiLocationManager;
