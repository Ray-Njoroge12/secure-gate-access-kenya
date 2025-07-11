import { Shield, Users, QrCode, Clock, ExternalLink, BarChart, User, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { InvitationForm } from "@/components/InvitationForm";
import { InvitationsList } from "@/components/InvitationsList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const Index = () => {
  const { toast } = useToast();
  const [activeInvitationsCount, setActiveInvitationsCount] = useState(0);
  const [qrCodesGeneratedCount, setQrCodesGeneratedCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-resident-invitations");
        if (error) throw error;

        const invitations = data || [];
        const active = invitations.filter((inv: any) => inv.status === "pending" || inv.status === "accepted").length;
        const qrGenerated = invitations.filter((inv: any) => inv.access_codes && inv.access_codes.length > 0).length;

        setActiveInvitationsCount(active);
        setQrCodesGeneratedCount(qrGenerated);
      } catch (error) {
        console.error("Error fetching counts:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      }
    };
    fetchCounts();

    // Real-time listener for invitations
    const invitationChannel = supabase
      .channel('public:visit_invitations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visit_invitations' },
        (payload) => {
          console.log('Change received!', payload);
          toast({
            title: "Real-time Update",
            description: `Invitation ${payload.eventType}: ${JSON.stringify(payload.new)}`,
          });
          fetchCounts(); // Re-fetch counts on change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invitationChannel);
    };
  }, [toast]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">SecureGate Kenya</h1>
                <p className="text-muted-foreground">Digital Visitor Management for Gated Communities</p>
              </div>
            </div>
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Invitations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeInvitationsCount}</div>
              <p className="text-xs text-muted-foreground">Active invitations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Codes Generated</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qrCodesGeneratedCount}</div>
              <p className="text-xs text-muted-foreground">QR codes generated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4s</div>
              <p className="text-xs text-muted-foreground">-0.3s from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => window.open('/visitor-registration', '_blank')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Visitor Registration</CardTitle>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                Portal for visitors to register using invitation tokens
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.open('/security-guard', '_blank')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Security Interface</CardTitle>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                Gate access validation and QR code scanning
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.open('/analytics', '_blank')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                Monitor system performance and visitor statistics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.open('/auth', '_blank')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Resident Portal</CardTitle>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                Sign in to manage your invitations and account
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="invite" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invite">Send Invitation</TabsTrigger>
            <TabsTrigger value="manage">Manage Invitations</TabsTrigger>
            <TabsTrigger value="pre-approved">Pre-Approved Visitors</TabsTrigger>
          </TabsList>

          <TabsContent value="invite" className="space-y-6">
            <InvitationForm />
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <InvitationsList />
          </TabsContent>

          <TabsContent value="pre-approved" className="space-y-6">
            <PreApprovedVisitors />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
