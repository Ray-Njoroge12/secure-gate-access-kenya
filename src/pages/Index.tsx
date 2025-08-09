import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, QrCode, Clock, ExternalLink, BarChart, User, LogOut, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }

        // Get user profile and role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          console.error('Error fetching profile:', profileError);
          toast({
            title: "Error",
            description: "Failed to load user profile",
            variant: "destructive",
          });
          return;
        }

        const userProfileData = profile;
        setUserProfile(userProfileData);
        setUserRole(userProfileData.role || null);
        
        // Auto-redirect based on role
        switch (userProfileData.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'guard':
            navigate('/security-guard');
            break;
          case 'resident':
            navigate('/resident-dashboard');
            break;
          default:
            // Show role selection if no role is set
            setLoading(false);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Error fetching user role:', errorMessage);
      }
    };

    getUserRole();
  }, [navigate, toast]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      navigate('/login');
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleRoleSelection = async (role: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userProfile?.id);

      if (error) throw error;

      setUserRole(role);
      toast({
        title: "Role Updated",
        description: `Your role has been set to ${role}`,
      });

      // Redirect based on selected role
      switch (role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'guard':
          navigate('/security-guard');
          break;
        case 'resident':
          navigate('/resident-dashboard');
          break;
        default:
          break;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show role selection if user has no role
  if (!userRole) {
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
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Welcome to SecureGate Kenya</h2>
              <p className="text-muted-foreground text-lg">
                Please select your role to access the appropriate dashboard
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => handleRoleSelection('resident')}>
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mx-auto mb-4">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Resident</CardTitle>
                  <CardDescription>
                    Manage visitor invitations, view access logs, and control who enters your community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Send visitor invitations</li>
                    <li>• Manage active invitations</li>
                    <li>• View visitor history</li>
                    <li>• Pre-approve frequent visitors</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleRoleSelection('guard')}>
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Security Guard</CardTitle>
                  <CardDescription>
                    Verify visitor access, scan QR codes, and maintain security at the gate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• QR code verification</li>
                    <li>• Visitor search</li>
                    <li>• Incident reporting</li>
                    <li>• Access monitoring</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleRoleSelection('admin')}>
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mx-auto mb-4">
                    <BarChart className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Administrator</CardTitle>
                  <CardDescription>
                    System management, user administration, and community oversight
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• User management</li>
                    <li>• System analytics</li>
                    <li>• Security reports</li>
                    <li>• System configuration</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This should not be reached due to auto-redirect, but just in case
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
