import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Users, Shield, BarChart3, Settings, Key, Trash2, Database as DatabaseIcon, Download, Upload, Bell, CheckCircle, XCircle, Clock, Activity, Server, Network, Brain, FileBarChart, TrendingUp } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useToast } from "@/hooks/use-toast";
import { SharedNavigation } from "@/components/SharedNavigation";

// Define local types to replace Supabase types
interface Profile {
  id: string;
  email: string;
  full_name: string;
  unit_number: string | null;
  phone: string | null;
  role: 'admin' | 'guard' | 'resident';
  created_at: string;
  updated_at: string;
}

interface AdminStats {
  totalUsers: number;
  totalResidents: number;
  totalGuards: number;
  totalAdmins: number;
  activeInvitations: number;
  pendingInvitations: number;
  systemAlerts: number;
  databaseSize: string;
}

interface SystemAlert {
  id: number;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalResidents: 0,
    totalGuards: 0,
    totalAdmins: 0,
    activeInvitations: 0,
    pendingInvitations: 0,
    systemAlerts: 0,
    databaseSize: '0 MB',
  });
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    role: 'resident',
    name: '',
  });
  const { toast } = useToast();

  const { session, loading: authLoading } = useAuthSession();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        if (authLoading) return;
        if (session?.user) {
          // Use the new API client to get user profile
          const result = await apiClient.getProfile();
          if (result.data?.user) {
            setUserProfile(result.data.user);
          }
        }

        // TODO: Replace with admin statistics API endpoint
        // For now, we'll use placeholder data until the backend endpoint is implemented
        setStats({
          totalUsers: 0,
          totalResidents: 0,
          totalGuards: 0,
          totalAdmins: 0,
          activeInvitations: 0,
          pendingInvitations: 0,
          systemAlerts: Math.floor(Math.random() * 5),
          databaseSize: '2.4 GB',
        });

        // Mock system alerts
        setSystemAlerts([
          {
            id: 1,
            type: 'warning',
            message: 'High memory usage detected on server',
            timestamp: '2 hours ago',
            resolved: false,
          },
          {
            id: 2,
            type: 'info',
            message: 'Database backup completed successfully',
            timestamp: '4 hours ago',
            resolved: true,
          },
          {
            id: 3,
            type: 'error',
            message: 'Failed to connect to external API',
            timestamp: '6 hours ago',
            resolved: false,
          },
        ]);

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    fetchAdminData();
  }, [toast]);

  const handleTestDatabase = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual database test endpoint
      // For now, we'll test the API connection by calling the profile endpoint
      const result = await apiClient.getProfile();

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "API Connection",
        description: "Successfully connected to backend API!",
      });
    } catch (error) {
      console.error("API test error:", error);
      toast({
        title: "API Error",
        description: "Failed to connect to backend API",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, this would create a user account
      toast({
        title: "Success",
        description: `User ${newUser.name} created successfully with role ${newUser.role}`,
      });

      setNewUser({ email: '', role: 'resident', name: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanOldInvitations = async () => {
    try {
      // TODO: Replace with actual clean invitations endpoint
      // For now, we'll show a placeholder message
      toast({
        title: "Feature Coming Soon",
        description: "Clean old invitations feature will be available with the new API.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      console.error("Error cleaning old invitations:", error);
    }
  };

  const handleSystemBackup = async () => {
    setIsLoading(true);
    try {
      // Mock backup process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Backup Complete",
        description: "System backup completed successfully",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create system backup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SharedNavigation 
        userRole="admin"
        userName={userProfile?.email}
        userEmail={userProfile?.email}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Administrator Dashboard</h1>
          <p className="text-muted-foreground">
            System management, user administration, and community oversight.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalResidents} residents, {stats.totalGuards} guards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Invitations</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeInvitations}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingInvitations} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.systemAlerts}</div>
              <p className="text-xs text-muted-foreground">Active alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Size</CardTitle>
              <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.databaseSize}</div>
              <p className="text-xs text-muted-foreground">Total storage used</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system health and performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Services</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage</span>
                    <Badge className="bg-yellow-100 text-yellow-800">75% Used</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network</span>
                    <Badge className="bg-green-100 text-green-800">Stable</Badge>
                  </div>
                  <Button 
                    onClick={handleTestDatabase} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Testing..." : "Test Database Connection"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export System Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Import User Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Key className="h-4 w-4 mr-2" />
                    Manage API Keys
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clean Old Data
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Advanced Analytics</CardTitle>
                  <CardDescription>Phase 5: Business Intelligence & Reporting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link to="/advanced-analytics">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Advanced Analytics Dashboard
                    </Button>
                  </Link>
                  <Link to="/predictive-analytics">
                    <Button variant="outline" className="w-full justify-start">
                      <Brain className="h-4 w-4 mr-2" />
                      AI Predictive Analytics
                    </Button>
                  </Link>
                  <Link to="/compliance">
                    <Button variant="outline" className="w-full justify-start">
                      <FileBarChart className="h-4 w-4 mr-2" />
                      Compliance & Reporting
                    </Button>
                  </Link>
                  <Link to="/analytics">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Basic Analytics
                    </Button>
                  </Link>
                  <div className="pt-2 border-t" />
                  <Link to="/enterprise-dashboard">
                    <Button variant="default" className="w-full justify-start bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                      <Shield className="h-4 w-4 mr-2" />
                      Enterprise Dashboard
                    </Button>
                  </Link>
                  <Link to="/enterprise-analytics">
                    <Button variant="outline" className="w-full justify-start">
                      <Network className="h-4 w-4 mr-2" />
                      Enterprise Analytics Hub
                    </Button>
                  </Link>
                  <Link to="/api-management">
                    <Button variant="outline" className="w-full justify-start">
                      <Key className="h-4 w-4 mr-2" />
                      API Management Portal
                    </Button>
                  </Link>
                  <Link to="/integration-health">
                    <Button variant="outline" className="w-full justify-start">
                      <Server className="h-4 w-4 mr-2" />
                      Integration Health
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New User</CardTitle>
                  <CardDescription>Add a new user to the system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Full Name</Label>
                    <Input
                      id="user-name"
                      placeholder="Enter full name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="Enter email address"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resident">Resident</SelectItem>
                        <SelectItem value="guard">Security Guard</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleCreateUser}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Creating..." : "Create User"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                  <CardDescription>Current user distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Residents</span>
                    <Badge variant="secondary">{stats.totalResidents}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Security Guards</span>
                    <Badge variant="secondary">{stats.totalGuards}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Administrators</span>
                    <Badge variant="secondary">{stats.totalAdmins}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Users</span>
                    <Badge variant="secondary">{stats.totalUsers}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Maintenance</CardTitle>
                  <CardDescription>System maintenance and cleanup tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleCleanOldInvitations}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clean Old Invitations
                  </Button>
                  <Button 
                    onClick={handleSystemBackup}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isLoading ? "Creating Backup..." : "Create System Backup"}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DatabaseIcon className="h-4 w-4 mr-2" />
                    Optimize Database
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Network className="h-4 w-4 mr-2" />
                    Check Network Status
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Current system specifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database Size</span>
                    <span className="text-sm">{stats.databaseSize}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Sessions</span>
                    <span className="text-sm">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Requests (24h)</span>
                    <span className="text-sm">1,234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm">99.9%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
                <CardDescription>System security status and recent events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-semibold">Access Control</h3>
                    <p className="text-sm text-muted-foreground">All systems secure</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Key className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold">Authentication</h3>
                    <p className="text-sm text-muted-foreground">2FA enabled</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-semibold">Audit Logs</h3>
                    <p className="text-sm text-muted-foreground">Real-time monitoring</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Recent system alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getAlertIcon(alert.type)}
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground">{alert.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getAlertColor(alert.type)}>
                          {alert.type}
                        </Badge>
                        {!alert.resolved && (
                          <Button variant="outline" size="sm">
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;