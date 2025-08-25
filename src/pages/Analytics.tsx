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
  PieChart,
  Pie,
  Cell
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuthSession";

// Local minimal profile to decouple from Supabase types
interface Profile { id?: string; user_id?: string; email?: string; role?: string; }

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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalInvitations: 0,
    activeInvitations: 0,
    completedVisits: 0,
    averageVisitDuration: "0h 0m",
    weeklyGrowth: 0,
    monthlyGrowth: 0,
    peakHours: [],
    popularPurposes: [],
    securityIncidents: 0,
    dailyVisitors: [],
    visitorsByStatus: [],
    residentActivity: [],
    accessCodeUsage: 0,
    pendingVerifications: 0
  });
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalVisitors: 0,
    totalInvitations: 0,
    accessGranted: 0,
    averageProcessingTime: 0,
    securityIncidents: 0
  });
  const [timeBasedData, setTimeBasedData] = useState<TimeBasedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [refreshing, setRefreshing] = useState(false);

  // Color scheme for charts
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const { session, loading: authLoading } = useAuthSession();

  useEffect(() => {
    const init = async () => {
      try {
        if (authLoading) return; // wait for auth
        if (!session?.user) { navigate('/'); return; }
        const { data: profiles } = await supabase.from('profiles').select();
        const profile = (profiles || []).find((p: any) => p.id === session.user.id || p.user_id === session.user.id) || null;
        if (!profile) {
          toast({ title: 'Access Denied', description: 'Unable to verify your credentials', variant: 'destructive' });
          navigate('/');
          return;
        }
        if (profile.role && !['admin', 'guard'].includes(profile.role)) {
          toast({ title: 'Access Denied', description: 'You need admin or security privileges to access analytics', variant: 'destructive' });
          navigate('/');
          return;
        }
        setUserProfile(profile);
        await fetchAnalytics();
      } catch (e) {
        console.error('Initialization error:', e);
        toast({ title: 'Error', description: 'Failed to initialize analytics dashboard', variant: 'destructive' });
      }
    };
    init();
  }, [authLoading, session, toast, navigate]);

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
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const fromDate = startDate.toISOString().split('T')[0];
      const toDate = now.toISOString().split('T')[0];

      // Fetch summary stats
      await loadSummaryStats(fromDate, toDate);
      
      // Fetch detailed analytics
      await loadDetailedAnalytics(fromDate, toDate);
      
      // Fetch time-based data
      await loadTimeBasedData(fromDate, toDate);

    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, toast]);

  const loadSummaryStats = async (fromDate: string, toDate: string) => {
    try {
      // Get invitation count
      const { data: invitations, error: invError } = await supabase
        .from('visit_invitations')
        .select('id, created_at, status')
        .gte('created_at', `${fromDate}T00:00:00.000Z`)
        .lte('created_at', `${toDate}T23:59:59.999Z`);

      if (invError) throw invError;

      // Get visitor count
      const { data: visitors, error: visitorError } = await supabase
        .from('visitors')
        .select('id, created_at')
        .gte('created_at', `${fromDate}T00:00:00.000Z`)
        .lte('created_at', `${toDate}T23:59:59.999Z`);

      if (visitorError) throw visitorError;

      // Get access codes used
      const { data: accessCodes, error: accessError } = await supabase
        .from('access_codes')
        .select('id, used_at')
        .not('used_at', 'is', null)
        .gte('used_at', `${fromDate}T00:00:00.000Z`)
        .lte('used_at', `${toDate}T23:59:59.999Z`);

      if (accessError) throw accessError;

      setSummaryStats({
        totalVisitors: visitors?.length || 0,
        totalInvitations: invitations?.length || 0,
        accessGranted: accessCodes?.length || 0,
        averageProcessingTime: 2.5, // Mock data - would calculate from actual timestamps
        securityIncidents: 0 // Would come from incidents table
      });

    } catch (error) {
      console.error('Failed to load summary stats:', error);
    }
  };

  const loadDetailedAnalytics = async (fromDate: string, toDate: string) => {
    try {
      // Get daily visitor data
      const { data: visitors, error: visitorError } = await supabase
        .from('visitors')
        .select('created_at')
        .gte('created_at', `${fromDate}T00:00:00.000Z`)
        .lte('created_at', `${toDate}T23:59:59.999Z`);

      if (visitorError) throw visitorError;

      // Get daily access grants
      const { data: accessCodes, error: accessError } = await supabase
        .from('access_codes')
        .select('used_at')
        .not('used_at', 'is', null)
        .gte('used_at', `${fromDate}T00:00:00.000Z`)
        .lte('used_at', `${toDate}T23:59:59.999Z`);

      if (accessError) throw accessError;

      // Get invitation statuses
      const { data: invitations, error: invError } = await supabase
        .from('visit_invitations')
        .select('status, visit_purpose')
        .gte('created_at', `${fromDate}T00:00:00.000Z`)
        .lte('created_at', `${toDate}T23:59:59.999Z`);

      if (invError) throw invError;

      // Process daily visitors data
      const dailyData: { [key: string]: { visitors: number; entries: number } } = {};
      
      visitors?.forEach(visitor => {
        const date = new Date(visitor.created_at).toISOString().split('T')[0];
        if (!dailyData[date]) dailyData[date] = { visitors: 0, entries: 0 };
        dailyData[date].visitors++;
      });

      accessCodes?.forEach(code => {
        const date = new Date(code.used_at!).toISOString().split('T')[0];
        if (!dailyData[date]) dailyData[date] = { visitors: 0, entries: 0 };
        dailyData[date].entries++;
      });

      const dailyVisitors = Object.entries(dailyData).map(([date, counts]) => ({
        date: new Date(date).toLocaleDateString(),
        ...counts
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Process status data
      const statusCounts: { [key: string]: number } = {};
      invitations?.forEach(inv => {
        statusCounts[inv.status || 'unknown'] = (statusCounts[inv.status || 'unknown'] || 0) + 1;
      });

      const visitorsByStatus = Object.entries(statusCounts).map(([status, count], index) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        color: COLORS[index % COLORS.length]
      }));

      // Process purpose data
      const purposeCounts: { [key: string]: number } = {};
      invitations?.forEach(inv => {
        const purpose = inv.visit_purpose || 'Unknown';
        purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
      });

      const popularPurposes = Object.entries(purposeCounts).map(([purpose, count]) => ({
        purpose,
        count
      }));

      // Process peak hours
      const hourCounts: { [key: number]: number } = {};
      accessCodes?.forEach(code => {
        const hour = new Date(code.used_at!).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const peakHours = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: hourCounts[hour] || 0
      }));

      setAnalyticsData(prev => ({
        ...prev,
        dailyVisitors,
        visitorsByStatus,
        popularPurposes,
        peakHours,
        accessCodeUsage: accessCodes?.length || 0,
        pendingVerifications: statusCounts['pending'] || 0
      }));

    } catch (error) {
      console.error('Failed to load detailed analytics:', error);
    }
  };

  const loadTimeBasedData = async (fromDate: string, toDate: string) => {
    try {
      // This would generate time-based data for charts
      const timeData: TimeBasedData[] = [];
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        timeData.push({
          date: d.toLocaleDateString(),
          invitations: Math.floor(Math.random() * 20) + 5,
          visits: Math.floor(Math.random() * 15) + 2,
          incidents: Math.floor(Math.random() * 3)
        });
      }
      
      setTimeBasedData(timeData);
    } catch (error) {
      console.error('Failed to load time-based data:', error);
    }
  };

  const handlePeriodChange = (period: 'week' | 'month' | 'quarter') => {
    setSelectedPeriod(period);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Analytics data has been updated",
    });
  };

  const exportData = () => {
    // Create CSV data
    const csvData = [
      ['Date', 'Visitors', 'Entries'],
      ...analyticsData.dailyVisitors.map(day => [day.date, day.visitors, day.entries])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitor-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Analytics data has been exported to CSV",
    });
  };

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAnalytics}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Visitor flow insights and security analytics for {userProfile?.email}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Time Period:</span>
          </div>
          
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalVisitors}</div>
              <p className="text-xs text-muted-foreground">Registered visitors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invitations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalInvitations}</div>
              <p className="text-xs text-muted-foreground">Total invitations sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Access Granted</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.accessGranted}</div>
              <p className="text-xs text-muted-foreground">Successful entries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Process Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.averageProcessingTime}m</div>
              <p className="text-xs text-muted-foreground">Registration to entry</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.securityIncidents}</div>
              <p className="text-xs text-muted-foreground">Security events</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Visitors Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Visitor Flow</CardTitle>
                  <CardDescription>
                    Visitor registrations and gate entries over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.dailyVisitors}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="visitors" fill="#3b82f6" name="Registrations" />
                      <Bar dataKey="entries" fill="#10b981" name="Entries" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Invitation Status</CardTitle>
                  <CardDescription>
                    Distribution of invitation statuses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.visitorsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData.visitorsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Peak Hours */}
              <Card>
                <CardHeader>
                  <CardTitle>Peak Access Hours</CardTitle>
                  <CardDescription>
                    When visitors most commonly enter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.peakHours}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Visit Purposes */}
              <Card>
                <CardHeader>
                  <CardTitle>Visit Purposes</CardTitle>
                  <CardDescription>
                    Why visitors are coming
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.popularPurposes} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="purpose" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Time-based Trends</CardTitle>
                <CardDescription>
                  Invitations, visits, and incidents over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={timeBasedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="invitations" stroke="#3b82f6" name="Invitations" />
                    <Line type="monotone" dataKey="visits" stroke="#10b981" name="Visits" />
                    <Line type="monotone" dataKey="incidents" stroke="#ef4444" name="Incidents" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
