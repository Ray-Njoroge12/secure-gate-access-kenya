import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
} from 'lucide-react';

interface Profile { id?: string; user_id?: string; email?: string; role?: string; }
interface PeakHour { hour: number; count: number; }
interface PopularPurpose { purpose: string; count: number; }
interface AnalyticsData {
  totalInvitations: number;
  activeInvitations: number;
  completedVisits: number;
  averageVisitDuration: string;
  weeklyGrowth: number;
  monthlyGrowth: number;
  peakHours: PeakHour[];
  popularPurposes: PopularPurpose[];
  securityIncidents: number;
}
interface TimeBasedData { date: string; invitations: number; visits: number; incidents: number; }

const INITIAL_ANALYTICS: AnalyticsData = {
  totalInvitations: 0,
  activeInvitations: 0,
  completedVisits: 0,
  averageVisitDuration: 'N/A',
  weeklyGrowth: 0,
  monthlyGrowth: 0,
  peakHours: [],
  popularPurposes: [],
  securityIncidents: 0,
};

const Analytics = () => {
  const { session, loading: authLoading } = useAuthSession();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(INITIAL_ANALYTICS);
  const [timeBasedData, setTimeBasedData] = useState<TimeBasedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use real FastAPI endpoint
      const result = await apiClient.getDashboardAnalytics(selectedPeriod);

      if (result.error) {
        throw new Error(result.error);
      }

      const data = result.data!;

      // Transform data for frontend format
      setAnalyticsData({
        totalInvitations: data.summary.totalInvitations,
        activeInvitations: data.summary.activeInvitations,
        completedVisits: data.summary.completedVisits,
        averageVisitDuration: data.summary.averageVisitDuration,
        weeklyGrowth: data.summary.weeklyGrowth,
        monthlyGrowth: data.summary.monthlyGrowth,
        peakHours: data.peakHours,
        popularPurposes: data.popularPurposes,
        securityIncidents: data.summary.securityIncidents
      });

      // Transform time-based data
      const timeData: TimeBasedData[] = data.timeBasedData.map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        invitations: item.invitations,
        visits: item.visits,
        incidents: item.incidents
      }));

      setTimeBasedData(timeData);

    } catch (e: any) {
      const msg = e?.message || 'Failed to fetch analytics data';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod, toast]);

  // Initialize auth + profile + analytics
  useEffect(() => {
    const init = async () => {
      if (authLoading) return;
      if (!session?.user) { navigate('/'); return; }
      try {
        // TODO: Replace with actual FastAPI endpoint for profile
        // For now, use session data and assume role-based access
        console.log('Initializing analytics for user:', session.user.id);

        // Use session data for profile (will be replaced with real endpoint later)
        const profile = {
          id: session.user.id,
          user_id: session.user.id,
          role: 'admin', // Default to admin for analytics access - replace with real role check
          email: session.user.email || 'user@example.com'
        };

        if (!profile) { toast({ title: 'Error', description: 'Unable to verify your credentials', variant: 'destructive' }); navigate('/'); return; }
        if (profile.role && !['resident', 'guard', 'admin'].includes(profile.role)) {
          toast({ title: 'Access Denied', description: "You don't have permission to view analytics", variant: 'destructive' });
          navigate('/'); return; }
        setUserProfile(profile);
        await fetchAnalytics();
      } catch (e) {
        console.error('Analytics init error', e);
        toast({ title: 'Error', description: 'Failed to initialize analytics', variant: 'destructive' });
      }
    };
    init();
  }, [authLoading, session, navigate, toast, fetchAnalytics]);

  // Refetch when period changes (after initial load & userProfile present)
  useEffect(() => {
    if (userProfile) fetchAnalytics();
  }, [userProfile, selectedPeriod, fetchAnalytics]);

  const handleRefresh = async () => { setRefreshing(true); await fetchAnalytics(); };

  const handleExportData = async () => {
    try {
      const csvRows = timeBasedData.map(r => `${r.date},${r.invitations},${r.visits},${r.incidents}`);
      csvRows.unshift('Date,Invitations,Visits,Incidents');
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export Complete', description: 'Analytics data downloaded' });
    } catch {
      toast({ title: 'Export Failed', description: 'Unable to export analytics data', variant: 'destructive' });
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
          <CardHeader><CardTitle className="text-red-600">Error</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-wrap gap-4 justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-gray-600">Comprehensive insights into visitor management and security</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={selectedPeriod} onValueChange={(v: 'week' | 'month' | 'quarter') => setSelectedPeriod(v)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Period" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Refresh
            </Button>
            <Button onClick={handleExportData}><Download className="h-4 w-4 mr-2" />Export</Button>
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
              <div className="text-2xl font-bold">{analyticsData.totalInvitations}</div>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600">+{analyticsData.weeklyGrowth.toFixed(1)}% vs last period</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Invitations</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.activeInvitations}</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Visits</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.completedVisits}</div>
              <p className="text-xs text-muted-foreground">Access granted</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Visit Duration</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.averageVisitDuration}</div>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Over Time</CardTitle>
                    <CardDescription>Daily breakdown of invitations and visits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Chart visualization placeholder</p>
                        <p className="text-sm text-gray-500">{timeBasedData.length} data points for {selectedPeriod}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Visit Purposes</CardTitle>
                    <CardDescription>Most common reasons for visits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData.popularPurposes.map((purpose, index) => (
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
                      {analyticsData.popularPurposes.length === 0 && (
                        <p className="text-sm text-gray-500">No data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Growth Trends</CardTitle>
                  <CardDescription>Visitor management growth patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">+{analyticsData.weeklyGrowth.toFixed(1)}%</div>
                      <p className="text-sm text-blue-600">Weekly Growth</p>
                    </div>
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">+{analyticsData.monthlyGrowth.toFixed(1)}%</div>
                      <p className="text-sm text-green-600">Monthly Growth</p>
                    </div>
                    <div className="text-center p-6 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{((analyticsData.completedVisits)/(analyticsData.totalInvitations || 1) * 100).toFixed(1)}%</div>
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
                  <CardDescription>When visitors most often arrive</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.peakHours.map((hour, index) => (
                      <div key={hour.hour} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            index === 0 ? 'bg-red-500' :
                            index === 1 ? 'bg-orange-500' :
                            index === 2 ? 'bg-yellow-500' :
                            index === 3 ? 'bg-green-500' : 'bg-blue-500'
                          }`}>{index + 1}</div>
                          <span className="text-sm">{hour.hour}:00 - {hour.hour + 1}:00</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(hour.count / (analyticsData.peakHours[0]?.count || 1)) * 100}%` }} />
                          </div>
                          <span className="text-sm font-medium">{hour.count}</span>
                        </div>
                      </div>
                    ))}
                    {analyticsData.peakHours.length === 0 && (
                      <p className="text-sm text-gray-500">No peak hour data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Overview</CardTitle>
                  <CardDescription>Access control & incident metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-600" /><span className="text-sm">Successful Access</span></div>
                        <span className="font-bold text-green-600">{analyticsData.completedVisits}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-red-600" /><span className="text-sm">Security Incidents</span></div>
                        <span className="font-bold text-red-600">{analyticsData.securityIncidents}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-yellow-600" /><span className="text-sm">Pending Approvals</span></div>
                        <span className="font-bold text-yellow-600">{analyticsData.activeInvitations}</span>
                      </div>
                    </div>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Security metrics chart</p>
                        <p className="text-sm text-gray-500">Placeholder visualization</p>
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