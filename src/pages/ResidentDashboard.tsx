import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvitationForm } from "@/components/InvitationForm";
import { InvitationsList } from "@/components/InvitationsList";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const ResidentDashboard = () => {
  const { toast } = useToast();
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeleteRequest = async () => {
    if (!window.confirm("Are you sure you want to request account deletion? Your data will be scheduled for deletion in 7 days. You can cancel this request within that period.")) {
      return;
    }
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        setLoading(false);
        return;
      }
      const res = await fetch("/functions/v1/delete-user-data", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        setDeletionRequested(true);
        toast({ title: "Deletion Requested", description: "Your account is scheduled for deletion in 7 days. Contact support to cancel." });
      } else {
        toast({ title: "Error", description: data.error || "Failed to request deletion.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Resident Dashboard</h1>
      {/* Data Deletion Section */}
      <div className="mb-8 p-4 border rounded bg-muted/20">
        <h2 className="text-xl font-semibold mb-2">Account Deletion</h2>
        <p className="mb-2 text-muted-foreground">
          You may request deletion of your account and all associated data. For security and legal reasons, deletion will be scheduled for 7 days after your request. You may contact support to cancel this request within the grace period.
        </p>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleDeleteRequest}
          disabled={loading || deletionRequested}
        >
          {deletionRequested ? "Deletion Requested" : loading ? "Requesting..." : "Request Account Deletion"}
        </button>
      </div>
      <Tabs defaultValue="invitations">
        <TabsList>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="pre-approved">Pre-Approved Visitors</TabsTrigger>
        </TabsList>
        <TabsContent value="invitations">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Create Invitation</h2>
              <InvitationForm />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-4">Your Invitations</h2>
              <InvitationsList />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="pre-approved">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Pre-approved visitors feature coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResidentDashboard;
