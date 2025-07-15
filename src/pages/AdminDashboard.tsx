import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDeletions, setPendingDeletions] = useState<any[]>([]);
  const [loadingCancel, setLoadingCancel] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // Fetch pending deletions
  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      const res = await fetch("/functions/v1/list-pending-deletions", {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok) {
        // Merge residents and visitors, tag with type
        const merged = [
          ...(data.residents || []).map((r: any) => ({ ...r, type: "resident" })),
          ...(data.visitors || []).map((v: any) => ({ ...v, type: "visitor" })),
        ];
        setPendingDeletions(merged);
      } else {
        toast({ title: "Error", description: data.error || "Failed to fetch pending deletions.", variant: "destructive" });
      }
    })();
  }, []);

  const handleCancelDeletion = async (userId: string) => {
    setLoadingCancel(userId);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        setLoadingCancel(null);
        return;
      }
      const res = await fetch("/functions/v1/delete-user-data", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cancel: true, userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setPendingDeletions((prev) => prev.filter((u) => u.id !== userId));
        toast({ title: "Deletion Canceled", description: "User's account deletion request has been canceled." });
      } else {
        toast({ title: "Error", description: data.error || "Failed to cancel deletion.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoadingCancel(null);
    }
  };

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

  const filteredDeletions = pendingDeletions
    .filter((u) =>
      (!roleFilter || u.role === roleFilter) &&
      (!search || u.email.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (!a.deletion_requested_at || !b.deletion_requested_at) return 0;
      const aDate = new Date(a.deletion_requested_at).getTime();
      const bDate = new Date(b.deletion_requested_at).getTime();
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {/* Pending Deletions Section */}
      <div className="mb-8 p-4 border rounded bg-muted/20">
        <h2 className="text-xl font-semibold mb-2">Pending Account Deletions</h2>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter} className="w-40">
            <option value="">All Roles</option>
            <option value="resident">Resident</option>
            <option value="visitor">Visitor</option>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder} className="w-40">
            <option value="asc">Sort: Soonest First</option>
            <option value="desc">Sort: Latest First</option>
          </Select>
        </div>
        {filteredDeletions.length === 0 ? (
          <p className="text-muted-foreground">No pending deletion requests.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Type</th>
                <th className="text-left">User ID</th>
                <th className="text-left">Email</th>
                <th className="text-left">Scheduled Deletion</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredDeletions.map((u) => (
                <tr key={u.id}>
                  <td>{u.type}</td>
                  <td>{u.id}</td>
                  <td>{u.email || u.email_encrypted || "-"}</td>
                  <td>{u.deletion_requested_at ? new Date(new Date(u.deletion_requested_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleString() : "-"}</td>
                  <td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelDeletion(u.id)}
                      disabled={loadingCancel === u.id}
                    >
                      {loadingCancel === u.id ? "Canceling..." : "Cancel Deletion"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
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