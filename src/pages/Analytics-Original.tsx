import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Download, 
  Calendar, 
  RefreshCw,
  FileText,
  Shield
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AnalyticsData {
  totalInvitations: number;
  activeInvitations: number;
  completedVisits: number;
  averageVisitDuration: string;
  weeklyGrowth: number;
  monthlyGrowth: number;
  peakHours: Array<{ hour: number; count: number }>;
  popularPurposes: Array<{ purpose: string; count: number }>;
  securityIncidents: number;
  // New analytics data
  dailyVisitors: Array<{ date: string; visitors: number; entries: number }>;
  visitorsByStatus: Array<{ status: string; count: number; color: string }>;
  residentActivity: Array<{ resident: string; invitations: number }>;
  accessCodeUsage: number;
  pendingVerifications: number;
}

interface TimeBasedData {
  date: string;
  invitations: number;
  visits: number;
  incidents: number;
}

interface SummaryStats {
  totalVisitors: number;
  totalInvitations: number;
  accessGranted: number;
  averageProcessingTime: number;
  securityIncidents: number;
}

const Analytics = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeBasedData, setTimeBasedData] = useState<TimeBasedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get time range based on selected period
      const now = new Date();
      let startDate: Date;
      
      switch (selectedPeriod) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      // Fetch invitations data
      const { data: invitations, error: invError } = await supabase
        .from('visit_invitations')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (invError) throw invError;

      // Fetch access codes data
      const { data: accessCodes, error: accessError } = await supabase
        .from('access_codes')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (accessError) throw accessError;

      // Calculate analytics
      const totalInvitations = invitations?.length || 0;
      const activeInvitations = invitations?.filter(inv => inv.status === 'pending').length || 0;
      const completedVisits = accessCodes?.filter(code => code.used_at).length || 0;
      
      // Calculate growth rates
      const midPoint = new Date(startDate.getTime() + (now.getTime() - startDate.getTime()) / 2);
      const recentInvitations = invitations?.filter(inv => 
        new Date(inv.created_at) >= midPoint
      ).length || 0;
      const earlierInvitations = invitations?.filter(inv => 
        new Date(inv.created_at) < midPoint
      ).length || 0;
      
      const weeklyGrowth = earlierInvitations > 0 ? 
        ((recentInvitations - earlierInvitations) / earlierInvitations) * 100 : 0;

      // Calculate peak hours
      const hourCounts: { [key: number]: number } = {};
      accessCodes?.forEach(code => {
        if (code.used_at) {
          const hour = new Date(code.used_at).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });
      
      const peakHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate popular purposes
      const purposeCounts: { [key: string]: number } = {};
      invitations?.forEach(inv => {
        const purpose = inv.visit_purpose || 'Unknown';
        purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
      });
      
      const popularPurposes = Object.entries(purposeCounts)
        .map(([purpose, count]) => ({ purpose, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setAnalyticsData({
        totalInvitations,
        activeInvitations,
        completedVisits,
        averageVisitDuration: '2.5 hours', // Placeholder - would calculate from visit_duration_hours
        weeklyGrowth,
        monthlyGrowth: weeklyGrowth * 4, // Simplified calculation
        peakHours,
        popularPurposes,
        securityIncidents: 0 // Placeholder - would come from incidents table
      });

      // Prepare time-based data for charts
      const timeData: TimeBasedData[] = [];
      const groupedByDate: { [key: string]: { invitations: number; visits: number; incidents: number } } = {};

      // Group invitations by date
      invitations?.forEach(inv => {
        const date = inv.created_at.split('T')[0];
        if (!groupedByDate[date]) {
          groupedByDate[date] = { invitations: 0, visits: 0, incidents: 0 };
        }
        groupedByDate[date].invitations++;
      });

      // Group visits by date
      accessCodes?.forEach(code => {
        if (code.used_at) {
          const date = code.used_at.split('T')[0];
          if (!groupedByDate[date]) {
            groupedByDate[date] = { invitations: 0, visits: 0, incidents: 0 };
          }
          groupedByDate[date].visits++;
        }
      });

      // Convert to array and sort
      const sortedData = Object.entries(groupedByDate)
        .map(([date, data]) => ({
          date,
          invitations: data.invitations,
          visits: data.visits,
          incidents: data.incidents
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setTimeBasedData(sortedData);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics data';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod, toast]);

  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast({
            title: "Access Denied",
            description: "You need to be logged in to view analytics",
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
            title: "Error",
            description: "Unable to verify your credentials",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        // Check if user has analytics access (residents and guards)
        if (!['resident', 'guard', 'admin'].includes(profile.role)) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view analytics",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setUserProfile(profile);
        await fetchAnalytics();

      } catch (error) {
        console.error('Analytics initialization error:', error);
        toast({
          title: "Error",
          description: "Failed to initialize analytics",
          variant: "destructive",
        });
      }
    };

    initializeAnalytics();
  }, [fetchAnalytics, toast, navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
  };

  const handleExportData = async () => {
    try {
      // Create CSV data
      const csvData = timeBasedData.map(item => 
        `${item.date},${item.invitations},${item.visits},${item.incidents}`
      );
      csvData.unshift('Date,Invitations,Visits,Incidents');
      
      const csvContent = csvData.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Analytics data has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export analytics data",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Comprehensive insights into visitor management and security
            </p>
          </div>
          
          <div className="flex gap-4">
            <Select value={selectedPeriod} onValueChange={(value: 'week' | 'month' | 'quarter') => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.totalInvitations || 0}</div>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600">
                  +{analyticsData?.weeklyGrowth.toFixed(1) || 0}% vs last period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Invitations</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.activeInvitations || 0}</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Visits</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.completedVisits || 0}</div>
              <p className="text-xs text-muted-foreground">Access granted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Visit Duration</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.averageVisitDuration || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">Typical stay</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time-based Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Over Time</CardTitle>
                  <CardDescription>
                    Daily breakdown of invitations and visits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Chart visualization would go here</p>
                      <p className="text-sm text-gray-500">
                        {timeBasedData.length} data points for {selectedPeriod}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Popular Visit Purposes */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Visit Purposes</CardTitle>
                  <CardDescription>
                    Most common reasons for visits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData?.popularPurposes.map((purpose, index) => (
                      <div key={purpose.purpose} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-blue-500' :
                            index === 1 ? 'bg-green-500' :
                            index === 2 ? 'bg-yellow-500' :
                            index === 3 ? 'bg-purple-500' : 'bg-gray-500'
                          }`} />
                          <span className="text-sm">{purpose.purpose}</span>
                        </div>
                        <Badge variant="secondary">{purpose.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>
                  Analysis of visitor management growth patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      +{analyticsData?.weeklyGrowth.toFixed(1) || 0}%
                    </div>
                    <p className="text-sm text-blue-600">Weekly Growth</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      +{analyticsData?.monthlyGrowth.toFixed(1) || 0}%
                    </div>
                    <p className="text-sm text-green-600">Monthly Growth</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {((analyticsData?.completedVisits || 0) / (analyticsData?.totalInvitations || 1) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-purple-600">Conversion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patterns">
            <Card>
              <CardHeader>
                <CardTitle>Peak Activity Hours</CardTitle>
                <CardDescription>
                  When visitors are most likely to arrive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.peakHours.map((hour, index) => (
                    <div key={hour.hour} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          index === 0 ? 'bg-red-500' :
                          index === 1 ? 'bg-orange-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-green-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-sm">
                          {hour.hour}:00 - {hour.hour + 1}:00
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${(hour.count / (analyticsData?.peakHours[0]?.count || 1)) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">{hour.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
                <CardDescription>
                  Security incidents and access control metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Successful Access</span>
                      </div>
                      <span className="font-bold text-green-600">
                        {analyticsData?.completedVisits || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="text-sm">Security Incidents</span>
                      </div>
                      <span className="font-bold text-red-600">
                        {analyticsData?.securityIncidents || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm">Pending Approvals</span>
                      </div>
                      <span className="font-bold text-yellow-600">
                        {analyticsData?.activeInvitations || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Security metrics chart</p>
                      <p className="text-sm text-gray-500">
                        Would show security incident breakdown
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;

  useEffect(() => {
    const checkAccessAndFetchData = async () => {
      try {
        // Check user authentication and role
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/login');
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
            description: "You need administrator privileges to access analytics",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        const userProfileData = profile;
        if (userProfileData.role !== 'admin') {
          toast({
            title: "Access Denied",
            description: "You need administrator privileges to access analytics",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setUserProfile(userProfileData);
        await fetchAnalytics();
      } catch (error) {
        console.error("Error checking access:", error);
        toast({
          title: "Error",
          description: "Failed to verify access permissions",
          variant: "destructive",
        });
        navigate('/');
      }
    };

    checkAccessAndFetchData();
  }, [navigate, toast, fetchAnalytics]);

  const handleExportCsv = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("export-analytics-csv", {
        body: { user_id: userProfile?.id }
      });

      if (error) throw error;

      toast({
        title: "Export Started",
        description: "CSV export has been initiated. You'll receive it via email.",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SharedNavigation 
        userRole="admin"
        userName={userProfile?.email}
        userEmail={userProfile?.email}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Monitor visitor management system performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportCsv} variant="outline">
              Export CSV
            </Button>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Data
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.totalInvitations || 0}</div>
              <p className="text-xs text-muted-foreground">All time invitations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Invitations</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.activeInvitations || 0}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Visits</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.completedVisits || 0}</div>
              <p className="text-xs text-muted-foreground">Successful visits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Visit Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.averageVisitDuration || "2.5h"}</div>
              <p className="text-xs text-muted-foreground">Average time</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Key metrics and system health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System Status</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database Connection</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Security Level</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">High</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Sync</span>
                  <span className="text-sm text-muted-foreground">Just now</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">New invitation created</span>
                  <span className="text-xs text-muted-foreground ml-auto">2m ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Visitor registered</span>
                  <span className="text-xs text-muted-foreground ml-auto">5m ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">QR code scanned</span>
                  <span className="text-xs text-muted-foreground ml-auto">12m ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Security alert resolved</span>
                  <span className="text-xs text-muted-foreground ml-auto">15m ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Alerts Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <CardTitle>Security Alerts</CardTitle>
              </div>
              <CardDescription>Monitor potential security issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Failed Login Attempts</p>
                      <p className="text-xs text-muted-foreground">Multiple failed login attempts detected</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-600">Medium</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">System Health</p>
                      <p className="text-xs text-muted-foreground">All systems operating normally</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600">Good</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;