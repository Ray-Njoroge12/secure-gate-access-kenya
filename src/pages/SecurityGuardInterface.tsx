import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Users, QrCode, Clock, Shield, Activity, CheckCircle, XCircle, Search, FileText, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SharedNavigation } from "@/components/SharedNavigation";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface SecurityStats {
  todaysVisitors: number;
  pendingVerifications: number;
  recentIncidents: number;
  systemStatus: string;
}

const SecurityGuardInterface = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SecurityStats>({
    todaysVisitors: 0,
    pendingVerifications: 0,
    recentIncidents: 0,
    systemStatus: 'online',
  });
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>>([]);
  const [qrInput, setQrInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [incident, setIncident] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        // Get user profile
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast({
            title: "Access Denied",
            description: "You need to be logged in to access this dashboard",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        // Get user profile to check role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          toast({
            title: "Access Denied",
            description: "You need security guard privileges to access this dashboard",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        const userProfileData = profile;
        if (userProfileData.role !== 'guard') {
          toast({
            title: "Access Denied",
            description: "You need security guard privileges to access this dashboard",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setUserProfile(userProfileData);

        // Fetch security statistics
        const today = new Date().toISOString().split('T')[0];
        
        // Mock data for now - in real implementation, these would be actual database queries
        setStats({
          todaysVisitors: Math.floor(Math.random() * 50) + 20,
          pendingVerifications: Math.floor(Math.random() * 10) + 2,
          recentIncidents: Math.floor(Math.random() * 5),
          systemStatus: 'online',
        });

        // Mock recent activity
        setRecentActivity([
          { id: "1", type: 'access_granted', description: 'John Doe', timestamp: '2 minutes ago' },
          { id: "2", type: 'access_denied', description: 'Jane Smith', timestamp: '5 minutes ago' },
          { id: "3", type: 'incident_reported', description: 'Unknown', timestamp: '10 minutes ago' },
          { id: "4", type: 'access_granted', description: 'Mike Johnson', timestamp: '15 minutes ago' },
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

    fetchSecurityData();
  }, [toast, navigate]);

  const handleVerifyQR = async () => {
    if (!qrInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a QR code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-access-code", {
        body: { code: qrInput },
      });

      if (error) throw error;

      const isValid = data.valid;
      
      toast({
        title: isValid ? "Access Granted" : "Access Denied",
        description: isValid ? "Visitor verified successfully" : "Invalid or expired QR code",
        variant: isValid ? "default" : "destructive",
      });

      // Log the verification attempt
      await supabase
        .from("audit_logs")
        .insert({
          event_type: isValid ? "access_granted" : "access_denied",
          details: { 
            qr_code: qrInput,
            verified: isValid,
            guard_id: userProfile?.id 
          },
        });

      setQrInput("");
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Error",
        description: "Failed to verify QR code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchVisitors = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Mock search functionality
      toast({
        title: "Search Results",
        description: `Found 3 visitors matching "${searchQuery}"`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search visitors",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportIncident = async () => {
    if (!incident.trim()) {
      toast({
        title: "Error",
        description: "Please describe the incident",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("audit_logs")
        .insert({
          event_type: "incident_reported",
          details: { 
            description: incident,
            guard_id: userProfile?.id,
            severity: "medium"
          },
        });

      if (error) throw error;

      toast({
        title: "Incident Reported",
        description: "Incident has been logged successfully",
      });

      setIncident("");
    } catch (error) {
      console.error("Incident reporting error:", error);
      toast({
        title: "Error",
        description: "Failed to report incident",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'access_granted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'access_denied':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'incident_reported':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SharedNavigation 
        userRole="guard"
        userName={userProfile?.email}
        userEmail={userProfile?.email}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Security Guard Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor visitor access, verify QR codes, and maintain community security.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaysVisitors}</div>
              <p className="text-xs text-muted-foreground">Visitors today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentIncidents}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">
                  {stats.systemStatus}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Verification
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Visitor Search
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Incidents
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verification" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    <CardTitle>QR Code Verification</CardTitle>
                  </div>
                  <CardDescription>
                    Scan or enter QR code to verify visitor access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qr-input">QR Code</Label>
                    <Input
                      id="qr-input"
                      placeholder="Enter QR code here..."
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerifyQR()}
                    />
                  </div>
                  <Button 
                    onClick={handleVerifyQR}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Verifying..." : "Verify Access"}
                  </Button>
                  
                  <div className="text-center">
                    <Button variant="outline" size="sm" className="flex items-center gap-2 mx-auto">
                      <Camera className="h-4 w-4" />
                      Scan QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <CardTitle>Quick Actions</CardTitle>
                  </div>
                  <CardDescription>
                    Common security operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    View Today's Visitors
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report Suspicious Activity
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Emergency Lockdown
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    System Status Check
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  <CardTitle>Visitor Search</CardTitle>
                </div>
                <CardDescription>
                  Search for visitor information by name, ID, or phone number
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Term</Label>
                  <Input
                    id="search"
                    placeholder="Enter visitor name, ID, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchVisitors()}
                  />
                </div>
                <Button 
                  onClick={handleSearchVisitors}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Searching..." : "Search Visitors"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <CardTitle>Report Incident</CardTitle>
                  </div>
                  <CardDescription>
                    Log security incidents or unusual activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="incident">Incident Description</Label>
                    <Textarea
                      id="incident"
                      placeholder="Describe the incident in detail..."
                      value={incident}
                      onChange={(e) => setIncident(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={handleReportIncident}
                    disabled={isLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    {isLoading ? "Reporting..." : "Report Incident"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle>System Status</CardTitle>
                  </div>
                  <CardDescription>
                    Current system status and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Status</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database</span>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">QR Scanner</span>
                    <Badge className="bg-green-100 text-green-800">Ready</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network</span>
                    <Badge className="bg-green-100 text-green-800">Stable</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <CardTitle>Recent Activity</CardTitle>
                </div>
                <CardDescription>
                  Latest security events and access attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(activity.type)}
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.type.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor('success')}>
                          Success
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.timestamp}
                        </p>
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

export default SecurityGuardInterface;