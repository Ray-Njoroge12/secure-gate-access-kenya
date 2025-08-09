import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Users, QrCode, Clock, Plus, Mail, Calendar, CheckCircle, XCircle, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SharedNavigation } from "@/components/SharedNavigation";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface DashboardStats {
  activeInvitations: number;
  totalInvitations: number;
  pendingInvitations: number;
  completedVisits: number;
  recentVisitors: number;
}

const ResidentDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    activeInvitations: 0,
    totalInvitations: 0,
    pendingInvitations: 0,
    completedVisits: 0,
    recentVisitors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        
        // Check user authentication
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
            description: "You need resident privileges to access this dashboard",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        const userProfileData = profile;
        if (userProfileData.role !== 'resident') {
          toast({
            title: "Access Denied",
            description: "You need resident privileges to access this dashboard",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setUserProfile(userProfileData);

        // Fetch dashboard statistics using Edge Function for security
        const { data: dashboardData, error: statsError } = await supabase.functions.invoke(
          "get-resident-dashboard-stats",
          {
            body: { resident_id: session.user.id }
          }
        );

        if (statsError) throw statsError;

        setStats({
          activeInvitations: dashboardData?.activeInvitations || 0,
          totalInvitations: dashboardData?.totalInvitations || 0,
          pendingInvitations: dashboardData?.pendingInvitations || 0,
          completedVisits: dashboardData?.completedVisits || 0,
          recentVisitors: dashboardData?.recentVisitors || 0,
        });

        setLoading(false);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    fetchDashboardData();
  }, [navigate, toast]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-invitation':
        // The tab will handle this
        break;
      case 'view-history':
        toast({
          title: "Coming Soon",
          description: "Visit history feature will be available soon",
        });
        break;
      case 'settings':
        toast({
          title: "Coming Soon",
          description: "Settings panel will be available soon",
        });
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <SharedNavigation 
          userRole="resident"
          userName={userProfile?.email}
          userEmail={userProfile?.email}
        />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle>Error Loading Dashboard</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SharedNavigation 
        userRole="resident"
        userName={userProfile?.email}
        userEmail={userProfile?.email}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, Resident!</h1>
          <p className="text-muted-foreground">
            Manage your visitor invitations and monitor access to your community.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Invitations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvitations}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Visits</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedVisits}</div>
              <p className="text-xs text-muted-foreground">Successful visits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Visitors</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentVisitors}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4s</div>
              <p className="text-xs text-muted-foreground">Average</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleQuickAction('new-invitation')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Send New Invitation</h3>
                  <p className="text-sm text-muted-foreground">Invite a visitor to your community</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleQuickAction('view-history')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">View History</h3>
                  <p className="text-sm text-muted-foreground">Check past visitor records</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleQuickAction('settings')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Settings</h3>
                  <p className="text-sm text-muted-foreground">Manage your preferences</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="invitations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Invitations
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Invitation
            </TabsTrigger>
            <TabsTrigger value="pre-approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Pre-Approved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invitations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Your Invitations</h2>
                <p className="text-muted-foreground">Manage and track your visitor invitations</p>
              </div>
              <Badge variant="secondary">
                {stats.activeInvitations} Active
              </Badge>
            </div>
            {/* InvitationsList component would go here */}
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Create New Invitation</h2>
              <p className="text-muted-foreground mb-6">
                Send an invitation to a visitor with all necessary details
              </p>
            </div>
            {/* InvitationForm component would go here */}
          </TabsContent>

          <TabsContent value="pre-approved" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Pre-Approved Visitors</h2>
              <p className="text-muted-foreground mb-6">
                Manage visitors who have recurring access to your community
              </p>
            </div>
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md">
                  Pre-approved visitors feature is under development. You'll be able to create 
                  recurring access for frequent visitors like family members, service providers, 
                  and trusted contacts.
                </p>
                <Button className="mt-4" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pre-Approved Visitor
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ResidentDashboard;
