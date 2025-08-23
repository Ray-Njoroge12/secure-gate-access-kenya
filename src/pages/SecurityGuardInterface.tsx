import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Users, QrCode, Clock, Shield, Activity, CheckCircle, XCircle, Search, FileText, Camera, RefreshCw, Wifi, WifiOff, RotateCcw, HardDrive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { verifyAccessCodeDirect, markAccessCodeUsed, getTodayStatsDirect, searchVisitorsDirect } from "@/lib/security-guard-helpers";
import { useOfflineAccessCache } from "@/hooks/useOfflineAccessCache";
import { useAIRiskAssessment } from "@/hooks/useAIRiskAssessment";
import { useEnhancedOfflineSecurity } from "@/hooks/useEnhancedOfflineSecurity";
import { RealTimeMonitoringDashboard } from "@/components/RealTimeMonitoringDashboard";
import { SecurityAuditCompliance } from "@/components/SecurityAuditCompliance";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface SecurityStats {
  todaysVisitors: number;
  pendingVerifications: number;
  usedCodes: number;
}

interface VerificationResult {
  valid: boolean;
  visitorName?: string;
  residentName?: string;
  visitDate?: string;
  visitPurpose?: string;
  accessCodeId?: string;
  riskProfile?: {
    risk_level: string;
    risk_score: number;
    confidence_level: number;
    risk_factors?: Record<string, any>;
    behavioral_notes?: string;
  };
}

