import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleTestDatabase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("visit_invitations")
        .select("*")
        .limit(5);

      if (error) throw error;

      toast({
        title: "Database Connection",
        description: `Successfully connected! Found ${data?.length || 0} invitations.`,
      });
    } catch (error) {
      console.error("Database test error:", error);
      toast({
        title: "Database Error",
        description: "Failed to connect to database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke("reset-user-password", {
        body: { userId },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      console.error("Error resetting password:", error);
    }
  };

  const handleCleanOldInvitations = async () => {
    try {
      const { error } = await supabase.functions.invoke("clean-old-invitations");

      if (error) throw error;

      toast({
        title: "Success",
        description: "Old invitations cleaned successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      console.error("Error cleaning old invitations:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Basic admin dashboard for visitor management system.
            </p>
            <Button 
              onClick={handleTestDatabase} 
              disabled={isLoading}
            >
              {isLoading ? "Testing..." : "Test Database Connection"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                View All Invitations
              </Button>
              <Button variant="outline" className="w-full">
                System Reports
              </Button>
              <Button variant="outline" className="w-full">
                Backup Data
              </Button>
              <Button variant="destructive" className="w-full" onClick={handleCleanOldInvitations}>
                Clean Old Invitations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;