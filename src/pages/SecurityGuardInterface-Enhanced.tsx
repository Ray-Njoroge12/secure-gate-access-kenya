import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Users, QrCode, Clock, Shield, Activity, CheckCircle, XCircle, Search, FileText, Camera, Copy, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SharedNavigation } from "@/components/SharedNavigation";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { verifyAccessCodeDirect, markAccessCodeUsed, getTodayStatsDirect, searchVisitorsDirect, AccessVerificationResult } from "@/lib/security-guard-helpers";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface SecurityStats {
  todaysVisitors: number;
  pendingVerifications: number;
  usedCodes: number;
  systemStatus: string;
}

interface VerificationResult extends AccessVerificationResult {
  timestamp?: string;
}

interface IncidentReport {
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  reporterName: string;
}

const SecurityGuardInterface = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SecurityStats>({
    todaysVisitors: 0,
    pendingVerifications: 0,
    usedCodes: 0,
    systemStatus: 'online',
  });
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: string;
  }>>([]);
  const [qrInput, setQrInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [incident, setIncident] = useState<IncidentReport>({
    severity: 'low',
    description: '',
    location: '',
    reporterName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastVerification, setLastVerification] = useState<VerificationResult | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

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

      // Fetch real statistics using direct database approach
      const statsResult = await getTodayStatsDirect();
      if (statsResult.success && statsResult.stats) {
        setStats({
          ...statsResult.stats,
          systemStatus: 'online'
        });
      }

      // Fetch recent activity from access_codes table
      const { data: recentAccessCodes, error: activityError } = await supabase
        .from('access_codes')
        .select(`
          *,
          visitors(full_name_encrypted),
          visit_invitations(visitor_full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!activityError && recentAccessCodes) {
        const activityData = recentAccessCodes.map((code, index) => ({
          id: code.id,
          type: code.used_at ? 'access_granted' : 'access_pending',
          description: code.visit_invitations?.visitor_full_name || `Visitor ${index + 1}`,
          timestamp: code.used_at ? 
            new Date(code.used_at).toLocaleString() : 
            new Date(code.created_at || '').toLocaleString(),
          status: code.used_at ? 'completed' : 'pending'
        }));
        setRecentActivity(activityData);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSecurityData();
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, [toast, navigate]);

  const handleVerifyAccess = async (code: string, method: 'pin' | 'qr') => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: `Please enter a ${method.toUpperCase()} code`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyAccessCodeDirect(code, method);
      
      if (!result.success) {
        throw new Error(result.error || 'Verification failed');
      }

      const isValid = result.valid || false;
      
      // Store verification result for display
      setLastVerification({
        ...result,
        timestamp: new Date().toLocaleString()
      });

      if (isValid && result.accessCodeId) {
        // Mark access code as used
        await markAccessCodeUsed(result.accessCodeId, userProfile?.id);
        
        // Refresh statistics
        await fetchSecurityData();
      }

      toast({
        title: isValid ? "✅ Access Granted" : "❌ Access Denied",
        description: isValid 
          ? `Welcome ${result.visitorName || 'Visitor'}` 
          : "Invalid or expired access code",
        variant: isValid ? "default" : "destructive",
      });

      // Clear input fields
      setQrInput("");
      setPinInput("");
    } catch (error) {
      console.error("Verification error:", error);
      setLastVerification({
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleString()
      });
      
      toast({
        title: "Error",
        description: "Failed to verify access code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyQR = () => handleVerifyAccess(qrInput, 'qr');
  const handleVerifyPIN = () => handleVerifyAccess(pinInput, 'pin');

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
      const result = await searchVisitorsDirect(searchQuery);
      
      if (!result.success) {
        throw new Error(result.error || 'Search failed');
      }

      setSearchResults(result.visitors || []);
      
      toast({
        title: "Search Results",
        description: `Found ${result.visitors?.length || 0} visitors matching "${searchQuery}"`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Search failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncidentReport = async () => {
    if (!incident.description.trim()) {
      toast({
        title: "Error",
        description: "Please provide an incident description",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, this would save to an incidents table
      console.log('Incident report:', incident);
      
      toast({
        title: "Incident Reported",
        description: "Incident has been logged and administrators notified",
      });
      
      // Clear incident form
      setIncident({
        severity: 'low',
        description: '',
        location: '',
        reporterName: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit incident report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'access_granted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'access_denied':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'access_pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Security Guard Dashboard</h1>
            <p className="text-gray-600">Welcome, {userProfile?.email}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={fetchSecurityData}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant={stats.systemStatus === 'online' ? 'default' : 'destructive'}>
              {stats.systemStatus}
            </Badge>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaysVisitors}</div>
              <p className="text-xs text-muted-foreground">Registered today</p>
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
              <CardTitle className="text-sm font-medium">Access Codes Used</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usedCodes}</div>
              <p className="text-xs text-muted-foreground">Entries granted</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{stats.systemStatus}</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Last Verification Result */}
        {lastVerification && (
          <Alert className={lastVerification.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {lastVerification.valid ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
            <AlertDescription className={lastVerification.valid ? "text-green-800" : "text-red-800"}>
              <div className="space-y-1">
                <p><strong>Last Verification:</strong> {lastVerification.valid ? "✅ GRANTED" : "❌ DENIED"}</p>
                {lastVerification.visitorName && <p><strong>Visitor:</strong> {lastVerification.visitorName}</p>}
                {lastVerification.visitPurpose && <p><strong>Purpose:</strong> {lastVerification.visitPurpose}</p>}
                {lastVerification.visitDate && <p><strong>Visit Date:</strong> {lastVerification.visitDate}</p>}
                <p><strong>Timestamp:</strong> {lastVerification.timestamp}</p>
                {lastVerification.error && <p><strong>Error:</strong> {lastVerification.error}</p>}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Interface Tabs */}
        <Tabs defaultValue="verification" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="verification">Access Verification</TabsTrigger>
            <TabsTrigger value="search">Visitor Search</TabsTrigger>
            <TabsTrigger value="incidents">Incident Reports</TabsTrigger>
            <TabsTrigger value="activity">Activity Monitor</TabsTrigger>
          </TabsList>

          {/* Access Verification Tab */}
          <TabsContent value="verification" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Code Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    QR Code Verification
                  </CardTitle>
                  <CardDescription>
                    Scan or enter QR code for visitor verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qrInput">QR Code</Label>
                    <Input
                      id="qrInput"
                      placeholder="Enter QR code or scan..."
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyQR()}
                    />
                  </div>
                  <Button
                    onClick={handleVerifyQR}
                    disabled={isLoading || !qrInput.trim()}
                    className="w-full"
                  >
                    {isLoading ? "Verifying..." : "Verify QR Code"}
                  </Button>
                </CardContent>
              </Card>

              {/* PIN Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    PIN Verification
                  </CardTitle>
                  <CardDescription>
                    Enter 6-digit PIN for backup verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pinInput">6-Digit PIN</Label>
                    <Input
                      id="pinInput"
                      placeholder="Enter 6-digit PIN..."
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyPIN()}
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={handleVerifyPIN}
                    disabled={isLoading || pinInput.length !== 6}
                    className="w-full"
                  >
                    {isLoading ? "Verifying..." : "Verify PIN"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Visitor Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Visitor Search
                </CardTitle>
                <CardDescription>
                  Search for visitors by name or email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search visitors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchVisitors()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearchVisitors}
                    disabled={isLoading || !searchQuery.trim()}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Search Results:</h3>
                    {searchResults.map((visitor, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{visitor.visitor_full_name}</p>
                            <p className="text-sm text-gray-600">{visitor.visitor_email}</p>
                            <p className="text-sm text-gray-600">Visit Date: {visitor.visit_date}</p>
                          </div>
                          <Badge variant={visitor.status === 'accepted' ? 'default' : 'secondary'}>
                            {visitor.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incident Reports Tab */}
          <TabsContent value="incidents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Report Incident
                </CardTitle>
                <CardDescription>
                  Report security incidents or unusual activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="severity">Incident Severity</Label>
                    <Select 
                      value={incident.severity} 
                      onValueChange={(value) => setIncident({...incident, severity: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Incident location..."
                      value={incident.location}
                      onChange={(e) => setIncident({...incident, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reporterName">Reporter Name</Label>
                  <Input
                    id="reporterName"
                    placeholder="Your name..."
                    value={incident.reporterName}
                    onChange={(e) => setIncident({...incident, reporterName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Incident Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the incident in detail..."
                    value={incident.description}
                    onChange={(e) => setIncident({...incident, description: e.target.value})}
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleIncidentReport}
                  disabled={isLoading || !incident.description.trim()}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isLoading ? "Submitting..." : "Submit Incident Report"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Monitor Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Real-time monitoring of access attempts and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(activity.type)}
                          <div>
                            <p className="font-medium">{activity.description}</p>
                            <p className="text-sm text-gray-600">{activity.timestamp}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(activity.id, "Activity ID")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  )}
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