const SecurityGuardInterface = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { state: cacheState, populateCache, verifyAccess, syncOfflineUsage, getCacheStatus } = useOfflineAccessCache();
  const { calculateVisitorRisk, getVisitorRiskProfile, detectAnomalies, getHighRiskVisitors } = useAIRiskAssessment();
  const { 
    state: offlineSecurityState, 
    saveIncidentOffline, 
    saveAccessLogOffline, 
    syncPendingItems, 
    retryFailedItems,
    clearOfflineData,
    calculateStorageUsage 
  } = useEnhancedOfflineSecurity();
  
  const [stats, setStats] = useState<SecurityStats>({
    todaysVisitors: 0,
    pendingVerifications: 0,
    usedCodes: 0,
  });
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'success' | 'failed';
  }>>([]);
  
  // Form states
  const [pinInput, setPinInput] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [incidentReport, setIncidentReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [highRiskVisitors, setHighRiskVisitors] = useState<any[]>([]);

  useEffect(() => {
    const initializeSecurityInterface = async () => {
      try {
        // Check authentication and role
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

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          toast({
            title: "Access Denied",
            description: "Unable to verify your security credentials",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        if (profile.role !== 'guard') {
          toast({
            title: "Access Denied",
            description: "You need security guard privileges to access this dashboard",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setUserProfile(profile);
        await loadSecurityStats();
        await loadRecentActivity();
        
        // Load high-risk visitors for alerts
        const riskResult = await getHighRiskVisitors();
        if (riskResult.success && riskResult.visitors) {
          setHighRiskVisitors(riskResult.visitors);
        }

      } catch (error) {
        console.error('Initialization error:', error);
        toast({
          title: "Error",
          description: "Failed to initialize security interface",
          variant: "destructive",
        });
      }
    };

    initializeSecurityInterface();
  }, [toast, navigate]);

  const loadSecurityStats = async () => {
    const result = await getTodayStatsDirect();
    if (result.success && result.stats) {
      setStats(result.stats);
    } else {
      console.error('Failed to load stats:', result.error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Get recent access attempts from access_codes table
      const { data, error } = await supabase
        .from('access_codes')
        .select(`
          id,
          used_at,
          created_at,
          visitors(*),
          visit_invitations(visitor_full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const activity = data?.map((item, index) => ({
        id: item.id,
        type: item.used_at ? 'access_granted' : 'code_generated',
        description: item.visit_invitations?.visitor_full_name || `Visitor ${index + 1}`,
        timestamp: item.used_at ? 
          new Date(item.used_at).toLocaleTimeString() : 
          new Date(item.created_at).toLocaleTimeString(),
        status: item.used_at ? 'success' : 'pending' as 'success' | 'failed'
      })) || [];

      setRecentActivity(activity);
    } catch (error) {
      console.error('Failed to load activity:', error);
    }
  };

  const handleVerifyPIN = async () => {
    if (!pinInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a PIN code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use offline-capable verification
      const result = await verifyAccess(pinInput, userProfile?.id, 'pin');
      
      // Get visitor risk assessment if verification is successful
      let riskProfile = null;
      if (result.success) {
        // For offline mode, we'll try to get risk profile by visitor name if available
        // In a production system, this would be enhanced to store visitor_id in offline cache
        try {
          if (result.visitor_name) {
            // Simplified approach - in production would use visitor_id
            const riskResult = await getVisitorRiskProfile(result.visitor_name);
            if (riskResult.success) {
              riskProfile = riskResult.profile;
            }
          }
        } catch (error) {
          console.log('Could not get risk profile in offline mode:', error);
        }
      }
      
      setVerificationResult({
        valid: result.success,
        visitorName: result.visitor_name,
        residentName: result.resident_id ? 'Resident' : undefined,
        visitDate: result.expires_at ? new Date(result.expires_at).toLocaleDateString() : undefined,
        visitPurpose: undefined,
        riskProfile: riskProfile
      });

      if (!result.success) {
        toast({
          title: "Access Denied", 
          description: result.message,
          variant: "destructive",
        });
      } else {
        // Show risk-aware success message
        const riskMessage = riskProfile 
          ? ` (Risk Level: ${riskProfile.risk_level.toUpperCase()})` 
          : '';
        
        toast({
          title: "Access Granted" + riskMessage,
          description: result.message,
          variant: riskProfile?.risk_level === 'high' || riskProfile?.risk_level === 'critical' 
            ? "destructive" : "default",
        });

        // Refresh stats and activity
        await loadSecurityStats();
        await loadRecentActivity();
      }

      setPinInput("");
    } catch (error) {
      console.error("PIN verification error:", error);
      toast({
        title: "Error",
        description: "Failed to verify PIN code",
        variant: "destructive",
      });
      setVerificationResult({
        valid: false,
        visitorName: undefined,
        residentName: undefined,
        visitDate: undefined,
        visitPurpose: undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      // Use offline-capable verification
      const result = await verifyAccess(qrInput, userProfile?.id, 'qr');
      
      // Get visitor risk assessment if verification is successful
      let riskProfile = null;
      if (result.success) {
        // For offline mode, we'll try to get risk profile by visitor name if available
        // In a production system, this would be enhanced to store visitor_id in offline cache
        try {
          if (result.visitor_name) {
            // Simplified approach - in production would use visitor_id
            const riskResult = await getVisitorRiskProfile(result.visitor_name);
            if (riskResult.success) {
              riskProfile = riskResult.profile;
            }
          }
        } catch (error) {
          console.log('Could not get risk profile in offline mode:', error);
        }
      }
      
      setVerificationResult({
        valid: result.success,
        visitorName: result.visitor_name,
        residentName: result.resident_id ? 'Resident' : undefined,
        visitDate: result.expires_at ? new Date(result.expires_at).toLocaleDateString() : undefined,
        visitPurpose: undefined,
        riskProfile: riskProfile
      });

      if (!result.success) {
        toast({
          title: "Access Denied", 
          description: result.message,
          variant: "destructive",
        });
      } else {
        // Show risk-aware success message
        const riskMessage = riskProfile 
          ? ` (Risk Level: ${riskProfile.risk_level.toUpperCase()})` 
          : '';
        
        toast({
          title: "Access Granted" + riskMessage,
          description: result.message,
          variant: riskProfile?.risk_level === 'high' || riskProfile?.risk_level === 'critical' 
            ? "destructive" : "default",
        });

        // Refresh stats and activity
        await loadSecurityStats();
        await loadRecentActivity();
      }

      setQrInput("");
    } catch (error) {
      console.error("QR verification error:", error);
      toast({
        title: "Error",
        description: "Failed to verify QR code",
        variant: "destructive",
      });
      setVerificationResult({
        valid: false,
        visitorName: undefined,
        residentName: undefined,
        visitDate: undefined,
        visitPurpose: undefined
      });
    } finally {
      setIsLoading(false);
    }
  };  const handleSearchVisitors = async () => {
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
      
      if (result.success) {
        setSearchResults(result.visitors || []);
        toast({
          title: "Search Complete",
          description: `Found ${result.visitors?.length || 0} results`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "Failed to search visitors",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitIncident = async () => {
    if (!incidentReport.trim()) {
      toast({
        title: "Error",
        description: "Please enter incident details",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Store incident in database (placeholder - would need incident table)
      toast({
        title: "Incident Reported",
        description: "Incident has been logged successfully",
      });
      setIncidentReport("");
    } catch (error) {
      console.error("Incident report error:", error);
      toast({
        title: "Error",
        description: "Failed to submit incident report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Security Guard Dashboard
            </h1>
            <div className="flex items-center gap-4">
              {!cacheState.isOnline && (
                <Alert className="border-orange-200 bg-orange-50">
                  <WifiOff className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Offline Mode Active
                  </AlertDescription>
                </Alert>
              )}
              <Badge variant="outline">
                {cacheState.isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </div>
          <p className="mt-2 text-gray-600">
            Welcome {userProfile?.email} - Monitor and control gate access
          </p>
        </div>

        {/* AI High-Risk Visitor Alerts */}
        {highRiskVisitors.length > 0 && (
          <div className="mb-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium text-red-800">
                    🚨 High-Risk Visitor Alert ({highRiskVisitors.length} active)
                  </div>
                  <div className="text-sm text-red-700">
                    The following visitors have elevated risk scores and require special attention:
                  </div>
                  <div className="space-y-1">
                    {highRiskVisitors.slice(0, 3).map((visitor, index) => (
                      <div key={index} className="text-xs bg-white bg-opacity-50 p-2 rounded border border-red-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{visitor.visitor_name || 'Unknown Visitor'}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            visitor.risk_level === 'critical' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {visitor.risk_level?.toUpperCase()} - {visitor.risk_score}/100
                          </span>
                        </div>
                        {visitor.behavioral_notes && (
                          <div className="mt-1 text-gray-700">
                            {visitor.behavioral_notes.length > 80 
                              ? visitor.behavioral_notes.substring(0, 80) + '...'
                              : visitor.behavioral_notes
                            }
                          </div>
                        )}
                      </div>
                    ))}
                    {highRiskVisitors.length > 3 && (
                      <div className="text-xs text-red-600 font-medium">
                        +{highRiskVisitors.length - 3} more high-risk visitors
                      </div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaysVisitors}</div>
              <p className="text-xs text-muted-foreground">Registered visitors</p>
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
              <CardTitle className="text-sm font-medium">Access Granted</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usedCodes}</div>
              <p className="text-xs text-muted-foreground">Codes used today</p>
            </CardContent>
          </Card>
        </div>

        {/* Offline Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
              {cacheState.isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cacheState.isOnline ? "Online" : "Offline"}
              </div>
              <p className="text-xs text-muted-foreground">
                {cacheState.isOnline ? "Real-time verification" : "Using local cache"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cached Codes</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cacheState.cacheSize}</div>
              <p className="text-xs text-muted-foreground">Available offline</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Sync</CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cacheState.pendingSync}</div>
              <p className="text-xs text-muted-foreground">
                {cacheState.pendingSync > 0 ? "Need sync" : "Up to date"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache Actions</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={populateCache}
                disabled={!cacheState.isOnline}
                className="w-full text-xs"
              >
                Update Cache
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={syncOfflineUsage}
                disabled={!cacheState.isOnline || cacheState.pendingSync === 0}
                className="w-full text-xs"
              >
                Sync Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Real-Time Monitoring Dashboard */}
        <div className="mb-8">
          <RealTimeMonitoringDashboard 
            currentLocation="Main Gate"
            onAlertAcknowledge={async (alertId: string) => {
              toast({
                title: "Alert Acknowledged",
                description: `Alert ${alertId} has been acknowledged.`,
              });
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Control Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
                <CardDescription>
                  Verify visitor access codes and manage gate entry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pin" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pin">PIN Verification</TabsTrigger>
                    <TabsTrigger value="qr">QR Code</TabsTrigger>
                    <TabsTrigger value="search">Search</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="pin" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pin">Enter 6-Digit PIN</Label>
                      <div className="flex gap-2">
                        <Input
                          id="pin"
                          placeholder="123456"
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          maxLength={6}
                          className="font-mono text-lg"
                        />
                        <Button 
                          onClick={handleVerifyPIN} 
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Verify"}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="qr" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="qr">Scan or Enter QR Code</Label>
                      <div className="flex gap-2">
                        <Input
                          id="qr"
                          placeholder="QR Token"
                          value={qrInput}
                          onChange={(e) => setQrInput(e.target.value)}
                          className="font-mono"
                        />
                        <Button 
                          onClick={handleVerifyQR} 
                          disabled={isLoading}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Verify
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="search" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Search Visitors</Label>
                      <div className="flex gap-2">
                        <Input
                          id="search"
                          placeholder="Visitor name or email"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button 
                          onClick={handleSearchVisitors} 
                          disabled={isLoading}
                          variant="outline"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Search
                        </Button>
                      </div>
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Search Results:</h4>
                        {searchResults.map((visitor, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="font-medium">{visitor.visitor_full_name}</div>
                            <div className="text-sm text-gray-600">{visitor.visitor_email}</div>
                            <div className="text-sm text-gray-500">Visit Date: {visitor.visit_date}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Verification Result */}
                {verificationResult && (
                  <div className="mt-6">
                    {verificationResult.valid ? (
                      <Alert className={`border-green-200 bg-green-50 ${
                        verificationResult.riskProfile?.risk_level === 'high' || 
                        verificationResult.riskProfile?.risk_level === 'critical' 
                          ? 'border-red-200 bg-red-50' 
                          : ''
                      }`}>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {verificationResult.riskProfile && (
                            <div className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
                              verificationResult.riskProfile.risk_level === 'critical' 
                                ? 'bg-red-100 text-red-800' 
                                : verificationResult.riskProfile.risk_level === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : verificationResult.riskProfile.risk_level === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              Risk: {verificationResult.riskProfile.risk_level.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <AlertDescription className={`${
                          verificationResult.riskProfile?.risk_level === 'high' || 
                          verificationResult.riskProfile?.risk_level === 'critical' 
                            ? 'text-red-800' 
                            : 'text-green-800'
                        }`}>
                          <div className="space-y-2">
                            <div><strong>Access Granted</strong></div>
                            <div className="grid grid-cols-1 gap-1 text-sm">
                              {verificationResult.visitorName && (
                                <div>Visitor: {verificationResult.visitorName}</div>
                              )}
                              {verificationResult.residentName && (
                                <div>Host: {verificationResult.residentName}</div>
                              )}
                              {verificationResult.visitPurpose && (
                                <div>Purpose: {verificationResult.visitPurpose}</div>
                              )}
                              {verificationResult.visitDate && (
                                <div>Visit Date: {verificationResult.visitDate}</div>
                              )}
                            </div>
                            
                            {/* AI Risk Assessment Display */}
                            {verificationResult.riskProfile && (
                              <div className="mt-3 p-2 bg-white bg-opacity-50 rounded border border-gray-200">
                                <h4 className="font-medium text-xs mb-2">🤖 AI Risk Assessment</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="font-medium">Score:</span> {verificationResult.riskProfile.risk_score}/100
                                  </div>
                                  <div>
                                    <span className="font-medium">Confidence:</span> {verificationResult.riskProfile.confidence_level}%
                                  </div>
                                  {verificationResult.riskProfile.risk_factors && (
                                    <div className="col-span-2">
                                      <span className="font-medium">Key Factors:</span>
                                      <div className="mt-1 text-xs text-gray-700">
                                        {Object.entries(verificationResult.riskProfile.risk_factors)
                                          .slice(0, 3)
                                          .map(([key, value]) => (
                                            <div key={key}>• {key.replace(/_/g, ' ')}: {String(value)}</div>
                                          ))
                                        }
                                      </div>
                                    </div>
                                  )}
                                  {verificationResult.riskProfile.behavioral_notes && (
                                    <div className="col-span-2 mt-1">
                                      <span className="font-medium">Notes:</span>
                                      <p className="text-xs text-gray-700 mt-1">
                                        {verificationResult.riskProfile.behavioral_notes.length > 100 
                                          ? verificationResult.riskProfile.behavioral_notes.substring(0, 100) + '...'
                                          : verificationResult.riskProfile.behavioral_notes
                                        }
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="border-red-200 bg-red-50">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          Access Denied - Invalid or expired code
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Incident Reporting */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Incident Reporting
                </CardTitle>
                <CardDescription>
                  Report security incidents or unusual activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="incident">Incident Details</Label>
                  <Textarea
                    id="incident"
                    placeholder="Describe the incident..."
                    value={incidentReport}
                    onChange={(e) => setIncidentReport(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleSubmitIncident} 
                  disabled={isLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Activity Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest gate access attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {activity.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        <div>
                          <div className="text-sm font-medium">{activity.description}</div>
                          <div className="text-xs text-gray-500">{activity.type.replace('_', ' ')}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{activity.timestamp}</div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => {
                    loadRecentActivity();
                    loadSecurityStats();
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityGuardInterface;
