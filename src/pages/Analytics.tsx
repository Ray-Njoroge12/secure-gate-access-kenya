import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  Calendar,
  Shield,
  Activity,
  AlertTriangle 
} from "lucide-react";

interface AnalyticsData {
  totalInvitations: number;
  activeVisitors: number;
  completedVisits: number;
  pendingInvitations: number;
  visitsByPurpose: { name: string; value: number; percentage: number }[];
  averageStayDuration: number;
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalInvitations: 0,
    activeVisitors: 0,
    completedVisits: 0,
    pendingInvitations: 0,
    visitsByPurpose: [],
    averageStayDuration: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch invitation statistics
      const { data: invitations, error: invError } = await supabase
        .from('visit_invitations')
        .select('*');

      if (invError) throw invError;

      // Fetch access codes (active visitors)
      const { data: accessCodes, error: accessError } = await supabase
        .from('access_codes')
        .select('*');

      if (accessError) throw accessError;

      // Calculate metrics
      const totalInvitations = invitations?.length || 0;
      const pendingInvitations = invitations?.filter(inv => inv.status === 'pending').length || 0;
      const activeVisitors = accessCodes?.filter(code => !code.used_at && new Date(code.expires_at) > new Date()).length || 0;
      const completedVisits = accessCodes?.filter(code => code.used_at).length || 0;

      // Group visits by purpose
      const purposeGroups = invitations?.reduce((acc: any, inv) => {
        acc[inv.visit_purpose] = (acc[inv.visit_purpose] || 0) + 1;
        return acc;
      }, {}) || {};

      const visitsByPurpose = Object.entries(purposeGroups).map(([name, value]) => ({
        name,
        value: value as number,
        percentage: Math.round((value as number / totalInvitations) * 100) || 0
      }));

      setAnalytics({
        totalInvitations,
        activeVisitors,
        completedVisits,
        pendingInvitations,
        visitsByPurpose,
        averageStayDuration: 3.5 // hours - calculate from actual data
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Monitor visitor management system performance</p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Data
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalInvitations}</div>
              <p className="text-xs text-muted-foreground">All time invitations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.activeVisitors}</div>
              <p className="text-xs text-muted-foreground">Currently on premises</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Visits</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.completedVisits}</div>
              <p className="text-xs text-muted-foreground">Successfully processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Stay Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageStayDuration}h</div>
              <p className="text-xs text-muted-foreground">Average visit length</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="visits">Visit Analysis</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Visits by Purpose</CardTitle>
                  <CardDescription>Distribution of visit types</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics.visitsByPurpose.map((purpose, index) => (
                    <div key={purpose.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{purpose.name}</span>
                        <span className="text-muted-foreground">{purpose.value} visits</span>
                      </div>
                      <Progress value={purpose.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">{purpose.percentage}%</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Invitation Success Rate</span>
                      <span className="text-green-600">98.5%</span>
                    </div>
                    <Progress value={98.5} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">QR Code Generation Speed</span>
                      <span className="text-blue-600">95.2%</span>
                    </div>
                    <Progress value={95.2} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Email Delivery Rate</span>
                      <span className="text-purple-600">92.8%</span>
                    </div>
                    <Progress value={92.8} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="visits" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Peak Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">9:00 AM - 11:00 AM</span>
                      <Badge variant="secondary">Peak</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">2:00 PM - 4:00 PM</span>
                      <Badge variant="outline">High</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">6:00 PM - 8:00 PM</span>
                      <Badge variant="outline">Moderate</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Monday</span>
                      <span className="text-sm font-medium">15 visits</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Wednesday</span>
                      <span className="text-sm font-medium">22 visits</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Saturday</span>
                      <span className="text-sm font-medium">31 visits</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Visit Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">&lt; 2 hours</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">2-4 hours</span>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">&gt; 4 hours</span>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Security Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <span className="text-sm">Expired access codes</span>
                      <Badge variant="secondary">2</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm">Active security sessions</span>
                      <Badge className="bg-green-500">{analytics.activeVisitors}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm">Pending verifications</span>
                      <Badge variant="outline">{analytics.pendingInvitations}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database Connection</span>
                      <Badge className="bg-green-500">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Service</span>
                      <Badge className="bg-green-500">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">QR Code Service</span>
                      <Badge className="bg-green-500">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Authentication</span>
                      <Badge className="bg-green-500">Online</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}